# Rubber Plantation Manager: App Overview and Tech Stack

This document describes what the app does, how it is built, and how the pieces fit together. For the full product requirements and milestone plan, see [PRD.md](../PRD.md).

## What the app is

Rubber Plantation Manager is a web app for running a rubber estate in Kerala. It covers the daily work of an estate:

- managing fields (blocks) and the trees in them
- assigning tappers to tapping tasks
- logging each day's latex collection
- calculating worker wages under different pay models
- tracking expenses, sheet production and sales
- showing all of it on one owner dashboard

**Phase 1** is a frontend-only prototype. Everything runs in the browser on generated sample data, with no server or login. The goal is to put the screens, flows and calculations in front of plantation owners before building a backend.

## Who uses it

| Role | Uses the app for | Main device |
|---|---|---|
| **Owner** | Dashboard, approving and paying wages, expenses, sales | Desktop and phone |
| **Supervisor** | Logging daily tapping, attendance, field work | Phone, in the plantation at 6 a.m. |
| Tapper (later phase) | Viewing own earnings and payslips | Phone |

A switch in the header changes between the Owner and Supervisor views. The Supervisor view hides the owner-only screens (Dashboard, Payments, Expenses, Production & sales) and opens on **Today**.

## Screens

| Screen | Who | What it shows today |
|---|---|---|
| **Dashboard** | Owner | Date range picker (today, week, month, season, custom). Eight KPI cards: latex, dry rubber, trees tapped, rain-off days, income, expenses, estimated profit, cost per kg vs market. Charts for daily dry rubber with rain-off markers, yield by field, income vs expenses by month, and expenses by category. Tapper leaderboard with low-yield flags, an alerts panel, and stock on hand with its estimated value. |
| **Today** | Supervisor | Tasks due today per tapping system, with tapper and tree count. Tapping a card opens an entry sheet with tree count and DRC filled in. It also has a "Mark rain-off for all" button and a running total of litres and dry kg. |
| **Fields** | Both | The five blocks with area, clone, planting year, tree count, tapping system, status, and dry kg per acre this month. |
| **Tapping tasks** | Both | The 14 tasks with field, trees, rain-guard flag and 30-day average kg/day. You can reassign the tapper from a dropdown; unassigned tasks are highlighted. |
| **Workers** | Both | All 16 workers with role, pay model, phone, assigned tasks, earnings this month, and an active toggle. |
| **Tapping log** | Both | Every daily entry, filterable by date range, field, tapper and status, with totals and CSV export. |
| **Payments** | Owner | Monthly payroll per tapper: days, trees, dry kg, gross, advance deduction, bonus, net and status. Each row expands into a line-by-line calculation. Rows can be approved and marked paid, and payslips shared to WhatsApp. Advances can be recorded and tracked. |
| **Field work** | Both | Upcoming jobs (fertilizer rounds, weeding, spraying) and completed jobs with labour and material cost. |
| **Expenses** | Owner | All expenses with filters by category, field and month, and a totals row. Includes a recurring-expenses section and an add-expense form. Wage rows appear automatically from approved and paid pay periods, and are labelled as such. |
| **Production & sales** | Owner | Stock cards, production batches with a drying → smoking → ready → sold tracker, a market-price chart with our sale rates plotted on it, and the sales table with balance due. |
| **Settings** | Both | Estate details, language, default DRC, latex density, pay period, rain-off allowance, advance deduction, and a "Reset demo data" button. |

