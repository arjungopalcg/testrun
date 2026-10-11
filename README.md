# Rubber Plantation Manager (Phase 1 frontend)

Clickable frontend for managing a rubber plantation, running entirely on mock data. See [docs/APP_OVERVIEW.md](docs/APP_OVERVIEW.md) for the tech stack, architecture and features, and [PRD.md](PRD.md) for the full spec and milestone plan.

## Run

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # Vitest
npm run build   # typecheck + production build
npm run build:demo  # single-file build for static hosting
```

## Status

- [x] **Milestone 1 — Foundation:** Vite + React 18 + TS, Tailwind v4 with shadcn/ui conventions, React Router, app shell (sidebar on desktop, bottom tabs + "More" sheet on mobile), header with Owner/Supervisor role switch, EN/ML language toggle and dark mode, i18n scaffold, INR/kg/L formatters
- [x] **Milestone 2 — Data layer:** domain types, deterministic seed generator, mock service with latency and localStorage persistence, calculations with unit tests
- [~] Milestones 3–7 — every screen now shows sample data (lists, payroll, charts, alerts); detail pages, add/edit forms and polish are still to do. See the roadmap in [docs/APP_OVERVIEW.md](docs/APP_OVERVIEW.md#roadmap-status).

## Conventions

- Screens get data only through `src/services/api.ts`; never import from `src/mocks/` directly.
- Every UI string goes through `react-i18next` (`src/i18n/en.json`, `ml.json`).
- Number display goes through `src/lib/format.ts` (₹ with Indian grouping, 1-decimal L/kg/%).
- Navigation and per-role visibility are defined once in `src/app/nav.ts`.
