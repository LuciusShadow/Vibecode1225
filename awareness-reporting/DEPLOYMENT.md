# Deployment Guide

## Local Development with PostgreSQL

### Option 1: Docker (Recommended - if Docker is installed)

**Install Docker (if needed):**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

**Start PostgreSQL with Docker:**
```bash
docker run --name awareness-postgres \
  -e POSTGRES_USER=awareness \
  -e POSTGRES_PASSWORD=awareness123 \
  -e POSTGRES_DB=awareness_db \
  -p 5432:5432 \
  -d postgres:16
```

2. **Initialize the database:**
```bash
npm run db:init
```

3. **Start the development servers:**
```bash
npm run dev:all
```

The app will run on:
- Frontend: http://localhost:5174
- Backend: http://localhost:3001

### Option 2: Local PostgreSQL Installation

1. **Install PostgreSQL** (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

2. **Create database and user:**
```bash
sudo -u postgres psql
CREATE DATABASE awareness_db;
CREATE USER awareness WITH PASSWORD 'awareness123';
GRANT ALL PRIVILEGES ON DATABASE awareness_db TO awareness;
\q
```

3. **Initialize and run:**
```bash
npm run db:init
npm run dev:all
```

### Testing with In-Memory Database

To revert to the in-memory database for quick testing:
```bash
npm run server:inmemory
```

---

## Production Deployment

### Option 1: Railway (Recommended - Easiest)

Railway provides $5 free credits/month and simplifies deployment.

#### Step 1: Prepare Your Repository

1. **Initialize git (if not already done):**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Push to GitHub:**
```bash
gh repo create awareness-reporting --public --source=. --remote=origin --push
# Or manually create a repo on GitHub and push
```

#### Step 2: Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `awareness-reporting` repository
4. Railway will auto-detect Node.js and create a service

#### Step 3: Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway automatically creates a `DATABASE_URL` environment variable
3. Your backend service will automatically connect to it

#### Step 4: Configure Backend Environment Variables

In Railway, go to your backend service → "Variables" and add:

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
```

(You'll update `FRONTEND_URL` after deploying frontend)

#### Step 5: Initialize Database

In Railway, go to your backend service → "Settings" → "Deploy" → Add deploy command:
```bash
npm run db:init && node server/index.js
```

Or manually run in Railway's terminal:
```bash
npm run db:init
```

#### Step 6: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project" → Import your GitHub repo
3. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
5. Deploy!

#### Step 7: Update CORS

Go back to Railway and update your backend's `FRONTEND_URL` variable to your Vercel URL:
```env
FRONTEND_URL=https://your-app.vercel.app
```

Railway will automatically redeploy.

---

### Option 2: Render (Free Tier)

Render offers a truly free tier but services sleep after 15 minutes of inactivity.

#### Backend Setup

1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `awareness-reporting-api`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
   - Plan: Free

#### Database Setup

1. Click "New" → "PostgreSQL"
2. Name it and select Free plan (90 days free)
3. Copy the "Internal Database URL"
4. Add to your Web Service environment variables:
   ```
   DATABASE_URL=<your-database-url>
   NODE_ENV=production
   ```

#### Initialize Database

In Render's Shell (Web Service → "Shell"):
```bash
npm run db:init
```

#### Frontend Setup

1. Deploy to Vercel (same as Railway instructions)
2. Or use Render Static Site:
   - "New" → "Static Site"
   - Build Command: `npm run build`
   - Publish Directory: `dist`

---

### Option 3: Supabase + Vercel (Database + Frontend)

If you want a managed PostgreSQL with great features:

#### Database Setup

1. Go to [supabase.com](https://supabase.com) and create a project
2. Get your connection string from Settings → Database
3. Run locally to initialize:
   ```bash
   export DATABASE_URL="postgresql://..."
   npm run db:init
   ```

#### Deploy Backend

Use Railway or Render with Supabase's `DATABASE_URL`

#### Deploy Frontend

Same Vercel instructions as above

---

## Environment Variables Reference

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Server
PORT=3001
NODE_ENV=development|production

# CORS
FRONTEND_URL=http://localhost:5174
```

### Frontend (.env.local)

```env
# API Endpoint
VITE_API_URL=http://localhost:3001/api
```

For production, create `.env.production`:
```env
VITE_API_URL=https://your-backend.railway.app/api
```

---

## Test Users

After deployment, these test users are available:

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
- `casey.member@club.com` / `password123`
- (and 5 more team members)

---

## Troubleshooting

### "Database connection error"

- Check `DATABASE_URL` is correctly set
- Ensure PostgreSQL is running (local) or accessible (production)
- Verify firewall/network settings

### "CORS error" in browser console

- Update `FRONTEND_URL` in backend environment variables
- Ensure it matches your frontend domain exactly (no trailing slash)

### Frontend can't reach backend

- Check `VITE_API_URL` in frontend environment variables
- Verify backend is running and accessible
- Check browser network tab for actual error

### Database schema not initialized

Run the initialization command:
```bash
npm run db:init
```

Or manually:
```bash
psql $DATABASE_URL -f server/schema.sql
```

---

## Security Notes for Production

Before going live with real data:

1. **Change all passwords** in seed.sql or remove seed data entirely
2. **Implement proper JWT authentication** (current token generation is basic)
3. **Hash passwords** with bcrypt instead of storing plain text
4. **Add rate limiting** to prevent abuse
5. **Enable SSL** for database connections
6. **Set up environment secrets** properly (never commit .env files)
7. **Add input validation** and sanitization
8. **Set up monitoring** and error tracking (Sentry, LogRocket)

---

## Cost Breakdown

### Free Tier (Hobby Projects)

- **Railway:** $5/month credit (usually enough for small apps)
- **Vercel:** Unlimited for personal projects
- **Supabase:** 500MB database, 2GB bandwidth/month
- **Render:** Free tier with limitations (services sleep)

### Recommended Stack for Zero Cost

- Frontend: Vercel (free forever)
- Backend: Railway ($5 credit/month) or Render (free with sleep)
- Database: Railway PostgreSQL (included) or Supabase (free tier)

**Total:** $0-5/month for hobby use

---

## Next Steps

1. ✅ Choose deployment platform
2. ✅ Push code to GitHub
3. ✅ Set up PostgreSQL database
4. ✅ Deploy backend
5. ✅ Deploy frontend
6. ✅ Configure environment variables
7. ✅ Initialize database with schema
8. ✅ Test with provided credentials
9. ⚠️ Implement proper authentication before production use
10. ⚠️ Review security checklist above
