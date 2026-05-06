# STATA Backend API

Production-ready REST API for STATA — Student Welfare Organization of ISRT, University of Dhaka.

---

## Tech Stack

- **Node.js + Express.js** — API server
- **PostgreSQL + Prisma ORM** — Database
- **JWT** — Admin authentication
- **Multer** — Image uploads
- **Joi** — Validation
- **Helmet + Rate Limit** — Security

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### 3. Set up database
```bash
npx prisma migrate dev --name init
npm run prisma:seed
```
> Default admin: `admin` / `admin123` — **change immediately in production!**

### 4. Start server
```bash
# Development
npm run dev

# Production
npm start
```

---

## Project Structure

```
/src
  /controllers     — Request handlers (member, post, event, committee, admin)
  /routes          — Route definitions (public + admin)
  /middlewares     — Auth, validation, error handling
  /config          — Database (Prisma) and upload (Multer) config
  /validators      — Joi validation schemas
  /utils           — Slug generation, pagination helpers
/prisma
  schema.prisma    — Database schema
  seed.js          — Seeds default admin
/uploads           — Uploaded images (served at /uploads/...)
```

---

## API Reference

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/register` | Register a new member |
| GET | `/api/members` | List all members (paginated) |
| GET | `/api/members?batch=2018` | Filter by batch |
| GET | `/api/members/export` | Download members CSV |
| GET | `/api/committees` | List all committees |
| GET | `/api/posts` | List published posts (paginated) |
| GET | `/api/posts/:slug` | Get single post |
| GET | `/api/events` | List all events |
| GET | `/api/events?type=upcoming` | Upcoming events |
| GET | `/api/events?type=past` | Past events |
| GET | `/api/events/:id` | Get single event |
| GET | `/health` | Health check |

### Admin Endpoints (JWT required)

All admin routes require `Authorization: Bearer <token>` header.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | Get JWT token |
| GET | `/api/admin/dashboard` | Stats overview |
| POST | `/api/admin/committee` | Create committee year |
| POST | `/api/admin/committee/assign` | Assign president/secretary + image upload |
| DELETE | `/api/admin/committee/:id` | Delete committee |
| POST | `/api/admin/posts` | Create post (+ optional image) |
| PUT | `/api/admin/posts/:id` | Update post |
| DELETE | `/api/admin/posts/:id` | Delete post |
| PATCH | `/api/admin/posts/:id/toggle` | Toggle publish status |
| POST | `/api/admin/events` | Create event (+ optional banner) |
| PUT | `/api/admin/events/:id` | Update event |
| DELETE | `/api/admin/events/:id` | Delete event |

---

## Registration Rules

Required fields: `batch`, `full_name`, `email`, `phone_number`, `notify_events`

- Email must be unique
- `notify_events` must be explicitly `true` or `false`
- Batch must be a valid integer year

---

## Image Upload Rules

- Accepted: `jpg`, `jpeg`, `png`, `webp`
- Max size: **2MB**
- Stored in `/uploads/` with UUID filename
- Served at `/uploads/<filename>`
- Pass as `multipart/form-data`

---

## Committee Assignment

Each committee year can have exactly:
- **1 PRESIDENT**
- **1 GENERAL_SECRETARY**

Attempting to assign a duplicate position returns `409 Conflict`.

---

## Pagination

All list endpoints support:
- `?page=1` (default: 1)
- `?limit=20` (default: 20, max: 100)

Response format:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Member Flags

`GET /api/members` includes computed flags:
- `is_committee_member` — true if appears in any committee
- `is_president_or_secretary` — true if assigned as PRESIDENT or GENERAL_SECRETARY

---

## Security Features

- **Helmet** — HTTP security headers
- **Rate limiting** — Global (200 req/min) + Registration (10 per 15 min)
- **JWT** — All admin routes protected
- **Prisma** — Parameterized queries prevent SQL injection
- **bcrypt** — Admin password hashing (12 rounds)
- **Joi** — Input validation on all endpoints
- **Multer** — File type + size restrictions

---

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/stata_db"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=2097152
UPLOAD_PATH=uploads
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["detail 1", "detail 2"]  // only for validation errors
}
```

Common HTTP codes:
- `400` — Validation error
- `401` — Unauthorized
- `404` — Not found
- `409` — Conflict (duplicate email, position)
- `500` — Internal server error
