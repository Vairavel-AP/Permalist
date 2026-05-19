# Permalist v2 🚀

A modern, full-featured Todo List built with **Node.js**, **Express**, **EJS**, and **PostgreSQL**.

---

## 🏃 Running Locally

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Then edit .env with your DB credentials
```

### 4. Set up the database
```bash
# In psql:
CREATE DATABASE permalist;
\c permalist
\i queries.sql
```

### 5. Start the server
```bash
npm start
# or for auto-reload during development:
npm run dev
```

Open **http://localhost:3000**

---

## 🌐 Deploying to Railway (Recommended — Free Tier)

Railway is the easiest way to host a Node.js + PostgreSQL app.

### Steps:
1. Push your code to GitHub (without `node_modules` and `.env`).
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub Repo**
3. Select your repo → Railway auto-detects Node.js
4. Click **+ New** → **Database** → **Add PostgreSQL**
5. Go to your app service → **Variables** tab and add:
   ```
   DB_HOST     = (from Railway PostgreSQL → Connect tab)
   DB_USER     = postgres
   DB_PASSWORD = (from Railway PostgreSQL)
   DB_NAME     = railway
   DB_PORT     = 5432
   NODE_ENV    = production
   PORT        = 3000
   ```
6. In your Railway PostgreSQL service → **Query** tab → paste and run `queries.sql`
7. Your app is live! 🎉

---

## 🌐 Deploying to Render (Alternative — Free Tier)

1. Push to GitHub.
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add a **PostgreSQL** database in Render → copy the connection string
6. Add environment variables (same as above, or use the `DATABASE_URL` connection string)
7. Deploy!

---

## 🌐 Deploying to Fly.io

```bash
npm install -g flyctl
fly auth login
fly launch          # auto-detects Node.js
fly postgres create # create a managed PG instance
fly postgres attach --app <your-app-name> <your-pg-name>
fly deploy
```

---

## 📁 Project Structure

```
permalist-upgraded/
├── index.js              # Express server & all routes
├── package.json
├── .env.example          # Copy to .env with your values
├── .gitignore
├── queries.sql           # DB schema + sample data
├── public/
│   └── styles/
│       └── main.css      # Dark theme CSS
└── views/
    ├── index.ejs         # Main page template
    └── partials/
        ├── header.ejs
        └── footer.ejs
```

---

## 🔒 Security Notes

- **Never commit `.env`** — it's in `.gitignore`
- The DB password in the original `index.js` was hardcoded — v2 uses environment variables
- SSL is automatically enabled in production (`NODE_ENV=production`)

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 4
- **Template Engine**: EJS
- **Database**: PostgreSQL (via `pg`)
- **Styling**: Custom CSS (dark theme, CSS variables)
- **Fonts**: Syne + DM Sans (Google Fonts)
