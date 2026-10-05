export type AttendeeCategory = 'rotaractor' | 'rotarian' | 'guest';

export interface Registration {
  id: string;
  srNo?: number;
  name: string;
  phone: string;
  category: AttendeeCategory;
  clubName: string;
  isCouncilMember: boolean;
  councilDesignation?: string;
  isBodMember?: boolean;
  bodDesignation?: string;
  announced: boolean;
  createdAt: string;
}

export interface RegistrationInput {
  name: string;
  phone: string;
  category: AttendeeCategory;
  clubName: string;
  isCouncilMember: boolean;
  councilDesignation?: string;
  isBodMember?: boolean;
  bodDesignation?: string;
}

export interface StatsSummary {
  total: number;
  councilRotaractors: number;
  rotarians: number;
  regularRotaractors: number;
  guests: number;
  announcedCount: number;
  pendingCount: number;
}
