# STATA — Student Welfare Organization of ISRT

A full-stack web platform for **[Stata](https://www.stataisrt.org)**, the student welfare organization of the [Institute of Statistical Research and Training (ISRT)](https://www.isrt.ac.bd/), University of Dhaka.

> **Mission:** Connecting Minds, Building Bonds, Nourishing Well-being.

STATA organizes activities like BBQ parties, Iftar Mahfil, tours, cricket and football tournaments, and more — and serves as a bridge between current students and alumni for networking and mentorship.

**Website Link:** https://www.stataisrt.org
---------------------------------------

## Repository Structure

```
stata-main/
├── backend/    — Node.js + Express REST API
└── frontend/   — React + TypeScript SPA
```

---

## Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| Frontend         | React 18, TypeScript, Vite, Tailwind CSS |
| Backend          | Node.js, Express.js                      |
| Database         | PostgreSQL + Prisma ORM                  |
| Auth             | JWT (admin), Member-based auth           |
| Email            | Nodemailer (SMTP) + IMAP                 |
| Image Processing | Sharp, Multer                            |
| Deployment       | Vercel (frontend), Node server (backend) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### 1. Clone the repository

```bash
git clone <repository-url>
cd stata-main
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL, JWT secret, SMTP credentials, etc.
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Backend runs at `http://localhost:3000`

### 3. Set up the frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000/api
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Features

### Public

- Home page with hero section and latest posts
- Events listing (upcoming & past)
- Gallery, About, Contact pages
- Blog/posts with full post view
- People/members directory

### Member

- Registration and login
- Member account management, profile updates, password change
- Submit blog posts
- ASPL (league) registration and player lookup

### Admin

- Dashboard with statistics
- Manage members, posts, events, gallery
- Email campaigns and communications
- Committee management
- ASPL season and team management, bid manager

---

## Sub-READMEs

- [`backend/README.md`](./backend/README.md) — API reference, environment variables, project structure
- [`frontend/README.md`](./frontend/README.md) — Frontend setup, project structure, pages

---

## License

Created for STATA — Student Welfare Organization, ISRT, University of Dhaka.
