# Local Development Setup

## Choose Your Database Setup

### Option 1: No PostgreSQL (Easiest - For Quick Testing)

Use the in-memory database:

```bash
# Terminal 1
npm run server:inmemory

# Terminal 2
npm run dev
```

✅ **Pros:** No setup, instant start  
⚠️ **Cons:** Data resets on server restart

---

### Option 2: PostgreSQL with Docker (Recommended)

**1. Install Docker (if not already installed):**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER
```

**Log out and back in** for group changes to take effect.

**2. Start everything:**

```bash
npm start
```

Or manually:

```bash
# Start PostgreSQL
docker-compose up -d

# Wait 5 seconds for DB to initialize
sleep 5

# Start app
npm run dev:all
```

---

### Option 3: PostgreSQL Installed Locally

**1. Install PostgreSQL:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql
```

**2. Create database:**

```bash
sudo -u postgres psql
```

In the PostgreSQL prompt:
```sql
CREATE DATABASE awareness_db;
CREATE USER awareness WITH PASSWORD 'awareness123';
GRANT ALL PRIVILEGES ON DATABASE awareness_db TO awareness;
\q
```

**3. Initialize database:**

```bash
npm run db:init
```

**4. Start app:**

```bash
npm run dev:all
```

---

## Access the App

- Frontend: http://localhost:5174
- Backend: http://localhost:3001

## Test Users

**Admin:**
- `admin@club.com` / `password123`

**Organizers:**
- `sarah.organizer@club.com` / `password123`

**Team Members:**
- `alex.member@club.com` / `password123`

---

## Troubleshooting

### Can't connect to database

**Check if PostgreSQL is running:**

```bash
# Docker
docker ps | grep awareness-postgres

# Local installation
sudo systemctl status postgresql
```

### Port already in use

Change ports in `.env`:
```env
PORT=3002  # Change backend port
```

### Want to reset database

```bash
# Docker
docker-compose down -v
docker-compose up -d
npm run db:init

# Local
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:init
```

---

For **production deployment**, see [DEPLOYMENT.md](./DEPLOYMENT.md)
