import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database (dummy backend)
const db = {
  users: [
    {
      id: 'admin-1',
      email: 'admin@club.com',
      name: 'Admin User',
      role: 'admin',
      password: 'admin123', // In production, use hashed passwords
      createdAt: new Date().toISOString()
    },
    // Test Organizers
    {
      id: 'org-1',
      email: 'sarah.organizer@club.com',
      name: 'Sarah Martinez',
      role: 'organizer',
      password: 'organizer123',
      invitedBy: 'admin-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'org-2',
      email: 'mike.events@club.com',
      name: 'Mike Johnson',
      role: 'organizer',
      password: 'organizer123',
      invitedBy: 'admin-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'org-3',
      email: 'lisa.coordinator@club.com',
      name: 'Lisa Chen',
      role: 'organizer',
      password: 'organizer123',
      invitedBy: 'admin-1',
      createdAt: new Date().toISOString()
    },
    // Test Team Members
    {
      id: 'team-1',
      email: 'alex.member@club.com',
      name: 'Alex Thompson',
      role: 'team_member',
      password: 'team123',
      invitedBy: 'admin-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'team-2',
      email: 'jordan.smith@club.com',
      name: 'Jordan Smith',
      role: 'team_member',
      password: 'team123',
      invitedBy: 'org-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'team-3',
      email: 'emma.williams@club.com',
      name: 'Emma Williams',
      role: 'team_member',
      password: 'team123',
      invitedBy: 'org-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'team-4',
      email: 'noah.davis@club.com',
      name: 'Noah Davis',
      role: 'team_member',
      password: 'team123',
      invitedBy: 'org-2',
      createdAt: new Date().toISOString()
    },
    {
      id: 'team-5',
      email: 'olivia.brown@club.com',
      name: 'Olivia Brown',
      role: 'team_member',
      password: 'team123',
      invitedBy: 'org-2',
      createdAt: new Date().toISOString()
    },
    {
      id: 'team-6',
      email: 'james.miller@club.com',
      name: 'James Miller',
      role: 'team_member',
      password: 'team123',
      invitedBy: 'org-3',
      createdAt: new Date().toISOString()
    },
    {
      id: 'team-7',
      email: 'sophia.garcia@club.com',
      name: 'Sophia Garcia',
      role: 'team_member',
      password: 'team123',
      invitedBy: 'org-3',
      createdAt: new Date().toISOString()
    },
    {
      id: 'team-8',
      email: 'liam.martinez@club.com',
      name: 'Liam Martinez',
      role: 'team_member',
      password: 'team123',
      invitedBy: 'org-1',
      createdAt: new Date().toISOString()
    }
  ],
  invitations: [],
  events: [],
  shifts: [],
  reports: [],
  gdprSettings: {
    defaultRetentionDays: 90,
    inviteExpirationHours: 72
  }
};

// Helper functions
const generateToken = () => crypto.randomBytes(32).toString('hex');
const generateId = () => crypto.randomUUID();

// Clean expired invitations
const cleanExpiredInvitations = () => {
  const now = new Date();
  db.invitations = db.invitations.filter(inv => new Date(inv.expiresAt) > now);
};

// GDPR: Clean old reports based on retention policy
const cleanOldReports = () => {
  const now = new Date();
  db.reports = db.reports.filter(report => {
    const event = db.events.find(e => e.id === report.eventId);
    if (!event) return false;
    
    const retentionDays = event.retentionDays || db.gdprSettings.defaultRetentionDays;
    const eventDate = new Date(event.date);
    const expiryDate = new Date(eventDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    
    return now < expiryDate;
  });
};

// Run cleanup every hour
setInterval(() => {
  cleanExpiredInvitations();
  cleanOldReports();
}, 60 * 60 * 1000);

// ============== AUTH ROUTES ==============

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token: generateToken() });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  // In a real app, verify JWT token
  const userId = req.headers['x-user-id'];
  const user = db.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ============== INVITATION ROUTES ==============

// Admin: Create invitation
app.post('/api/invitations', (req, res) => {
  const { email, role, createdBy } = req.body;
  
  // Verify admin
  const admin = db.users.find(u => u.id === createdBy && u.role === 'admin');
  if (!admin) {
    return res.status(403).json({ error: 'Only admins can send invitations' });
  }
  
  // Check if user already exists
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + db.gdprSettings.inviteExpirationHours);
  
  const invitation = {
    id: generateId(),
    email,
    token: generateToken(),
    role,
    expiresAt: expiresAt.toISOString(),
    createdBy,
    accepted: false,
    declined: false,
    createdAt: new Date().toISOString()
  };
  
  db.invitations.push(invitation);
  res.status(201).json(invitation);
});

// Get invitation by token
app.get('/api/invitations/:token', (req, res) => {
  const invitation = db.invitations.find(inv => inv.token === req.params.token);
  
  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found' });
  }
  
  if (new Date(invitation.expiresAt) < new Date()) {
    return res.status(410).json({ error: 'Invitation expired' });
  }
  
  if (invitation.accepted || invitation.declined) {
    return res.status(410).json({ error: 'Invitation already processed' });
  }
  
  res.json(invitation);
});

