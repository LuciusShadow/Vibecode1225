-- Awareness Reporting Database Schema

-- Drop existing tables
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS shift_assignments CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS gdpr_settings CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'organizer', 'team_member')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invitations table
CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'organizer', 'team_member')),
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  retention_days INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifts table
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shift assignments (many-to-many between shifts and team members)
CREATE TABLE shift_assignments (
  id SERIAL PRIMARY KEY,
  shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shift_id, user_id)
);

-- Reports table
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  submitted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  incident_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  location VARCHAR(255),
  witnesses TEXT,
  actions_taken TEXT,
  has_pii BOOLEAN DEFAULT FALSE,
  pii_detected_types TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GDPR settings table
CREATE TABLE gdpr_settings (
  id SERIAL PRIMARY KEY,
  default_retention_days INTEGER NOT NULL DEFAULT 90,
  invitation_expiration_hours INTEGER NOT NULL DEFAULT 72,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default GDPR settings
INSERT INTO gdpr_settings (default_retention_days, invitation_expiration_hours) 
VALUES (90, 72);

-- Create indexes for better performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_shifts_event_id ON shifts(event_id);
CREATE INDEX idx_shift_assignments_shift_id ON shift_assignments(shift_id);
CREATE INDEX idx_shift_assignments_user_id ON shift_assignments(user_id);
CREATE INDEX idx_reports_event_id ON reports(event_id);
CREATE INDEX idx_reports_shift_id ON reports(shift_id);
CREATE INDEX idx_reports_submitted_by ON reports(submitted_by);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
