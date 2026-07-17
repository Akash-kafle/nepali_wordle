# नेपाली शब्द खेल — Nepali Word Game

A Wordle-inspired daily word puzzle for Devanagari (Nepali) script.
Guess the hidden **3-akshara Nepali word** in 6 tries. Color-coded feedback, streak tracking, and a global leaderboard.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | Vanilla HTML / CSS / JavaScript   |
| Backend   | Node.js + Express (clean architecture) |
| Database  | MySQL 8                           |
| Proxy     | Nginx (reverse proxy + static serve) |
| Container | Docker + Docker Compose           |
| Email     | Nodemailer + Gmail SMTP           |

---

## Clean Architecture

```
backend/src/
├── domain/          # Entities + repository interfaces (zero framework dependencies)
├── application/     # Use cases (business logic, no HTTP/DB knowledge)
├── infrastructure/  # MySQL repos, BcryptService, JwtService, EmailService, FeedbackEngine, Scheduler
└── interfaces/      # Express controllers, routes, middleware (HTTP adapter only)
```

---

## Security Features

| Feature | Implementation |
|---|---|
| Email Verification | Magic link via Gmail SMTP (nodemailer) |
| Password Hashing | bcrypt with 12 salt rounds |
| JWT Authentication | Token-based with configurable expiry |
| Rate Limiting | express-rate-limit (auth: 10/15min, API: 100/15min) |
| Security Headers | helmet (X-Frame-Options, X-Content-Type, HSTS, etc.) |
| Input Sanitization | Custom middleware to trim/strip HTML |
| CORS | Strict origin matching |
| SQL Injection | Parameterized queries (mysql2) |
| XSS Prevention | HTML escaping + input sanitization |
| Body Size Limit | 10kb max request body |
| Nginx Rate Limiting | API: 30r/m, Auth: 10r/m per IP |

---

## Quick Start (Docker — recommended)

### Prerequisites
- Docker Engine 24+
- Docker Compose v2

### 1. Clone & configure
```bash
git clone <https://github.com/Akash-kafle/nepali_wordle.git>
cd nepali_wordle
cp .env.example .env
# Edit .env — change passwords, JWT_SECRET, and SMTP credentials!
```

### 2. Set up Gmail SMTP
1. Enable 2-Step Verification on your Google account
2. Go to: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Put the 16-character password in `.env` as `SMTP_PASS`
5. Set `SMTP_USER` to your Gmail address

### 3. Start everything
```bash
docker compose up -d --build
```

This will:
- Start MySQL 8, apply schema + seed data automatically
- Build and start the Node.js backend (with email verification)
- Build and start the Nginx frontend server
- Start Nginx reverse proxy on port **8888**

### 4. Open the app
```
http://localhost:8888
```

### 5. Check logs
```bash
docker compose logs -f backend   # backend logs
docker compose logs -f mysql     # database logs
docker compose logs nginx        # nginx logs
```

---

## Production Deployment

### Any Linux VPS (DigitalOcean, Linode, Hetzner, etc.)

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Clone the project
git clone <your-repo> /opt/nepali-word-game
cd /opt/nepali-word-game

# 4. Configure environment
cp .env.example .env
nano .env   # Set strong passwords + JWT_SECRET + SMTP creds + FRONTEND_URL + CORS_ORIGIN

# 5. Deploy (production mode)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 6. (Optional) Set up HTTPS with Let's Encrypt
sudo apt install certbot
certbot certonly --standalone -d yourdomain.com
# Then uncomment SSL block in nginx/nginx.conf and redeploy
```

### Zero-Budget Deployment (GitHub Pages + Railway)

This project is structured to be deployed completely for free using **GitHub Pages** (for static frontend hosting) and **Railway** (for Node.js API and MySQL database).

---

#### Phase 1: Database Setup (Railway MySQL)
1. Sign up on [Railway.app](https://railway.app/).
2. Click **New Project** → **Provision MySQL**.
3. Once the database is ready, go to the **Variables** tab of the MySQL service and copy the **`MYSQL_URL`** (or connection string).
4. Connect to your database using any tool (e.g., MySQL Workbench, Beekeeper Studio, or command line) and run:
   * First: [database/schema.sql](./database/schema.sql) to create the tables.
   * Second: [database/seed.sql](./database/seed.sql) to load initial Nepali words.

---

#### Phase 2: Backend Deployment (Railway Node.js)
1. In your Railway project, click **New** → **GitHub Repo** (authorize your GitHub account if needed).
2. Choose your repository.
3. In the service settings, set the **Root Directory** to `backend`.
4. Go to the **Variables** tab and add the following environment variables:
   * `MYSQL_URL`: Reference your MySQL service (e.g., `${{MySQL.MYSQL_URL}}` or paste the connection URL).
   * `JWT_SECRET`: A strong secret key for token signing (e.g., generate with `openssl rand -hex 64`).
   * `CORS_ORIGIN`: Your GitHub Pages URL (e.g., `https://username.github.io`).
   * `FRONTEND_URL`: Your GitHub Pages URL (e.g., `https://username.github.io/nepali-word-game`).
   * `SMTP_HOST`: `smtp.gmail.com`
   * `SMTP_PORT`: `587`
   * `SMTP_USER`: Your Gmail address.
   * `SMTP_PASS`: Your Gmail 16-character App Password.
