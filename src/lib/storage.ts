import fs from 'fs';
import path from 'path';
import { Registration, RegistrationInput, StatsSummary } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'registrations.json');

// In-memory fallback cache (essential for Vercel serverless persistence)
let memoryCache: Registration[] | null = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 3000;

// Read-safe check for local files
function readLocalFile(): Registration[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data) as Registration[];
    }
  } catch (err) {
    // Expected on serverless environments with restricted filesystem
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
    // Vercel serverless has a read-only filesystem; in-memory cache & Google Sheets take over
    console.warn('Filesystem write skipped (running in serverless):', err);
  }
}

export async function getAllRegistrations(): Promise<Registration[]> {
  const now = Date.now();

  // Return cache immediately if within TTL
  if (memoryCache !== null && now - lastFetchedTime < CACHE_TTL_MS) {
    return memoryCache;
  }

  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  // 1. If Google Sheet Webhook is configured, fetch live from Google Sheets
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
          memoryCache = data.registrations as Registration[];
          lastFetchedTime = Date.now();
          return memoryCache;
        }
      }
    } catch (err) {
      console.warn('Google Sheets fetch failed or timed out, falling back to cache:', err);
    }
  }

  // 2. Return memory cache if available
  if (memoryCache !== null) {
    return memoryCache;
  }

  // 3. Fallback to local JSON file
  const local = readLocalFile();
  memoryCache = local;
  return local;
}

export async function saveRegistration(input: RegistrationInput): Promise<Registration> {
  const currentList = await getAllRegistrations();

  const srNo = currentList.length + 1;

  const newEntry: Registration = {
    id: String(srNo),
    srNo: srNo,
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

  // Prepend new entry
  const updatedList = [newEntry, ...currentList.filter((r) => r.id !== newEntry.id)];
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
  const index = registrations.findIndex((r) => r.id === id);
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
      body: JSON.stringify({ action: 'TOGGLE_ANNOUNCED', id }),
    }).catch((err) => console.warn('Toggle sync to Google Sheet skipped:', err));
  }

  return registrations[index];
}

export async function deleteRegistration(id: string): Promise<boolean> {
  const registrations = await getAllRegistrations();
  const filtered = registrations.filter((r) => r.id !== id);
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
