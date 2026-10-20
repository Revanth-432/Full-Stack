# 🌐 TaskFlow — Production Full-Stack Application

[![Frontend: Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://vercel.com)
[![Backend: Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://render.com)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat&logo=postgresql)](https://postgresql.org)
[![Runtime: Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?style=flat&logo=node.js)](https://nodejs.org)
[![Framework: React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev)

A modern, production-deployed Full-Stack Task Management web application built with **React 19**, **Vite**, **Express**, and **PostgreSQL**.

---

## 🏗️ Architecture & Monorepo Structure

```
Full-Stack/
├── React_FrontEnd/               # Client-Side Application (Vercel)
│   ├── src/                      # React 19 components, pages, api client
│   │   ├── api/client.js         # Fetch wrapper with JWT & Base URL normalization
│   │   ├── pages/                # Task list, detail, create, edit, login, register
│   │   └── context/              # Auth & notification providers
│   ├── public/_redirects         # Netlify SPA redirect rules
│   ├── vercel.json               # Vercel SPA rewrite fallback rules
│   ├── .env.example              # Frontend environment variable template
│   └── package.json
│
├── Rest API with Node/           # REST API Server (Render)
│   ├── src/
│   │   ├── controllers/          # Auth and Task controller handlers
│   │   ├── database/
│   │   │   ├── db.js             # Dual PostgreSQL (Hosted) & SQLite (Local) engine
│   │   │   └── migrate.js        # Automated schema migration runner
│   │   ├── middleware/           # JWT authentication and input validation
│   │   ├── routes/               # Modular Express API routers
│   │   └── server.js             # Express app entrypoint with CORS & health check
│   ├── render.yaml               # Render Infrastructure-as-Code Blueprint
│   ├── .env.example              # Backend environment variable template
│   ├── test.js                   # Automated 23-point end-to-end API test suite
│   └── package.json
│
├── render.yaml                   # Monorepo-level Render Blueprint
├── package.json                  # Root monorepo workspace scripts
└── README.md
```

---

## 🚀 Live Deployment Guide

### Part 1: Deploy Backend & PostgreSQL on Render

#### Option A: 1-Click Render Blueprint (Fastest)
1. Log in to [Render.com](https://render.com).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository: `https://github.com/Revanth-432/Full-Stack`.
4. Render detects `render.yaml` and provisions:
   - **PostgreSQL Database** (`taskmanager-db`)
   - **Node.js Web Service** (`task-manager-api`)
5. Click **Apply**.
6. When deployment finishes, copy your live backend URL (e.g., `https://task-manager-api-xxxx.onrender.com`).

#### Option B: Manual Setup on Render
1. **Create PostgreSQL Database**:
   - Go to **New +** → **PostgreSQL**.
   - Name: `taskmanager-db`, Plan: **Free**.
   - Once provisioned, copy the **Internal Database URL** (or External Database URL).
2. **Create Web Service**:
   - Go to **New +** → **Web Service** → Connect `Full-Stack`.
   - **Root Directory**: `Rest API with Node`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     | Key | Value |
     | :--- | :--- |
     | `DATABASE_URL` | *Paste your Render PostgreSQL connection string* |
     | `JWT_SECRET` | *Click "Generate" or provide a secure 32+ char string* |
     | `JWT_EXPIRES_IN` | `24h` |
     | `NODE_ENV` | `production` |
     | `CLIENT_URL` | *Your Vercel URL (e.g. `https://your-app.vercel.app`)* |
3. Click **Create Web Service**.
4. Test backend health: Visit `https://your-api.onrender.com/api/health` in your browser.

---

### Part 2: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import the `Full-Stack` repository.
4. In **Project Configuration**:
   - **Root Directory**: Click **Edit** and select `React_FrontEnd`.
   - **Framework Preset**: Vite (auto-detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://your-api.onrender.com` (Your live Render backend URL) |
6. Click **Deploy**.
7. Vercel will build and assign your production URL (e.g., `https://taskflow-xxxx.vercel.app`).

---

### Part 3: Connect Frontend & Backend CORS

1. Go back to your Render Dashboard → Web Service → **Environment**.
2. Add or update:
   - `CLIENT_URL` = `https://your-app.vercel.app`
3. Click **Save Changes** (Render will re-deploy with updated CORS headers).

---

## 🧪 Verification & Acceptance Testing

Test the live full-stack flow on your deployed Vercel site:

1. **Health Verification**:
   - Open your Vercel URL.
   - Look at the header status badge — it will display **"API Online"** in green.
2. **User Registration**:
   - Navigate to `/register`.
   - Register a new account (`username`, `email`, `password`).
3. **Authentication & Session**:
   - Log in with the registered credentials.
   - Verify JWT token is stored and profile displays.
4. **Task CRUD Operations**:
   - **Create**: Add a new task with title, priority, and due date.
   - **Read**: Verify task appears in list with correct filtering & search.
   - **Update**: Click edit to modify title or toggle status between `pending`, `in_progress`, and `completed`.
   - **Delete**: Remove a task and verify it disappears from view.
5. **Direct Link Reload (SPA Routing)**:
   - Navigate to `/tasks` or `/tasks/new` and press browser refresh (`F5`).
   - The page must reload smoothly without returning 404 (handled by `vercel.json` rewrites).

---

## 🛠️ Local Development

```bash
# Clone the monorepo
git clone https://github.com/Revanth-432/Full-Stack.git
cd Full-Stack

# Install dependencies for both projects
cd "React_FrontEnd" && npm install
cd "../Rest API with Node" && npm install
cd ..

# Run backend locally (uses local SQLite or local PG)
npm run backend:dev

# Run frontend locally (Vite dev server)
npm run frontend:dev

# Run automated backend test suite
npm run backend:test
```

---

## 📄 License
ISC
