import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
  console.log('✅ Database connected:', res.rows[0].now);
});

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Initialize database with test data (only in development)
async function initializeDatabase() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode - skipping test data seed');
    return;
  }

  try {
    // Check if users already exist
    const result = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(result.rows[0].count) > 0) {
      console.log('✅ Database already has data');
      return;
    }

    console.log('🌱 Seeding test data...');
    
    // Insert test users
    const users = [
      ['admin@club.com', 'password123', 'Admin User', 'admin'],
      ['sarah.organizer@club.com', 'password123', 'Sarah Johnson', 'organizer'],
      ['mike.organizer@club.com', 'password123', 'Mike Peters', 'organizer'],
      ['emma.organizer@club.com', 'password123', 'Emma Wilson', 'organizer'],
      ['alex.member@club.com', 'password123', 'Alex Thompson', 'team_member'],
      ['jordan.member@club.com', 'password123', 'Jordan Lee', 'team_member'],
      ['casey.member@club.com', 'password123', 'Casey Martinez', 'team_member'],
      ['taylor.member@club.com', 'password123', 'Taylor Brown', 'team_member'],
      ['morgan.member@club.com', 'password123', 'Morgan Davis', 'team_member'],
      ['riley.member@club.com', 'password123', 'Riley Anderson', 'team_member'],
      ['sam.member@club.com', 'password123', 'Sam Wilson', 'team_member'],
      ['avery.member@club.com', 'password123', 'Avery Moore', 'team_member']
    ];

    for (const [email, password, name, role] of users) {
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        [email, password, name, role]
      );
    }

    console.log('✅ Test data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Helper function to generate tokens
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to clean expired invitations
async function cleanExpiredInvitations() {
  try {
    await pool.query('DELETE FROM invitations WHERE expires_at < NOW() AND used = false');
  } catch (error) {
    console.error('Error cleaning expired invitations:', error);
  }
}

// Helper function to clean old reports based on retention policy
async function cleanOldReports() {
  try {
    const result = await pool.query(`
      DELETE FROM reports r
      USING events e, gdpr_settings g
      WHERE r.event_id = e.id
        AND (e.date + INTERVAL '1 day' * COALESCE(e.retention_days, g.default_retention_days)) < CURRENT_DATE
    `);
    if (result.rowCount > 0) {
      console.log(`🗑️  Cleaned ${result.rowCount} old reports based on retention policy`);
    }
  } catch (error) {
    console.error('Error cleaning old reports:', error);
  }
}

// Run cleanup tasks every hour
setInterval(() => {
  cleanExpiredInvitations();
  cleanOldReports();
}, 3600000);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============= Authentication Routes =============

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken();
    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  // In production, validate the token properly
  // For now, we'll just return a user based on a simple check
  res.json({ user: null });
});

// ============= User Management Routes =============

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/organizers', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role, created_at FROM users WHERE role = 'organizer' ORDER BY name"
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching organizers:', error);
    res.status(500).json({ error: 'Failed to fetch organizers' });
  }
});

