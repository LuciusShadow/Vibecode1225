# Quick Start Guide

## 🚀 Your Application is Running!

### Access Points
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001

### Default Admin Login
- **Email**: admin@club.com
- **Password**: admin123

## Current Status
✅ Backend server running on port 3001
✅ Frontend running on port 5174
✅ All dependencies installed
✅ GDPR-compliant features implemented

## Quick Test Flow

### 1. Login as Admin
1. Open http://localhost:5174
2. Login with admin@club.com / admin123
3. You'll see the Events dashboard

### 2. Send an Invitation (Admin Panel)
1. Click "Admin" in the navigation
2. Enter an email address (can be fake for testing)
3. Select role (Organizer or Team Member)
4. Click "Send Invitation"
5. Copy the invitation link from the list

### 3. Accept Invitation
1. Open the invitation link in a new browser tab/window (or incognito)
2. Fill in name and password
3. Click "Accept Invitation"
4. You'll be logged in as the new user

### 4. Create an Event (as Organizer or Admin)
1. In the home page, fill the "Create New Event" form
2. Set event name, date, and retention period
3. Click "Create Event"
4. Event appears in the list

### 5. Create Shifts
1. Click on an event
2. Click "Create Shift"
3. Name the shift and select team members
4. Add optional start/end times
5. Click "Create Shift"

### 6. Submit a Report (as Team Member)
1. Login as a team member
2. Click on an event you're assigned to
3. You'll see "Submit Report" option
4. Select your shift
5. Write incident description
6. **Watch for PII warnings** if you include emails, names, etc.
7. Acknowledge warning if needed
8. Submit report

### 7. View Reports (as Organizer)
1. Login as the event organizer
2. Go to the event
3. Click "View Reports"
4. See all submitted reports with PII flags

## Features to Test

### GDPR Features
- ✅ **PII Detection**: Try typing an email or name in report - see the warning
- ✅ **Configurable Retention**: Admin can change default retention days
- ✅ **Invite Expiration**: Invitations expire after configured hours
- ✅ **Decline Invites**: Users can decline and have email removed

### Access Control
- ✅ Team members can only see their own reports
- ✅ Organizers see only their event reports
- ✅ Reports show "May contain PII" badge when detected

### Modern React Patterns
- ✅ Feature-based folder structure
- ✅ Custom hooks (useAuth)
- ✅ Reusable UI components
- ✅ TypeScript throughout
- ✅ React Router for navigation

## Stopping the Servers

To stop the application, press `Ctrl+C` in both terminal windows.

## Troubleshooting

### Port Already in Use
If you see "Port 5173 is in use", the app will automatically try the next port (5174, 5175, etc.)

### Backend Not Responding
Make sure the backend is running on port 3001. Check terminal for errors.

### CORS Issues
The backend allows all origins for development. In production, configure CORS properly.

## Next Steps

1. Test the full workflow (admin → invite → event → shift → report)
2. Try PII detection with various inputs
3. Check GDPR compliance features
4. Customize styling with Tailwind classes
5. Add real database (PostgreSQL/MongoDB)
6. Integrate email service for invitations

## Need Help?

Check the main README.md for detailed documentation including:
- Full API endpoint list
- Project structure explanation
- GDPR feature details
- Future enhancement ideas
