-- Seed data for local development and testing

-- Insert test users
-- Password for all users: 'password123' (hashed)
INSERT INTO users (email, password, name, role) VALUES
('admin@club.com', 'password123', 'Admin User', 'admin'),
('sarah.organizer@club.com', 'password123', 'Sarah Johnson', 'organizer'),
('mike.organizer@club.com', 'password123', 'Mike Peters', 'organizer'),
('emma.organizer@club.com', 'password123', 'Emma Wilson', 'organizer'),
('alex.member@club.com', 'password123', 'Alex Thompson', 'team_member'),
('jordan.member@club.com', 'password123', 'Jordan Lee', 'team_member'),
('casey.member@club.com', 'password123', 'Casey Martinez', 'team_member'),
('taylor.member@club.com', 'password123', 'Taylor Brown', 'team_member'),
('morgan.member@club.com', 'password123', 'Morgan Davis', 'team_member'),
('riley.member@club.com', 'password123', 'Riley Anderson', 'team_member'),
('sam.member@club.com', 'password123', 'Sam Wilson', 'team_member'),
('avery.member@club.com', 'password123', 'Avery Moore', 'team_member')
ON CONFLICT (email) DO NOTHING;
