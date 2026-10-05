import fs from 'fs';
import path from 'path';
import { Registration, RegistrationInput, StatsSummary } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'registrations.json');

// In-memory fallback cache (essential for Vercel serverless persistence)
let memoryCache: Registration[] = [];
let lastFetchedTime = 0;
const CACHE_TTL_MS = 3000;

// Read-safe check for local files
function readLocalFile(): Registration[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('Filesystem read not available or empty:', err);
  }
  return [];
}

// Write-safe helper for local files
function writeLocalFile(registrations: Registration[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(registrations, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Filesystem write skipped (running in serverless):', err);
  }
}

// Merge two lists without losing any registrations
function mergeRegistrations(listA: Registration[], listB: Registration[]): Registration[] {
  const map = new Map<string, Registration>();
  
  // Add listB first (e.g. local)
  for (const item of listB) {
    if (item && item.id) map.set(item.id, item);
  }
  
  // Merge listA (e.g. Google Sheets)
  for (const item of listA) {
    if (item && item.id) {
      const existing = map.get(item.id);
      if (existing) {
        // preserve announced status if toggled locally
        map.set(item.id, { ...existing, ...item, announced: existing.announced || item.announced });
      } else {
        map.set(item.id, item);
      }
    }
  }

  // Return sorted by date or order
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAllRegistrations(): Promise<Registration[]> {
  const now = Date.now();

  // If memory cache exists and is fresh, return immediately
  if (memoryCache.length > 0 && now - lastFetchedTime < CACHE_TTL_MS) {
    return memoryCache;
  }

  // Load from local file as baseline
  const localList = readLocalFile();
  if (localList.length > 0 && memoryCache.length === 0) {
    memoryCache = localList;
  }

  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  // Fetch live from Google Sheets if configured
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(webhookUrl, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.registrations)) {
          // Merge with memoryCache so we never delete existing local registrations
          memoryCache = mergeRegistrations(data.registrations as Registration[], memoryCache);
          lastFetchedTime = Date.now();
          writeLocalFile(memoryCache);
          return memoryCache;
        }
      }
    } catch (err) {
      console.warn('Google Sheets fetch failed or timed out, preserving cache:', err);
    }
  }

  return memoryCache;
}

export async function saveRegistration(input: RegistrationInput): Promise<Registration> {
  const currentList = await getAllRegistrations();

  // Unique permanent ID so entries can NEVER overwrite each other
  const uniqueId = `REG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  // Calculate next sequential Sr No based on total count
  const nextSrNo = currentList.length + 1;

  const newEntry: Registration = {
    id: uniqueId,
    srNo: nextSrNo,
    name: input.name.trim(),
    phone: input.phone.trim(),
    category: input.category,
    clubName: input.category === 'guest' ? 'N/A' : (input.clubName.trim() || 'N/A'),
    isCouncilMember: Boolean(input.isCouncilMember),
    councilDesignation: input.isCouncilMember ? (input.councilDesignation?.trim() || 'District Council Member') : undefined,
    isBodMember: Boolean(input.isBodMember),
    bodDesignation: input.isBodMember ? (input.bodDesignation?.trim() || 'Board of Directors') : undefined,
    announced: false,
    createdAt: new Date().toISOString(),
  };

  // Safe prepend: NEVER filter out or delete existing entries!
  const updatedList = [newEntry, ...currentList];
  memoryCache = updatedList;
  writeLocalFile(updatedList);

  // Sync to Google Sheets if configured
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
    } catch (err) {
      console.error('Failed to post to Google Sheets webhook:', err);
    }
  }

  return newEntry;
}

export async function toggleAnnounced(id: string): Promise<Registration | null> {
  const registrations = await getAllRegistrations();
  const index = registrations.findIndex((r) => r.id === id || String(r.srNo) === id);
  if (index === -1) return null;

  registrations[index].announced = !registrations[index].announced;
  memoryCache = registrations;
  writeLocalFile(registrations);

  // Sync toggle to Google Sheets if configured
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (webhookUrl && webhookUrl.startsWith('http')) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TOGGLE_ANNOUNCED', id, srNo: registrations[index].srNo }),
    }).catch((err) => console.warn('Toggle sync to Google Sheet skipped:', err));
  }

  return registrations[index];
}

export async function deleteRegistration(id: string): Promise<boolean> {
  const registrations = await getAllRegistrations();
  const filtered = registrations.filter((r) => r.id !== id && String(r.srNo) !== id);
  if (filtered.length === registrations.length) return false;

  memoryCache = filtered;
  writeLocalFile(filtered);
  return true;
}

/**
 * Protocol Order based on installation requirements:
 * 1. Council members who are Rotaractors
 * 2. Rotarians
 * 3. Rotaractors who are NOT council
 * 4. Guests
 */
export function getSortedByProtocol(registrations: Registration[]): {
  councilRotaractors: Registration[];
  rotarians: Registration[];
  regularRotaractors: Registration[];
  guests: Registration[];
  allSorted: Registration[];
} {
  const councilRotaractors = registrations.filter(
    (r) => r.category === 'rotaractor' && r.isCouncilMember
  );
  const rotarians = registrations.filter((r) => r.category === 'rotarian');
  const regularRotaractors = registrations.filter(
    (r) => r.category === 'rotaractor' && !r.isCouncilMember
  );
  const guests = registrations.filter((r) => r.category === 'guest');

  const allSorted = [
    ...councilRotaractors,
    ...rotarians,
    ...regularRotaractors,
    ...guests,
  ];

  return {
    councilRotaractors,
    rotarians,
    regularRotaractors,
    guests,
    allSorted,
  };
}

export function computeStats(registrations: Registration[]): StatsSummary {
  const { councilRotaractors, rotarians, regularRotaractors, guests } = getSortedByProtocol(registrations);
  const announcedCount = registrations.filter((r) => r.announced).length;

  return {
    total: registrations.length,
    councilRotaractors: councilRotaractors.length,
    rotarians: rotarians.length,
    regularRotaractors: regularRotaractors.length,
    guests: guests.length,
    announcedCount,
    pendingCount: registrations.length - announcedCount,
  };
}
