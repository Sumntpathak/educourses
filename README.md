# 📚 EduPortal Courses — Coaching Center Management SaaS

> Modern, lightweight SaaS for coaching centers and tuition institutes. Batches, students, fees, attendance, tests, and performance — all in one tablet-friendly portal. Sibling product to [eduportal.solutions](https://eduportal.solutions) (full school SaaS).

[![Live](https://img.shields.io/badge/live-courses.eduportal.solutions-0a7e3a?style=flat-square)](https://courses.eduportal.solutions)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)
[![Stack](https://img.shields.io/badge/stack-React%2019%20%C2%B7%20Vite%208-orange?style=flat-square)](#-tech-stack)

**🌐 Live:** https://courses.eduportal.solutions

---

## 🎯 What It Is

**EduPortal Courses** is the coaching-center sibling of EduPortal — a complete operational system for small to mid-size coaching institutes (10 to 500 students). Designed for tier-2/3 Indian tuition centers where the admin runs the entire show on a single tablet.

If you run a coaching class, NEET / JEE prep, language institute, or skills academy — this is for you.

---

## ✨ Features

### For Admin / Owner

- **Students** — register, manage, search, bulk import
- **Batches** — create batches, assign students, assign faculty, track progress
- **Fees** — collect fees, partial payments, pending dues, payment history, fee structure templates
- **Attendance** — mark by batch, by student, by date. Always-fresh, no caching
- **Tests** — schedule tests, publish marks, track score history
- **Performance** — per-student performance dashboards, batch averages, trend lines
- **Teachers** — onboard, assign batches, track teaching hours
- **Tools** — exports, print receipts, bulk operations

### For Teacher

- Personal dashboard with assigned batches
- Mark attendance for own batches
- View student performance under them
- Test creation and grading

### For Student

- View own batches, schedule, attendance %, fee status
- See test results and performance trend
- Access uploaded materials

---

## 🛠️ Tech Stack

**Frontend** — React 19 · Vite 8 · React Router 7 · lucide-react · html2canvas

**State** — React Context + custom auth provider · cached vs write-call API separation for offline tolerance

**Backend** — Action-based RPC pattern (`action: 'coaching_addBatch'`, `action: 'coaching_collectFee'` etc.) — pluggable to any backend (currently Google Apps Script / serverless function).

**Build / Deploy** — Vite · Cloudflare Pages · auto-deploy via `.github/workflows/deploy.yml`

---

## 🚀 Quick Start

```bash
git clone https://github.com/Sumntpathak/educourses.git
cd educourses
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Configure Backend

Create `.env` in project root:

```env
VITE_API_URL=https://your-backend-endpoint
```

The frontend posts `{ action, ...payload }` to this URL.

---

## 📦 Deployment

```bash
npm run build
# Deploy /dist to Cloudflare Pages, GitHub Pages, or any static host
```

GitHub Action auto-deploys on push to `main`.

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│  React 19 + Vite 8 PWA          │
│  Lazy-loaded route bundles      │
│  ErrorBoundary at every route   │
└──────────────┬──────────────────┘
               │
   ┌───────────┴──────────────┐
   │   API Layer              │
   │   _base.js               │
   │   ├─ cachedCall (reads)  │
   │   └─ writeCall (writes)  │
   └───────────┬──────────────┘
               │
       Action-based RPC
               │
   ┌───────────▼──────────────┐
   │   Backend (pluggable)    │
   │   GAS / Workers / Node   │
   └──────────────────────────┘
```

---

## 📂 Project Structure

```
educourses/
├── src/
│   ├── pages/
│   │   ├── admin/      # Home, Students, Batches, Fees, Tests, Attendance, Performance, Teachers, Tools
│   │   ├── teacher/    # Teacher dashboard
│   │   ├── student/    # Student portal
│   │   ├── Login.jsx
│   │   ├── Landing.jsx
│   │   └── Dashboard.jsx
│   ├── components/     # Shared UI
│   ├── api/            # _base, client, coaching API surface
│   ├── cache/          # IndexedDB cache layer
│   ├── context/        # AuthContext
│   ├── layouts/        # AppLayout
│   └── store/          # State store
├── public/             # Static assets, embed.js, _redirects
└── .github/workflows/  # Auto-deploy pipeline
```

---

## 🤝 Contributing

PRs welcome. Bug reports from real coaching center owners especially appreciated. Open an issue first for major changes.

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

---

## 👤 Author

**Sumant Pathak** — [@Sumntpathak](https://github.com/Sumntpathak)

Part of the [EduPortal](https://eduportal.solutions) family. Built with [Claude Code](https://www.anthropic.com/claude-code) using a multi-agent ticketing workflow.
