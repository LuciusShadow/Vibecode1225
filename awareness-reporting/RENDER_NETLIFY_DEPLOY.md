# 🚀 Render + Netlify Deployment - Quick Guide

Follow these steps to deploy your awareness reporting app for **FREE**.

## Prerequisites

✅ GitHub account  
✅ Code pushed to GitHub repository: `LuciusShadow/Vibecode1225`  
✅ Render account (free)  
✅ Netlify account (free)  

---

## Step 1: Deploy Database on Render (3 minutes)

1. Go to **[render.com](https://render.com)** → Sign up/Login
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - Name: `awareness-db`
   - Database: `awareness_db`
   - User: `awareness`
   - Region: Choose closest to you (e.g., Frankfurt)
   - Plan: **Free**
4. Click **"Create Database"**
5. ⏳ **Wait 2-3 minutes** until status shows "Available"
6. **Copy the "Internal Database URL"** (looks like `postgresql://awareness:xxx@...`)

---

## Step 2: Deploy Backend on Render (5 minutes)

1. In Render, click **"New +"** → **"Web Service"**
2. Click **"Connect GitHub"** → Authorize Render
3. Select repository: **`LuciusShadow/Vibecode1225`**
4. Configure:
   - **Name:** `awareness-api`
   - **Root Directory:** Leave blank (or `awareness-reporting` if it's in a subfolder)
   - **Environment:** `Node`
   - **Region:** Same as your database
   - **Branch:** `master`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Plan:** **Free**

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV = production
   DATABASE_URL = <paste your database URL from Step 1.6>
   PORT = 10000
   FRONTEND_URL = https://awareness-reporting.netlify.app
   ```
   *(You'll update FRONTEND_URL later)*

6. Click **"Create Web Service"**
7. ⏳ **Wait 3-5 minutes** for deployment
8. Once deployed, go to **"Shell"** tab and run:
   ```bash
   npm run db:init
   ```
   This creates the database tables and test users.

9. **Copy your backend URL:** `https://awareness-api.onrender.com` (or similar)

---

## Step 3: Deploy Frontend on Netlify (5 minutes)

1. Go to **[netlify.com](https://netlify.com)** → Sign up/Login
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"** → Authorize Netlify
4. Select repository: **`LuciusShadow/Vibecode1225`**
5. Configure build settings:
   - **Base directory:** Leave blank (or `awareness-reporting`)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist` (or `awareness-reporting/dist`)
   
6. Click **"Show advanced"** → **"New variable"**
7. **Add Environment Variable:**
   ```
   VITE_API_URL = https://awareness-api.onrender.com/api
   ```
   *(Use YOUR actual Render backend URL + `/api`)*

8. Click **"Deploy site"**
9. ⏳ **Wait 2-3 minutes** for build
10. **Copy your site URL:** e.g., `https://adorable-unicorn-xyz123.netlify.app`

---

## Step 4: Update Backend CORS (2 minutes)

1. Go back to **Render** → Your backend web service
2. Go to **"Environment"** tab
3. **Edit** `FRONTEND_URL` variable:
   - Change to: `https://adorable-unicorn-xyz123.netlify.app` (your actual Netlify URL)
4. Click **"Save Changes"**
5. Render will automatically redeploy (1-2 minutes)

---

## Step 5: Test Your Deployment ✅

1. **Open your Netlify URL** in a browser
2. **Login with:**
   - Email: `admin@club.com`
   - Password: `password123`
3. **Test features:**
   - Create an event
   - Create shifts
   - Assign team members
   - Submit a report

---

## ⚠️ Important Notes

### Backend Sleep Behavior
- Render free tier **sleeps after 15 minutes** of inactivity
- First request after sleep takes **30-60 seconds** to wake up
- This is normal - just wait and refresh

### Keep Backend Awake (Optional)
Use a free ping service:
- **[UptimeRobot](https://uptimerobot.com)** - Free, pings every 5 minutes
- Setup: Monitor → New → HTTP → `https://awareness-api.onrender.com/health` → Interval: 5 min

### Database Free Tier
- PostgreSQL free for **90 days**
- After that, either:
  - Upgrade to paid tier ($7/month)
  - Migrate to Supabase/Railway (free alternatives)

---

## 🎉 You're Live!

**Your URLs:**
- Frontend: `https://your-app.netlify.app`
- Backend: `https://your-api.onrender.com`

**Test Users:**
- Admin: `admin@club.com` / `password123`
- Organizer: `sarah.organizer@club.com` / `password123`
- Team Member: `alex.member@club.com` / `password123`

---

## Troubleshooting

**"Backend not responding"**
→ Wait 60 seconds (backend is waking up from sleep)

**"CORS error"**
→ Check `FRONTEND_URL` in Render matches your Netlify URL exactly (no trailing slash)

**"Database connection error"**
→ Check `DATABASE_URL` in Render, ensure database status is "Available"

**Frontend build fails**
→ Check `VITE_API_URL` includes `/api` at the end

---

## Auto-Deploy Updates

Push to GitHub and both platforms auto-deploy:
```bash
git add .
git commit -m "Update feature"
git push origin master
```

---

## Next Steps

1. ✅ Customize Netlify domain (Site settings → Domain management)
2. ✅ Set up UptimeRobot to prevent backend sleep
3. ✅ Monitor logs (Render → Logs, Netlify → Deploys)
4. ⚠️ Change passwords before using with real data

---

**Need help?** Check the full deployment guide in `DEPLOYMENT.md`
