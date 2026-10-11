# Rubber Plantation Manager (Phase 1 frontend)

Clickable frontend for managing a rubber plantation, running entirely on mock data. See [PRD.md](PRD.md) for the full spec and milestone plan.

## Run

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # Vitest
npm run build   # typecheck + production build
```

## Status

- [x] **Milestone 1 — Foundation:** Vite + React 18 + TS, Tailwind v4 with shadcn/ui conventions, React Router, app shell (sidebar on desktop, bottom tabs + "More" sheet on mobile), header with Owner/Supervisor role switch, EN/ML language toggle and dark mode, i18n scaffold, INR/kg/L formatters
- [ ] Milestone 2 — Data layer
- [ ] Milestone 3 — Fields, tasks, workers
- [ ] Milestone 4 — Daily tapping
- [ ] Milestone 5 — Payments
- [ ] Milestone 6 — Expenses, field work, production and sales
- [ ] Milestone 7 — Dashboard and polish

## Conventions

- Screens get data only through `src/services/api.ts`; never import from `src/mocks/` directly.
- Every UI string goes through `react-i18next` (`src/i18n/en.json`, `ml.json`).
- Number display goes through `src/lib/format.ts` (₹ with Indian grouping, 1-decimal L/kg/%).
- Navigation and per-role visibility are defined once in `src/app/nav.ts`.
