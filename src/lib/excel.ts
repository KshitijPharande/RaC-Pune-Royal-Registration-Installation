import * as XLSX from 'xlsx';
import { Registration } from '@/types';
import { getSortedByProtocol } from './storage';

export function createExcelWorkbook(registrations: Registration[]): XLSX.WorkBook {
  const { councilRotaractors, rotarians, regularRotaractors, guests, allSorted } =
    getSortedByProtocol(registrations);

  const wb = XLSX.utils.book_new();

  const formatRow = (r: Registration, idx: number, priorityLabel: string) => ({
    'Sr No': idx + 1,
    'Priority Category': priorityLabel,
    'Full Name': r.name,
    'Phone / WhatsApp': r.phone,
    'Category': r.category.toUpperCase(),
    'Club Name': r.clubName,
    'District Council?': r.isCouncilMember ? 'YES' : 'NO',
    'Council Designation': r.councilDesignation || '-',
    'Club BOD Member?': r.isBodMember ? 'YES' : 'NO',
    'Club BOD Designation': r.bodDesignation || (r.category === 'rotaractor' ? 'General Member' : '-'),
    'Announced by Anchor': r.announced ? 'YES' : 'NO',
    'Registration Time': new Date(r.createdAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  });

  // Sheet 1: Master Protocol List
  const masterData = allSorted.map((r, i) => {
    let label = '4. Guest';
    if (r.category === 'rotaractor' && r.isCouncilMember) label = '1. Council Rotaractor';
    else if (r.category === 'rotarian') label = '2. Rotarian';
    else if (r.category === 'rotaractor') label = '3. General Rotaractor';
    return formatRow(r, i, label);
  });
  const wsMaster = XLSX.utils.json_to_sheet(masterData);
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Master Protocol Order');

  // Sheet 2: Council Members
  if (councilRotaractors.length > 0) {
    const wsCouncil = XLSX.utils.json_to_sheet(
      councilRotaractors.map((r, i) => formatRow(r, i, 'Council Rotaractor'))
    );
    XLSX.utils.book_append_sheet(wb, wsCouncil, 'District Council');
  }

  // Sheet 3: Rotarians
  if (rotarians.length > 0) {
    const wsRotarians = XLSX.utils.json_to_sheet(
      rotarians.map((r, i) => formatRow(r, i, 'Rotarian'))
    );
    XLSX.utils.book_append_sheet(wb, wsRotarians, 'Rotarians');
  }

  // Sheet 4: Rotaractors
  if (regularRotaractors.length > 0) {
    const wsRotaractors = XLSX.utils.json_to_sheet(
      regularRotaractors.map((r, i) => formatRow(r, i, 'General Rotaractor'))
    );
    XLSX.utils.book_append_sheet(wb, wsRotaractors, 'Rotaractors');
  }

  // Sheet 5: Guests
  if (guests.length > 0) {
    const wsGuests = XLSX.utils.json_to_sheet(
      guests.map((r, i) => formatRow(r, i, 'Guest'))
    );
    XLSX.utils.book_append_sheet(wb, wsGuests, 'Guests');
  }

  return wb;
}