// Accept invitation and register
app.post('/api/invitations/:token/accept', (req, res) => {
  const { name, password } = req.body;
  const invitation = db.invitations.find(inv => inv.token === req.params.token);
  
  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found' });
  }
  
  if (new Date(invitation.expiresAt) < new Date()) {
    return res.status(410).json({ error: 'Invitation expired' });
  }
  
  if (invitation.accepted || invitation.declined) {
    return res.status(410).json({ error: 'Invitation already processed' });
  }
  
  const user = {
    id: generateId(),
    email: invitation.email,
    name,
    password,
    role: invitation.role,
    invitedBy: invitation.createdBy,
    createdAt: new Date().toISOString()
  };
  
  db.users.push(user);
  invitation.accepted = true;
  
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({ user: userWithoutPassword, token: generateToken() });
});

// Decline invitation (GDPR: right to decline)
app.post('/api/invitations/:token/decline', (req, res) => {
  const invitation = db.invitations.find(inv => inv.token === req.params.token);
  
  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found' });
  }
  
  invitation.declined = true;
  // Remove email from system
  db.invitations = db.invitations.filter(inv => inv.id !== invitation.id);
  
  res.json({ message: 'Invitation declined and email removed' });
});

// Admin: Get all invitations
app.get('/api/invitations', (req, res) => {
  cleanExpiredInvitations();
  res.json(db.invitations);
});

// ============== USER ROUTES ==============

// Get all users (for team assignment)
app.get('/api/users', (req, res) => {
  const users = db.users.map(({ password, ...user }) => user);
  res.json(users);
});

// ============== EVENT ROUTES ==============

// Create event
app.post('/api/events', (req, res) => {
  const { name, date, organizerId, retentionDays } = req.body;
  
  const organizer = db.users.find(u => u.id === organizerId);
  if (!organizer || (organizer.role !== 'admin' && organizer.role !== 'organizer')) {
    return res.status(403).json({ error: 'Only admins and organizers can create events' });
  }
  
  const event = {
    id: generateId(),
    name,
    date,
    organizerId,
    organizerName: organizer.name,
    retentionDays: retentionDays || db.gdprSettings.defaultRetentionDays,
    createdAt: new Date().toISOString()
  };
  
  db.events.push(event);
  res.status(201).json(event);
});

// Get all events
app.get('/api/events', (req, res) => {
  const userId = req.headers['x-user-id'];
  const user = db.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Admins and organizers see all events, team members see events they're assigned to
  if (user.role === 'admin' || user.role === 'organizer') {
    res.json(db.events);
  } else {
    // Find events where user is in a shift
    const userShifts = db.shifts.filter(s => s.teamMembers.includes(userId));
    const eventIds = [...new Set(userShifts.map(s => s.eventId))];
    const userEvents = db.events.filter(e => eventIds.includes(e.id));
    res.json(userEvents);
  }
});

// Get event by ID
app.get('/api/events/:id', (req, res) => {
  const event = db.events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

// ============== SHIFT ROUTES ==============

// Create shift
app.post('/api/shifts', (req, res) => {
  const { eventId, name, teamMembers, startTime, endTime } = req.body;
  
  const event = db.events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  const shift = {
    id: generateId(),
    eventId,
    name,
    teamMembers,
    startTime,
    endTime,
    createdAt: new Date().toISOString()
  };
  
  db.shifts.push(shift);
  res.status(201).json(shift);
});

// Get shifts for an event
app.get('/api/events/:eventId/shifts', (req, res) => {
  const shifts = db.shifts.filter(s => s.eventId === req.params.eventId);
  res.json(shifts);
});

// ============== REPORT ROUTES ==============

// Submit report
app.post('/api/reports', (req, res) => {
  const { eventId, shiftId, submittedBy, incidentDescription, hasPotentialPII } = req.body;
  
  const user = db.users.find(u => u.id === submittedBy);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const shift = db.shifts.find(s => s.id === shiftId);
  if (!shift || !shift.teamMembers.includes(submittedBy)) {
    return res.status(403).json({ error: 'User not assigned to this shift' });
  }
  
  const report = {
    id: generateId(),
    eventId,
    shiftId,
    submittedBy,
    submittedByName: user.name,
    incidentDescription,
    hasPotentialPII: hasPotentialPII || false,
    createdAt: new Date().toISOString()
  };
  
  db.reports.push(report);
  res.status(201).json(report);
});

// Get reports for an event (organizer only)
app.get('/api/events/:eventId/reports', (req, res) => {
  const userId = req.headers['x-user-id'];
  const event = db.events.find(e => e.id === req.params.eventId);
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  // Only event organizer can see all reports
  if (event.organizerId !== userId) {
    return res.status(403).json({ error: 'Only event organizer can view reports' });
  }
  
  const reports = db.reports.filter(r => r.eventId === req.params.eventId);
  res.json(reports);
});

// Get user's own reports
app.get('/api/reports/my-reports', (req, res) => {
  const userId = req.headers['x-user-id'];
  const reports = db.reports.filter(r => r.submittedBy === userId);
  res.json(reports);
});

// ============== GDPR ROUTES ==============

// Get GDPR settings
app.get('/api/gdpr/settings', (req, res) => {
  res.json(db.gdprSettings);
});

// Update GDPR settings (admin only)
app.put('/api/gdpr/settings', (req, res) => {
  const userId = req.headers['x-user-id'];
  const user = db.users.find(u => u.id === userId);
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update GDPR settings' });
  }
  
  db.gdprSettings = { ...db.gdprSettings, ...req.body };
  res.json(db.gdprSettings);
});

// ============== START SERVER ==============

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Default admin login: admin@club.com / admin123`);
});
