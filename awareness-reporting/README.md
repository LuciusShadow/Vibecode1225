# Club Awareness Reporting System

A GDPR-compliant web application for club awareness teams to manage events, shifts, and incident reports.

## Features

### 🔐 Role-Based Access Control
- **Admin**: Invite users, manage GDPR settings, full system access
- **Organizer**: Create events, manage shifts, view reports for their events
- **Team Member**: Submit incident reports for assigned shifts

### 📊 Event Management
- Create events with customizable data retention periods
- Organize shifts with team assignments
- Track event dates and team members

### 📝 Incident Reporting
- Team members can submit reports for their assigned shifts
- **PII Detection**: Automatic warning when potential personal data is detected
- Privacy-focused: Only event organizers and report submitters can view reports

### 🔒 GDPR Compliance
- Configurable data retention periods
- Automatic deletion of reports after retention period
- Invitation expiration (configurable)
- Right to decline invitations with email removal
- PII detection warnings before submission
- Clear data access controls

## Quick Start

### With Docker (Recommended)

```bash
# Install dependencies
npm install

# Start everything (PostgreSQL + Backend + Frontend)
npm start
```

### Manual Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL
npm run docker:up

# Start backend and frontend
npm run dev:all
```

### Test with In-Memory Database

```bash
# Backend only (no PostgreSQL needed)
npm run server:inmemory

# In another terminal
npm run dev
```

The app will run on:
- Frontend: http://localhost:5174
- Backend: http://localhost:3001

## Test Users

**Admin:**
- Email: `admin@club.com`
- Password: `password123`

**Organizers:**
- `sarah.organizer@club.com` / `password123`
- `mike.organizer@club.com` / `password123`
- `emma.organizer@club.com` / `password123`

**Team Members:**
- `alex.member@club.com` / `password123`
- `jordan.member@club.com` / `password123`
- And 6 more team members

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **React Router** for routing
- **Tailwind CSS** for styling
- **Vite** as build tool

### Backend
- **Node.js** with Express
- In-memory database (for demo purposes)
- RESTful API design

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository and navigate to the project:
```bash
cd awareness-reporting
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

#### Option 1: Run both frontend and backend together
```bash
npm run dev:all
```

#### Option 2: Run separately
Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Default Login
- Email: `admin@club.com`
- Password: `admin123`

## Project Structure

```
awareness-reporting/
├── src/
│   ├── features/           # Feature-based modules
│   │   ├── auth/          # Authentication & invitations
│   │   ├── events/        # Event management
│   │   ├── reports/       # Report submission
│   │   └── dashboard/     # Dashboards & admin panel
│   ├── components/        # Reusable components
│   │   ├── ui/           # UI primitives (Button, Input, etc.)
│   │   └── layout/       # Layout components (Navbar, etc.)
│   ├── services/         # API client services
│   ├── utils/            # Utility functions (PII detection)
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Main app with routing
├── server/
│   └── index.js          # Express backend server
└── package.json
```

## Usage Guide

### As Admin
1. Login with admin credentials
2. Go to **Admin Panel** to:
   - Send invitations to organizers and team members
   - Configure GDPR settings (retention periods, invite expiration)
   - View invitation status

### As Organizer
1. Accept invitation via email link
2. Create events with:
   - Event name and date
   - Custom or default retention period
3. Create shifts for events:
   - Assign team members
   - Set shift times (optional)
4. View incident reports for your events

### As Team Member
1. Accept invitation via email link
2. View assigned shifts
3. Submit incident reports:
   - Select shift
   - Describe incident
   - System warns if PII detected
4. View your submitted reports

## GDPR Features

### Data Retention
- Reports are automatically deleted after the configured retention period (counted from event date)
- Default: 90 days (configurable by admin)
- Per-event custom retention periods supported

### Invitation Management
- Invitations expire after configured hours (default: 72 hours)
- Users can decline invitations
- Declined invitations remove email from system

### PII Detection
- Automatic detection of:
  - Email addresses
  - Phone numbers
  - Names (heuristic)
  - Addresses
  - ID numbers, credit cards, IBANs
  - Dates of birth
- Warning shown before submission
- User must acknowledge before proceeding

### Access Control
- Reports only visible to:
  - Event organizer
  - Report submitter
- Admin cannot view reports unless they're the organizer

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Invitations
- `POST /api/invitations` - Create invitation (admin only)
- `GET /api/invitations/:token` - Get invitation by token
- `POST /api/invitations/:token/accept` - Accept invitation
- `POST /api/invitations/:token/decline` - Decline invitation

### Events
- `POST /api/events` - Create event
- `GET /api/events` - Get all events (filtered by role)
- `GET /api/events/:id` - Get event by ID

### Shifts
- `POST /api/shifts` - Create shift
- `GET /api/events/:eventId/shifts` - Get shifts for event

### Reports
- `POST /api/reports` - Submit report
- `GET /api/events/:eventId/reports` - Get reports for event (organizer only)
- `GET /api/reports/my-reports` - Get user's own reports

### GDPR
- `GET /api/gdpr/settings` - Get GDPR settings
- `PUT /api/gdpr/settings` - Update GDPR settings (admin only)

## Future Enhancements

- Real database (PostgreSQL/MongoDB)
- Email service integration for invitations
- Export reports (PDF/CSV)
- More sophisticated PII detection
- Audit logs
- Multi-language support
- Mobile app

## License

Private project for club use.

## Support

For questions or issues, contact your system administrator.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
