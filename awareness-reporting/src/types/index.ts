export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'organizer' | 'team_member';
  createdAt: string;
  invitedBy?: string;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: 'organizer' | 'team_member';
  expiresAt: string;
  createdBy: string;
  accepted: boolean;
  declined: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  organizerId: string;
  organizerName: string;
  createdAt: string;
  retentionDays?: number; // GDPR: configurable retention
}

export interface Shift {
  id: string;
  eventId: string;
  name: string;
  teamMembers: string[]; // user IDs
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  eventId: string;
  shiftId: string;
  submittedBy: string; // user ID
  submittedByName: string;
  incidentDescription: string;
  hasPotentialPII: boolean; // GDPR: PII detection flag
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface GDPRSettings {
  defaultRetentionDays: number;
  inviteExpirationHours: number;
}