**Not built yet:** detail pages (field detail, worker profile, task history), add/edit forms for fields and workers, the calendar heatmap, inline editing of log rows, and the printable payslip view. These are planned for Milestones 3–7 (see [Roadmap status](#roadmap-status)).

## Tech stack

| Concern | Choice | Version | Why |
|---|---|---|---|
| Framework | React + TypeScript | 18.3 / 5.6 | Typed domain model shared by screens, mock layer and calculations |
| Build tool | Vite | 6.4 | Fast dev server and builds |
| Styling | Tailwind CSS | 4.3 | Utility classes driven by theme tokens; dark mode via a `.dark` class |
| Components | shadcn/ui conventions (Radix Slot, class-variance-authority, tailwind-merge) | — | Components are copied into the repo and owned locally. `components.json` is set up for `npx shadcn add`. |
| Routing | React Router | 6.30 | Browser router locally, memory router in the hosted demo |
| Server state | TanStack Query | 5 | Caching, loading states, and cache refresh after a save |
| UI state | Zustand (persisted) | 5 | Role, language, theme |
| Charts | Recharts | 2.15 | Line, bar, composed and donut charts |
| i18n | i18next + react-i18next | 23 / 15 | English and Malayalam |
| Dates | date-fns | 4 | Date ranges, schedules, formatting |
| Icons | Lucide | — | Consistent stroke icons |
| Toasts | Sonner | 2 | Save and status feedback |
| Tests | Vitest | 3.2 | Unit tests for calculations and seed data |
| Fonts | Inter, Noto Sans Malayalam (Google Fonts) | — | Readable Latin and Malayalam script |

React Hook Form and Zod (named in the PRD for forms) are not added yet. The current forms are small enough to use plain controlled inputs. They will come in when the add/edit forms are built.

## Architecture

```
Screens (src/features/*)
   │  use hooks from
   ▼
services/queries.ts      TanStack Query hooks and cache keys
   │  call
   ▼
services/api.ts          ← the only data entry point for screens
   │  re-exports (today) / will call a real API (later)
   ▼
mocks/service.ts         async functions with 200–400 ms simulated latency
   │
   ▼
mocks/db.ts              in-memory database, persisted to localStorage
   │  first load or reset
   ▼
mocks/seed.ts            deterministic generator (seeded random)

lib/calculations.ts      pure functions used by both the mock service and screens
```

**Key rule:** screens never import from `src/mocks/`. They call `services/api.ts`, usually through the hooks in `services/queries.ts`. To switch to a real backend, change `api.ts` to make HTTP calls; nothing else needs to change.

**Data freshness:** after a save (a tapping entry, a tapper assignment, a pay approval, a new expense), the affected queries are invalidated. Payroll and dashboard totals then update without a page reload.

**Persistence:** the mock database is saved to `localStorage` under the key `rpm-db`, so demo entries survive reloads. Settings → "Reset demo data" regenerates the original sample estate. UI preferences (role, language, theme) are stored separately under `rpm-ui`.

### Folder structure

```
src/
  app/            app shell: router, sidebar, bottom tabs, header, nav config (nav.ts)
  components/     shared UI: PageHeader, EmptyState, StatCard, SearchBar, chart theme
    ui/           primitives: button, card, input/select, badge, table, skeleton, segmented
  features/       one folder per screen
    dashboard/ today/ fields/ tasks/ workers/ tapping/
    payments/ fieldwork/ expenses/ sales/ settings/
  i18n/           en.json, ml.json, i18next setup
  lib/            calculations, formatters, schedule, seeded random, dates
  mocks/          seed generator, localStorage db, mock service
  services/       api.ts (data entry point), queries.ts (TanStack Query hooks)
  store/          Zustand UI store
  types/          domain types
```

## Data model

The hierarchy is **Estate → Field → Tapping task → Trees**, with a **Worker** assigned to each task. All types live in `src/types/index.ts`:

- `Estate`, `Field`, `TappingTask`, `Worker` (with a `PayModel` union: per tree, per kg, daily wage, share)
- `TappingLog`: one per task per tapping day. Status is tapped, rain-off, absent or holiday, with litres, DRC % and scrap kg.
- `FieldWork`, `Expense`, `Advance`, `PayPeriod`
- `ProductionBatch`, `Sale`, `MarketPrice`
- `Settings`, and `Database` (the whole persisted store)

## Sample data

`src/mocks/seed.ts` generates the same data every time for a given date, and always relative to today, so the demo has recent data:

- **Estate:** 1 estate (Meenachil Estate, Pala), 5 blocks (one immature), 14 tapping tasks, 5,220 trees
- **Workers:** 16 workers (12 tappers on mixed pay models, 3 field workers, 1 supervisor)
- **Tapping logs:** about 6 months of daily logs that follow each block's tapping system (S/2 d2 alternate days, S/2 d3 every third day)
- **Patterns built in:**
  - monsoon rain-off spells in June–July (rain-guarded tasks can often still tap)
  - a seasonal yield curve with a wintering dip in Feb–Mar
  - per-task DRC between 30 and 38%
  - two tappers with noticeably lower yield
  - one recent DRC drop and one unassigned task, so the dashboard has alerts to show
- **Money and production:**
  - about 120 expenses plus recurring monthly electricity
  - 30 sales, 12 production batches, 8 advances
  - monthly pay periods: older months paid, last month approved, current month draft
- **Prices:** a daily RSS4 market price series between ₹180 and ₹210/kg

## Calculation rules

All rules are pure functions in `src/lib/calculations.ts`, covered by `calculations.test.ts`:

| Rule | Formula |
|---|---|
| Dry rubber | litres × density × DRC% ÷ 100 (density defaults to 1 kg/L and is a setting) |
| Per-tree pay | trees tapped × rate (₹1.80) |
| Per-kg pay | (dry kg + scrap kg × 0.5) × rate (₹45) |
| Daily wage | days tapped × ₹750 + ₹30 per dry kg above 12 kg on each day |
| Share | dry kg × average market rate for the period × 40% |
| Net pay | gross + bonus − min(outstanding advance, owner's deduction) |
| Cost per kg | (expenses + wages) ÷ dry kg |
| Yield per tree | dry kg ÷ trees tapped, shown in grams |
| Estimated profit | sales received + unsold stock at market price − expenses |
| Low-yield flag | tapper's 14-day kg/tree < 75% of the estate average |

Only `tapped` days earn pay. Rain-off days pay nothing unless a rain-off allowance is set in Settings.

## Design and accessibility

- **Palette:** deep rubber-leaf green primary, latex off-white surfaces, warm amber for warnings, muted red for losses. All colours are CSS variables in `src/index.css`, with light and dark values.
- **Numbers:** ₹ with Indian digit grouping (₹1,24,500); litres, kg and DRC to one decimal; tabular figures; units in every label and column header. All formatting goes through `src/lib/format.ts`.
- **Mobile first:** the Today screen is designed for 375px, with 48px+ touch targets and numeric keypads (`inputMode`) on number fields. On mobile, a bottom tab bar and a "More" sheet replace the sidebar.
- **Language:** every string goes through i18next. Malayalam translations are drafts and need review by a native speaker.
- **Accessibility:** form fields are labelled, controls are keyboard-focusable with visible focus rings, and toggles use radio-group semantics.

## Running, testing and hosting

```bash
npm install
npm run dev          # local dev server at http://localhost:5173
npm test             # Vitest unit tests
npm run build        # typecheck + production build to dist/
npm run build:demo   # single-file build to dist-demo/index.html
```

`build:demo` inlines all JS and CSS into one HTML file and uses an in-memory router. This lets the app run as a static page inside a sandboxed frame, which is how the hosted preview is published. In that mode the address bar does not change between screens, and CSV export may be blocked by the host.

## Roadmap status

| Milestone | Status |
|---|---|
| 1. Foundation: setup, routing, app shell, i18n, formatters | Done |
| 2. Data layer: types, seed generator, mock service, persistence, calculations + tests | Done |
| 3. Fields, tasks, workers: lists and tapper assignment done | Detail pages and add/edit forms pending |
| 4. Daily tapping: Today entry flow and log history done | Calendar heatmap and inline row edit pending |
| 5. Payments: payroll table, breakdown, approve/pay, advances, WhatsApp share done | Printable payslip and weekly/fortnightly periods pending |
| 6. Expenses, field work, production and sales: lists and add-expense done | Receipt photo, field-work logging form, batch stage updates pending |
| 7. Dashboard: KPIs, charts, alerts, leaderboard, stock done | Final polish pass pending |

### Open questions for demos

These come from the PRD; the prototype supports every option so they can be settled with real owners:

- How are tappers actually paid: per tree, per kg, daily wage, or share?
- Who enters data day to day: owner, supervisor, or tappers?
- Are RSS sheets made on site, or is latex sold directly?
- Is DRC measured daily per tapper, or once per batch?
- One estate, or a SaaS for many plantation owners?
- Pay frequency: weekly, fortnightly, or monthly?