5. Railway will automatically build and deploy your Node.js backend. Once finished, copy your public backend URL (e.g., `https://backend-production-xxx.up.railway.app`).

---

#### Phase 3: Frontend Deployment (GitHub Pages)
1. Open [frontend/config.js](./frontend/config.js) and replace `YOUR-RAILWAY-BACKEND-URL` with your actual Railway backend URL:
   ```javascript
   API_BASE: 'https://backend-production-xxx.up.railway.app/api'
   ```
2. Create a new repository on GitHub and push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
3. A GitHub Action workflow (`.github/workflows/deploy-frontend.yml`) will automatically trigger, build the frontend, and push it to the `gh-pages` branch.
4. Go to your GitHub Repository → **Settings** → **Pages**:
   * Under **Build and deployment** → **Source**, select **Deploy from a branch**.
   * Under **Branch**, select **`gh-pages`** and `/ (root)`, then click **Save**.
5. Your game will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/` in a few minutes!


---

## Local Development (without Docker)

### Requirements
- Node.js 20+
- MySQL 8 running locally

```bash
# 1. Set up database
mysql -u root -p < database/schema.sql
mysql -u root -p nepali_word_game < database/seed.sql

# 2. Configure backend
cd backend
cp ../.env.example .env
# Edit .env: set DB_HOST=localhost, DB_USER, DB_PASSWORD, SMTP creds

# 3. Install dependencies & run
npm install
npm run dev   # starts on http://localhost:3000

# 4. Open frontend
# Serve frontend/ with any static server, e.g.:
npx serve ../frontend -p 8080
```

---

## API Endpoints

| Method | Path                         | Auth     | Description                        |
|--------|------------------------------|----------|-------------------------------------|
| POST   | /api/auth/register           | —        | Create account + send verification email |
| POST   | /api/auth/login              | —        | Sign in, receive JWT               |
| GET    | /api/auth/me                 | Required | Get current user + verification status |
| GET    | /api/auth/verify?token=...   | —        | Verify email via magic link        |
| POST   | /api/auth/resend-verification| Required | Resend verification email          |
| GET    | /api/game/daily              | Optional | Get today's challenge + attempts   |
| GET    | /api/game/practice           | Optional | Get random practice word           |
| POST   | /api/game/guess              | Required | Submit a guess                     |
| GET    | /api/stats                   | Verified | Get personal stats & streak        |
| GET    | /api/leaderboard             | Optional | Get top 20 players                 |
| GET    | /api/health                  | —        | Health check                       |

---

## Email Verification Flow

1. **User registers** → Account created with `is_verified = false`
2. **System sends email** → Beautiful HTML email with "Verify Email Address" button
3. **User clicks link** → `{FRONTEND_URL}/?verify={token}` opens in browser
4. **Frontend calls API** → `GET /api/auth/verify?token=...`
5. **Backend validates** → Token checked, user marked as verified
6. **Success page shown** → User redirected to game view

**Unverified users can:**
- Log in
- Play practice mode
- View leaderboard

**Unverified users cannot:**
- Play daily challenges
- View personal stats
- Appear on leaderboard

---

## Running Tests

```bash
cd backend
npm install
npm test
```

---

## Database Migrations

If upgrading an existing database:
```bash
mysql -u root -p nepali_word_game < database/migration_001_email_verification.sql
```
