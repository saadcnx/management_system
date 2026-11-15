# LMS — Laboratory Management System

Multi-tenant, role-based LMS. Next.js 14 (App Router) + Express 4 + MongoDB.

## Structure

- `frontend/` — Next.js app
- `backend/`  — Express API
- `docker-compose.yml` — Mongo + API + Web

## Local Setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:5000
npm run seed         # create Super Admin (once)
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

### Docker

```bash
docker compose up -d
```

## Roles

| Role | Capabilities |
|------|-------------|
| Super Admin | Create labs + Lab Admins, view all labs |
| Lab Admin | Manage staff, register/edit/deactivate patients |
| Doctor | Read-only patient view |
| Receptionist | Register/edit patients |

## Security

- JWT access (15m) + refresh (7d) in httpOnly cookies
- Refresh tokens rotated on every refresh, stored hashed in DB
- Tenant isolation enforced via Mongoose plugin + AsyncLocalStorage
- Login rate-limited (10 req / 15 min)
- API rate-limited (120 req / min)
- Mongo query sanitization (NoSQL injection)

## Tests

```bash
cd backend
npm test
```

Covers: auth login/refresh, tenant isolation (Lab A cannot see Lab B), patient code generation, role enforcement (403).

## Accessibility

- Visible focus rings (custom `--ring` token)
- Keyboard navigation everywhere (Radix + shadcn defaults)
- Icon buttons have aria-labels
- Status conveyed via text + color (badges)
- Respects `prefers-reduced-motion`

## Postman Checkpoint

Before wiring the frontend, verify the backend with Postman:

1. `POST /api/auth/login` → capture cookies
2. `GET /api/auth/me` → returns user
3. `POST /api/labs` (as Super Admin) → creates lab + admin
4. `GET /api/patients` (as Lab Admin) → empty list
5. `POST /api/patients` → creates `PT-0001`
6. `GET /api/dashboard/stats` → role-specific payload
7. Cross-tenant: Lab A cookie + Lab B patient id → 404