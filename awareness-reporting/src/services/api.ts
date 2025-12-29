import type { User, Invitation, Event, Shift, Report, GDPRSettings } from '../types';

const API_BASE = 'http://localhost:3001/api';

// Store auth state
let currentUser: User | null = null;
let authToken: string | null = null;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-User-Id': currentUser?.id || '',
  'Authorization': authToken ? `Bearer ${authToken}` : '',
});

// Auth API
export const authApi = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    currentUser = data.user;
    authToken = data.token;
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    return data.user;
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get user');
    return res.json();
  },

  logout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  restoreSession() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (user && token) {
      currentUser = JSON.parse(user);
      authToken = token;
      return currentUser;
    }
    return null;
  },
};

// Invitation API
export const invitationApi = {
  async create(email: string, role: 'organizer' | 'team_member', createdBy: string): Promise<Invitation> {
    const res = await fetch(`${API_BASE}/invitations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, role, createdBy }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create invitation');
    }
    return res.json();
  },

  async getByToken(token: string): Promise<Invitation> {
    const res = await fetch(`${API_BASE}/invitations/${token}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Invalid invitation');
    }
    return res.json();
  },

  async accept(token: string, name: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/invitations/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to accept invitation');
    }
    const data = await res.json();
    currentUser = data.user;
    authToken = data.token;
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    return data;
  },

  async decline(token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/invitations/${token}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to decline invitation');
  },

  async getAll(): Promise<Invitation[]> {
    const res = await fetch(`${API_BASE}/invitations`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch invitations');
    return res.json();
  },
};

// User API
export const userApi = {
  async getAll(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
};

// Event API
export const eventApi = {
  async create(name: string, date: string, organizerId: string, retentionDays?: number): Promise<Event> {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, date, organizerId, retentionDays }),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
  },

  async getAll(): Promise<Event[]> {
    const res = await fetch(`${API_BASE}/events`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async getById(id: string): Promise<Event> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch event');
    return res.json();
  },
};

// Shift API
export const shiftApi = {
  async create(
    eventId: string,
    name: string,
    teamMembers: string[],
    startTime?: string,
    endTime?: string
  ): Promise<Shift> {
    const res = await fetch(`${API_BASE}/shifts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ eventId, name, teamMembers, startTime, endTime }),
    });
    if (!res.ok) throw new Error('Failed to create shift');
    return res.json();
  },

  async getByEvent(eventId: string): Promise<Shift[]> {
    const res = await fetch(`${API_BASE}/events/${eventId}/shifts`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch shifts');
    return res.json();
  },
};

// Report API
export const reportApi = {
  async submit(
    eventId: string,
    shiftId: string,
    submittedBy: string,
    incidentDescription: string,
    hasPotentialPII: boolean
  ): Promise<Report> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ eventId, shiftId, submittedBy, incidentDescription, hasPotentialPII }),
    });
    if (!res.ok) throw new Error('Failed to submit report');
    return res.json();
  },

  async getByEvent(eventId: string): Promise<Report[]> {
    const res = await fetch(`${API_BASE}/events/${eventId}/reports`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async getMyReports(): Promise<Report[]> {
    const res = await fetch(`${API_BASE}/reports/my-reports`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },
};

// GDPR API
export const gdprApi = {
  async getSettings(): Promise<GDPRSettings> {
    const res = await fetch(`${API_BASE}/gdpr/settings`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch GDPR settings');
    return res.json();
  },

  async updateSettings(settings: Partial<GDPRSettings>): Promise<GDPRSettings> {
    const res = await fetch(`${API_BASE}/gdpr/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update GDPR settings');
    return res.json();
  },
};