app.get('/api/users/team-members', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role, created_at FROM users WHERE role = 'team_member' ORDER BY name"
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// ============= Invitation Routes =============

app.post('/api/invitations', async (req, res) => {
  const { email, role, invitedBy } = req.body;
  
  try {
    await cleanExpiredInvitations();
    
    // Get invitation expiration hours from GDPR settings
    const gdprResult = await pool.query('SELECT invitation_expiration_hours FROM gdpr_settings LIMIT 1');
    const expirationHours = gdprResult.rows[0]?.invitation_expiration_hours || 72;
    
    const token = generateToken();
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    
    const result = await pool.query(
      'INSERT INTO invitations (email, role, token, invited_by, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, role, token, invitedBy, expiresAt]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

app.get('/api/invitations', async (req, res) => {
  try {
    await cleanExpiredInvitations();
    
    const result = await pool.query(`
      SELECT i.*, u.name as invited_by_name
      FROM invitations i
      LEFT JOIN users u ON i.invited_by = u.id
      WHERE i.used = false AND i.expires_at > NOW()
      ORDER BY i.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

app.get('/api/invitations/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM invitations WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    );
    
    const invitation = result.rows[0];
    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }
    
    res.json(invitation);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});

app.post('/api/invitations/:token/accept', async (req, res) => {
  const { token } = req.params;
  const { name, password } = req.body;
  
  try {
    // Get invitation
    const invResult = await pool.query(
      'SELECT * FROM invitations WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    );
    
    const invitation = invResult.rows[0];
    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [invitation.email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create user
    const userResult = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [invitation.email, password, name, invitation.role]
    );
    
    // Mark invitation as used
    await pool.query('UPDATE invitations SET used = true WHERE token = $1', [token]);
    
    const user = userResult.rows[0];
    const authToken = generateToken();
    
    res.status(201).json({ user, token: authToken });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// ============= Event Routes =============

app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM shifts WHERE event_id = e.id) as shift_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const eventResult = await pool.query(`
      SELECT e.*, u.name as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `, [id]);
    
    const event = eventResult.rows[0];
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get shifts for this event
    const shiftsResult = await pool.query(`
      SELECT s.*,
        json_agg(
          json_build_object('id', u.id, 'name', u.name, 'email', u.email)
        ) FILTER (WHERE u.id IS NOT NULL) as assigned_members
      FROM shifts s
      LEFT JOIN shift_assignments sa ON s.id = sa.shift_id
      LEFT JOIN users u ON sa.user_id = u.id
      WHERE s.event_id = $1
      GROUP BY s.id
      ORDER BY s.start_time
    `, [id]);
    
    event.shifts = shiftsResult.rows;
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

app.post('/api/events', async (req, res) => {
  const { name, date, createdBy, retentionDays } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO events (name, date, created_by, retention_days) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, date, createdBy, retentionDays || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ============= Shift Routes =============

app.post('/api/shifts', async (req, res) => {
  const { eventId, name, startTime, endTime, location, assignedMembers } = req.body;
  
  try {
    // Create shift
    const shiftResult = await pool.query(
      'INSERT INTO shifts (event_id, name, start_time, end_time, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [eventId, name, startTime, endTime, location]
    );
    
    const shift = shiftResult.rows[0];
    
    // Assign members
    if (assignedMembers && assignedMembers.length > 0) {
      for (const memberId of assignedMembers) {
        await pool.query(
          'INSERT INTO shift_assignments (shift_id, user_id) VALUES ($1, $2)',
          [shift.id, memberId]
        );
      }
    }
    
    res.status(201).json(shift);
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

app.get('/api/shifts/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT s.*,
        json_agg(
          json_build_object('id', u.id, 'name', u.name, 'email', u.email)
        ) FILTER (WHERE u.id IS NOT NULL) as assigned_members
      FROM shifts s
      LEFT JOIN shift_assignments sa ON s.id = sa.shift_id
      LEFT JOIN users u ON sa.user_id = u.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);
    
    const shift = result.rows[0];
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    res.json(shift);
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({ error: 'Failed to fetch shift' });
  }
});

// ============= Report Routes =============

app.get('/api/reports', async (req, res) => {
  const { eventId } = req.query;
  
  try {
    let query = `
      SELECT r.*, 
        e.name as event_name,
        s.name as shift_name,
        u.name as submitted_by_name
      FROM reports r
      JOIN events e ON r.event_id = e.id
      JOIN shifts s ON r.shift_id = s.id
      JOIN users u ON r.submitted_by = u.id
    `;
    
    const params = [];
    if (eventId) {
      query += ' WHERE r.event_id = $1';
      params.push(eventId);
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.post('/api/reports', async (req, res) => {
  const {
    eventId,
    shiftId,
    submittedBy,
    incidentType,
    severity,
    description,
    location,
    witnesses,
    actionsTaken,
    hasPII,
    piiDetectedTypes
  } = req.body;
  
  try {
    // Verify the user is assigned to this shift
    const assignmentCheck = await pool.query(
      'SELECT * FROM shift_assignments WHERE shift_id = $1 AND user_id = $2',
      [shiftId, submittedBy]
    );
    
    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'User not assigned to this shift' });
    }
    
    const result = await pool.query(
      `INSERT INTO reports (
        event_id, shift_id, submitted_by, incident_type, severity,
        description, location, witnesses, actions_taken, has_pii, pii_detected_types
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        eventId, shiftId, submittedBy, incidentType, severity,
        description, location, witnesses, actionsTaken, hasPII,
        piiDetectedTypes ? JSON.stringify(piiDetectedTypes) : null
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// ============= GDPR Settings Routes =============

app.get('/api/gdpr/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gdpr_settings LIMIT 1');
    res.json(result.rows[0] || { default_retention_days: 90, invitation_expiration_hours: 72 });
  } catch (error) {
    console.error('Error fetching GDPR settings:', error);
    res.status(500).json({ error: 'Failed to fetch GDPR settings' });
  }
});

app.put('/api/gdpr/settings', async (req, res) => {
  const { defaultRetentionDays, invitationExpirationHours } = req.body;
  
  try {
    // Upsert GDPR settings
    const result = await pool.query(`
      INSERT INTO gdpr_settings (id, default_retention_days, invitation_expiration_hours, updated_at)
      VALUES (1, $1, $2, NOW())
      ON CONFLICT (id) DO UPDATE
      SET default_retention_days = $1,
          invitation_expiration_hours = $2,
          updated_at = NOW()
      RETURNING *
    `, [defaultRetentionDays, invitationExpirationHours]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating GDPR settings:', error);
    res.status(500).json({ error: 'Failed to update GDPR settings' });
  }
});

// Initialize and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 CORS enabled for: ${FRONTEND_URL}`);
  });
});
