# STATA Frontend

React + TypeScript SPA for the STATA student welfare organization website, ISRT, University of Dhaka.

---

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** — styling
- **React Router v7** — client-side routing
- **Lucide React** — icons
- **Custom REST API** — see [`../backend`](../backend/README.md)

---

## Quick Start

### Prerequisites

- Node.js 18+
- Backend API running (see [`../backend`](../backend/README.md))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_UPLOAD_URL=http://localhost:3000
VITE_FRONTEND_URL=https://yourdomain.com
```

### 3. Start development server

```bash
npm run dev
```

App available at `http://localhost:5173`

### 4. Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploy via Vercel or any static host — a `vercel.json` is included with SPA redirect rules.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |

---

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx              # Main layout wrapper (Outlet)
│   ├── Navigation.tsx          # Top navigation bar
│   ├── Footer.tsx              # Footer with visitor counter
│   ├── Logo.tsx / LogoLoader.tsx / LogoLoaderFull.tsx
│   ├── MarkdownEditor.tsx      # Post editor
│   ├── MarkdownRenderer.tsx    # Post renderer
│   ├── FeatureCard.tsx
│   └── aspl/
│       ├── RegistrationForm.tsx
│       ├── UpdateRegistrationForm.tsx
│       └── Slideshow.tsx
├── contexts/
│   └── AuthContext.tsx          # JWT auth state (admin + member)
├── lib/
│   └── api.ts                  # Typed API client (all endpoints)
├── pages/
│   ├── Home.tsx
│   ├── About.tsx
│   ├── People.tsx
│   ├── Events.tsx / EventView.tsx
│   ├── Posts.tsx / PostView.tsx
│   ├── Gallery.tsx
│   ├── Contact.tsx
│   ├── Login.tsx / Signup.tsx
│   ├── MemberAccount.tsx
│   ├── UpdateProfile.tsx
│   ├── ChangePassword.tsx / SetPassword.tsx
│   ├── SubmitPost.tsx
│   ├── aspl/
│   │   ├── AsplPage.tsx        # ASPL league public view
│   │   └── PlayersPage.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── ManageMembers.tsx
│       ├── ManagePosts.tsx / PostEditor.tsx
│       ├── ManageEvents.tsx
│       ├── ManageGallery.tsx
│       ├── Communications.tsx  # Email campaigns
│       ├── Messages.tsx
│       ├── Settings.tsx
│       ├── ManageAdmins.tsx
│       └── aspl/
│           ├── AsplAdmin.tsx
│           ├── AsplSlideshow.tsx
│           ├── SeasonDetail.tsx
│           ├── SeasonForm.tsx
│           └── BidManager.tsx
├── App.tsx                     # Routes definition
└── main.tsx                    # Entry point
```

---

## Pages & Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Home | Public |
| `/about` | About | Public |
| `/people` | Members directory | Public |
| `/events` | Events list | Public |
| `/events/:id` | Event detail | Public |
| `/posts` | Blog posts | Public |
| `/posts/:id` | Post detail | Public |
| `/gallery` | Gallery | Public |
| `/contact` | Contact form | Public |
| `/login` | Admin/member login | Public |
| `/signup` | Member signup | Public |
| `/set-password` | Set initial password | Member |
| `/account` | Member profile | Member |
| `/account/update` | Update profile | Member |
| `/account/change-password` | Change password | Member |
| `/submit-post` | Submit a post | Member |
| `/aspl` | ASPL league | Public |
| `/aspl/players` | ASPL players | Public |
| `/admin/dashboard` | Admin dashboard | Admin |
| `/admin/members` | Manage members | Admin |
| `/admin/posts` | Manage posts | Admin |
| `/admin/events` | Manage events | Admin |
| `/admin/gallery` | Manage gallery | Admin |
| `/admin/communications` | Email campaigns | Admin |
| `/admin/settings` | Site settings | Admin |
| `/admin/aspl` | ASPL management | Admin |

---

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary | Deep Navy Blue | `#1F2A44` |
| Accent | Royal Blue | `#2F5BEA` |
| Background | White | `#FFFFFF` |
| Success | Soft Green | `#2ECC71` |
| Neutral | Light Gray | `#F5F7FA` |
| Text | Dark Gray | `#4A4A4A` |
| Warning | Warm Orange | `#F39C12` |
| Danger | Soft Red | `#E74C3C` |

Custom fonts: **Fredoka** (headings) and **Kanit Bold** (accents), served from `/public/fonts/`.

---

## Authentication

Auth state is managed via `AuthContext`. Two auth levels exist:

- **Admin** — full site management; JWT stored in `localStorage`
- **Member** — registered ISRT students; separate member JWT

Protected admin routes redirect to `/login` if unauthenticated.

---

## API Integration

All backend communication is centralised in `src/lib/api.ts`. It exports typed functions for every resource (members, posts, events, gallery, ASPL, admin, etc.) and reads `VITE_API_URL` from the environment.

Image URLs are constructed using `VITE_UPLOAD_URL`.

---

## Support

- Email: stata@isrt.ac.bd
- Built for the STATA community at ISRT, University of Dhaka.
