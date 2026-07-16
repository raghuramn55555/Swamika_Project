# Swamika — AI-Driven CV Search Engine (Frontend)

Angular 21 frontend for the Swamika recruitment platform.

---

## Quick start

```bash
git clone https://github.com/raghuramn55555/Swamika_Project.git
cd Swamika_Project/swamika-frontend
npm install
ng serve
```

Open **http://localhost:4200**

---

## Demo login

No backend needed. Use any of these accounts with any password of 6+ characters:

| Email | Password | Role |
|-------|----------|------|
| `admin@swamika.be` | `demo123` | Administrator |
| `recruiter@swamika.be` | `demo123` | Recruiter |
| `reviewer@swamika.be` | `demo123` | Reviewer |
| `auditor@swamika.be` | `demo123` | Auditor |

---

## Role-based access (per SRS)

| Screen | Administrator | Recruiter | Reviewer | Auditor |
|--------|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| CV Library (upload/delete) | ✅ | ✅ | — | — |
| Search | ✅ | ✅ | ✅ (view shared) | — |
| Results | ✅ | ✅ | ✅ (feedback only) | — |
| Team Composer | ✅ | ✅ | — | — |
| Shortlists | ✅ | ✅ | ✅ (view shared) | — |
| Administration | ✅ (full config) | — | — | ✅ (audit only) |

---

## Project structure

```
src/app/
├── auth/
│   └── login.component.ts          # Login page (landing)
│
├── shared/components/
│   ├── shell.component.ts          # All app state + data arrays
│   ├── shell.component.html        # All 7 views + sidebar + drawer
│   └── shell.component.scss        # Theme toggle pill styles
│
├── core/
│   ├── services/
│   │   ├── auth.service.ts         # Login, JWT, mock fallback
│   │   ├── theme.service.ts        # Dark/light toggle
│   │   ├── token.service.ts        # JWT read/write/validate
│   │   └── user.service.ts         # Profile + admin user management
│   ├── guards/
│   │   ├── auth.guard.ts           # Blocks unauthenticated access
│   │   ├── no-auth.guard.ts        # Redirects logged-in from /login
│   │   └── role.guard.ts           # Blocks wrong-role routes
│   ├── interceptors/
│   │   └── auth.interceptor.ts     # Attaches JWT to every HTTP request
│   └── models/
│       ├── user.models.ts          # UserRole, UserProfile, LoginRequest
│       └── api.models.ts           # PageResponse, ServiceResult
│
├── app.routes.ts                   # /login → LoginComponent
│                                   # /dashboard → ShellComponent (auth-guarded)
├── app.config.ts                   # Providers: router, HTTP+interceptor, animations
└── app.ts                          # Root component — just <router-outlet>
```

---

## Key design decisions

**No register page** — Users are created by an Administrator via Keycloak/Spring Security. The SRS has no mention of self-registration.

**Single shell component** — All 7 views (Dashboard, CV Library, Search, Results, Team Composer, Shortlists, Admin) live inside `shell.component.html`, shown/hidden with `@if`. Navigation is state-driven, not route-driven inside the shell.

**Data arrays in TypeScript** — Result cards, library rows, upload rows and health items are all arrays in `shell.component.ts`. The HTML uses `@for` loops — add/change data in one place, HTML updates automatically.

**Role checks in template** — `auth.hasRole('RECRUITER','ADMINISTRATOR')` controls which buttons and panels are visible. Same component, different UI per role.

**`BACKEND_AVAILABLE = false`** — In `auth.service.ts`. While the Spring Boot API isn't running, all auth calls use the local mock. Flip to `true` when the backend is ready — no other changes needed.

---

## Connecting to the Spring Boot backend

1. Set `BACKEND_AVAILABLE = true` in `src/app/core/services/auth.service.ts`
2. Add a proxy in `proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```
3. Serve with: `ng serve --proxy-config proxy.conf.json`

---

## Branch strategy

```bash
# Create your branch before starting work
git checkout -b feature/your-name-feature

# Push and open a PR when done
git push -u origin feature/your-name-feature
```

Never push directly to `main`.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone, zoneless) |
| Styling | Custom CSS (prototype tokens) + Angular Material |
| Icons | Font Awesome 6 + Material Icons |
| Fonts | Space Grotesk · Inter · IBM Plex Mono |
| Auth | JWT (Keycloak/Spring Security in production) |
| HTTP | Angular HttpClient + functional interceptor |
| State | Angular Signals |
| Build | Angular CLI + Vite |
