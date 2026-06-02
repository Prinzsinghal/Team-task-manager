# Team Task Manager

Full-stack web app for creating projects, assigning tasks, and tracking progress with **Admin** / **Member** role-based access control.

## Features

- **Authentication** — Sign up, log in, JWT sessions
- **Projects & teams** — Create projects, invite members by email, assign roles
- **Tasks** — Create, assign, update status (To Do / In Progress / Done), due dates
- **Dashboard** — Summary stats, overdue tasks, status breakdown, my tasks
- **RBAC** — Admins manage members and project settings; all members can manage tasks

## Tech Stack

| Layer    | Stack                                      |
|----------|--------------------------------------------|
| Backend  | Node.js, Express, Prisma, SQLite, JWT      |
| Frontend | React 19, Vite, React Router               |
| API      | REST (`/api/*`) with validation            |

## Quick Start

### Prerequisites

- Node.js 18+ (npm included)

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

API runs at **http://localhost:3001**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173** (proxies `/api` to the backend)

### Demo accounts (after seed)

| Role   | Email               | Password     |
|--------|---------------------|--------------|
| Admin  | admin@example.com   | password123  |
| Member | member@example.com  | password123  |

## API Overview

### Auth
- `POST /api/auth/signup` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user (Bearer token)

### Projects
- `GET /api/projects` — List user's projects
- `POST /api/projects` — Create project (creator becomes Admin)
- `GET /api/projects/:id` — Project detail with tasks & members
- `PATCH /api/projects/:id` — Update (Admin only)
- `DELETE /api/projects/:id` — Delete (Admin only)

### Members (Admin only for write)
- `GET /api/projects/:id/members`
- `POST /api/projects/:id/members` — `{ email, role? }`
- `PATCH /api/projects/:id/members/:memberId` — `{ role }`
- `DELETE /api/projects/:id/members/:memberId`

### Tasks
- `GET /api/tasks` — All tasks across projects (`?status=&projectId=&assignedToMe=true`)
- `GET /api/:projectId/tasks`
- `POST /api/:projectId/tasks`
- `PATCH /api/:projectId/tasks/:taskId`
- `DELETE /api/:projectId/tasks/:taskId`

### Dashboard
- `GET /api/dashboard` — Stats, overdue, due soon, my tasks

## Data Model

```
User ──┬── ProjectMember (role: ADMIN | MEMBER) ── Project
       ├── Task (assignee, creator)
       └── ownedProjects

Project ── Task (status: TODO | IN_PROGRESS | DONE)
```

## Role Permissions

| Action              | Admin | Member |
|---------------------|-------|--------|
| View project/tasks  | ✓     | ✓      |
| Create/edit tasks   | ✓     | ✓      |
| Add/remove members  | ✓     | ✗      |
| Change member roles | ✓     | ✗      |
| Edit/delete project | ✓     | ✗      |
