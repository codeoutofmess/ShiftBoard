# ShiftBoard

[![CI](https://github.com/codeoutofmess/ShiftBoard/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/codeoutofmess/ShiftBoard/actions/workflows/ci.yml)

A small shift-scheduling app for managing employees, locations, and rosters. Built as a
personal project to get hands-on with ASP.NET Core + EF Core + React, a stack that shows
up constantly in NZ job postings but that I hadn't used commercially.

**This is a personal project, not production software or commercial work experience.**

<!-- Add a screenshot here once deployed, e.g.: ![ShiftBoard shifts view](docs/screenshot.png) -->

## Features

- JWT authentication (register/login), with role-based access control (`Admin` / `Staff`)
- Employees, Locations, and Shifts, with full CRUD for Admins and read-only access for Staff
- Shift overlap prevention — an employee can't be double-booked across two shifts
- Week-based shift view with day-by-day breakdown and week navigation
- Inline location creation from the shift form (no separate admin screen needed yet)

## Tech stack

| Layer    | Choice                                                              |
| -------- | -------------------------------------------------------------------- |
| Backend  | ASP.NET Core 8 Web API, EF Core, SQLite, JWT auth, BCrypt password hashing |
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4, React Router, Axios     |

## Project structure

```
ShiftBoard.Api/    ASP.NET Core Web API
ShiftBoard.Web/    React + TypeScript frontend
```

## Getting started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) 20+

### Backend

```bash
cd ShiftBoard.Api
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 48)"
dotnet run
```

The JWT signing key is deliberately kept out of `appsettings.json` and out of git — it
lives in your local [user-secrets store](https://learn.microsoft.com/aspnet/core/security/app-secrets)
instead. `appsettings.json` only holds the non-secret `Jwt:Issuer`/`Jwt:Audience`/`Jwt:ExpiryMinutes`.

In Development, the API automatically applies EF Core migrations and seeds demo data
(see below) on startup — no manual `dotnet ef database update` needed for a fresh clone.
The API listens on `http://localhost:5199` by default (`ShiftBoard.Api/Properties/launchSettings.json`).

### Frontend

```bash
cd ShiftBoard.Web
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server assumes the API is running on
`http://localhost:5199` (see `.env` / `VITE_API_BASE_URL`).

### Demo credentials

Seeded automatically on first run against a fresh database (Development only):

| Role  | Email                    | Password       |
| ----- | ------------------------ | -------------- |
| Admin | admin@shiftboard.local   | `Password123!` |
| Staff | sam@shiftboard.local     | `Password123!` |
| Staff | jess@shiftboard.local    | `Password123!` |

A few sample shifts for the current week are seeded too. Seeding is a no-op if the
`Employees` table already has data, so it's safe across restarts.

## Design notes / known limitations

A few deliberate simplifications, worth knowing about if you're reading the code:

- **RBAC is role-only, not ownership-based.** Any `Admin` can manage any employee's
  shifts; there's no "staff can edit their own shift" concept.
- **JWTs are stateless.** Deleting an employee doesn't invalidate their already-issued
  token — it stays valid until it expires (`Jwt:ExpiryMinutes`, default 60 minutes).
- **Timestamps are naive (no timezone).** The app assumes a single timezone throughout
  (fine for a single-region rostering app); `StartTime`/`EndTime` are stored and compared
  as plain local datetimes, not UTC.
- **`react-router-dom` has one open advisory** ([GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2))
  at the latest patched version. It's a CSRF issue specific to React Router's RSC
  (Server Components) mode, which this app — a plain client-rendered SPA — doesn't use.
  The alternative (downgrading) reintroduces over a dozen *other* real vulnerabilities, so
  latest was the safer choice.

## API overview

All endpoints except `/api/auth/register` and `/api/auth/login` require a Bearer token.
Full interactive docs (with a built-in "Authorize" button for pasting a JWT) are at
`/swagger` in every environment, including the live deploy — it's a demo API with no
real user data, so leaving it discoverable is more useful than locking it down.

| Endpoint                  | Access          |
| -------------------------- | --------------- |
| `POST /api/auth/register`  | Public          |
| `POST /api/auth/login`     | Public          |
| `GET /api/employees`       | Any authenticated user |
| `PUT/DELETE /api/employees/{id}` | Admin      |
| `GET /api/locations`       | Any authenticated user |
| `POST/PUT/DELETE /api/locations` | Admin      |
| `GET /api/shifts`          | Any authenticated user (supports `employeeId`, `from`, `to` filters) |
| `POST/PUT/DELETE /api/shifts` | Admin (rejects overlapping shifts for the same employee) |

## Deployment

- **API** ([`ShiftBoard.Api/Dockerfile`](ShiftBoard.Api/Dockerfile)) → [Render](https://render.com),
  as a Docker web service. [`render.yaml`](render.yaml) is a Render Blueprint — pointing
  Render at this repo auto-configures the service, including a securely generated
  `Jwt:Key` (Render's `generateValue`, never touches git), and re-syncs automatically on
  every push to `main`. SQLite runs on Render's free tier's ephemeral disk, so data
  resets on every deploy/restart — intentional here, since `SeedDemoData=true`
  immediately repopulates the same clean demo dataset. The free tier also spins down
  after inactivity, so the first request after a while can take ~50s to respond.
- **Frontend** (`ShiftBoard.Web/`) → [Vercel](https://vercel.com), zero-config Vite
  detection. `VITE_API_BASE_URL` is set in the Vercel project's environment variables to
  the deployed Render API's URL + `/api`.

**Live demo:** https://shiftboard-web-theta.vercel.app
(API: https://shiftboard-api.onrender.com, Swagger at `/swagger`)

## CI/CD

A small GitHub Actions pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)),
set up as a learning exercise for this personal project.

**CI** runs on every push and pull request, as two parallel jobs:

| Job      | Steps                                                  |
| -------- | ------------------------------------------------------ |
| Backend  | `dotnet restore` → `build` → `test` (.NET 8)           |
| Frontend | `npm ci` → `lint` (oxlint) → `typecheck` (tsc) → `build` (Node 22) |

Actions are pinned to commit SHAs, the workflow token is read-only, dependencies are
cached, and a newer push to the same branch cancels the older run.

**CD** is host-side rather than a deploy job in the workflow, and is only as strong as each
host's setting:

- **API (Render):** `render.yaml` sets `autoDeployTrigger: checksPass` on `main`, so Render
  deploys only after the commit's GitHub checks pass.
- **Frontend (Vercel):** Vercel's own Git integration deploys `main`. Vercel does not wait for
  CI itself; the gate is that `main` only receives changes through pull requests whose CI
  checks must pass (branch protection).

**Tests:** `ShiftBoard.Api.Tests` covers the shift validation and overlap rules (including
back-to-back shift boundaries) against an in-memory SQLite database. That is the only logic
tested; there are no frontend or end-to-end tests.

Not covered: staging environment, automated rollbacks, monitoring/alerting, security
scanning, or building the Docker image in CI.

```bash
dotnet test ShiftBoard.sln                      # run the backend tests locally
cd ShiftBoard.Web && npm run lint && npm run typecheck && npm run build
```
