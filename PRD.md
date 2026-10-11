# Rubber Plantation Manager — Frontend PRD

Oct 11, 2026 · @Arjun Gopal C G

## Overview

Phase 1 builds a clickable, fully navigable frontend for a rubber plantation management web app, running entirely on mock data with no backend. The goal is to validate screens, flows and calculations with plantation owners before building the API.

The app lets an owner manage fields and trees, assign tappers to tapping tasks, log daily latex collection, calculate worker payments, record expenses and sales, and see everything on one dashboard.

## Users

| Role | Uses the app for | Main device |
|---|---|---|
| Owner | Dashboard, payments approval, expenses, sales, reports | Desktop and phone |
| Supervisor | Daily tapping log, attendance, field work, latex entry | Phone (mobile-first) |
| Tapper (later phase) | View own earnings and payslips | Phone |

In Phase 1 a role switcher in the header toggles between Owner and Supervisor views; there is no real login.

## Tech stack and setup

Use React + TypeScript + Vite, with all data served from a local mock layer so it can be swapped for a real API later without touching screens.

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui components |
| Routing | React Router |
| State / data | TanStack Query over a mock service layer; Zustand for UI state (role, language, selected estate) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Icons | Lucide |
| i18n | react-i18next, English + Malayalam |
| Dates | date-fns |
| Mock persistence | localStorage, so entries survive reloads during demos |

### Folder structure

```
src/
  mocks/          # seed data (JSON/TS) + mock services with simulated latency
  types/          # domain types (see Data model)
  services/       # api.ts interface; mock implementation behind it
  features/
    dashboard/  fields/  workers/  tapping/  latex/
    payments/  fieldwork/  expenses/  sales/  settings/
  components/     # shared UI: StatCard, DataTable, PageHeader, EmptyState
  lib/            # calculations (dry rubber, wages), formatters (INR, kg, litres)
  i18n/           # en.json, ml.json
```

**Rule for Claude Code:** screens never import mock data directly; they call functions in `services/api.ts` (e.g. `getTappingLogs(date)`), which return Promises from the mock layer. Swapping to a backend later touches only that file.

## Domain glossary

Use these terms consistently in UI labels, code and mock data.

| Term | Meaning |
|---|---|
| Estate | The whole plantation owned by one owner |
| Field / Block | A named section of the estate, planted in the same year with the same clone |
| Clone | Rubber tree variety, e.g. RRII 105, RRII 430, RRIM 600 |
| Tapping task | A fixed group of trees (typically 300–450) tapped by one tapper on a given cycle |
| Tapping system | How often a task is tapped, e.g. S/2 d2 (alternate days), S/2 d3 (every third day) |
| Latex | The white liquid collected from tapped trees, measured in litres |
| DRC | Dry Rubber Content: % of actual rubber in latex, typically 28–40% |
| Dry rubber (kg) | litres × density (~1 kg/L) × DRC%; the basis for yield and sale value |
| Scrap / cup lump | Rubber that dries on the tapping cut or in the cup; collected and sold at a lower rate |
| RSS sheet | Ribbed Smoked Sheet, graded RSS 1–5; made by coagulating latex with formic acid, rolling and smoking |
| Rain-off day | Day tapping is cancelled due to rain |
| Rain guard | Plastic skirt fitted above the cut so tapping can continue in the monsoon |
| Wintering | Annual leaf-shedding period (roughly Jan–Mar) when yield drops and tapping may pause |
| Advance | Money paid to a worker ahead of wages, deducted later |

## Data model and mock data

The hierarchy is Estate → Field → Tapping task → Trees, with a Worker assigned to each task. Put these types in `src/types/` and generate seed data that matches them.

```ts
type ID = string;

interface Estate { id: ID; name: string; location: string; totalAreaAcres: number; ownerName: string; }

interface Field {
  id: ID; estateId: ID; name: string; areaAcres: number;
  plantingYear: number; clone: string; treeCount: number;
  status: 'immature' | 'tapping' | 'resting' | 'replanting';
  tappingSystem: 'S/2 d1' | 'S/2 d2' | 'S/2 d3';
}

interface TappingTask {
  id: ID; fieldId: ID; name: string;          // e.g. "Block A - Task 3"
  treeCount: number; assignedWorkerId: ID | null;
  rainGuarded: boolean;
}

interface Worker {
  id: ID; name: string; phone: string;
  role: 'tapper' | 'field_worker' | 'supervisor';
  payModel: PayModel; joinedOn: string; active: boolean;
  upiId?: string; bankLast4?: string;
}

type PayModel =
  | { kind: 'per_tree'; ratePerTree: number }
  | { kind: 'per_kg'; ratePerKgDry: number }
  | { kind: 'daily_wage'; dailyRate: number; incentivePerKgAbove?: { thresholdKg: number; rate: number } }
  | { kind: 'share'; workerSharePct: number };

interface TappingLog {
  id: ID; date: string; taskId: ID; workerId: ID;
  status: 'tapped' | 'rain_off' | 'absent' | 'holiday';
  treesTapped: number; latexLitres: number; drcPct: number;
  scrapKg: number; notes?: string; enteredBy: ID;
}

interface FieldWork {
  id: ID; date: string; fieldId: ID;
  type: 'weeding' | 'fertilizer' | 'spraying' | 'rain_guarding' | 'other';
  workerIds: ID[]; labourCost: number; materialCost: number; notes?: string;
}

interface Expense {
  id: ID; date: string; category: ExpenseCategory; fieldId?: ID;
  amount: number; paymentMode: 'cash' | 'upi' | 'bank'; description: string;
  receiptUrl?: string; recurring?: 'monthly' | null;
}
type ExpenseCategory = 'wages' | 'fertilizer' | 'chemicals' | 'rain_guards' | 'tools'
  | 'formic_acid' | 'fuel_firewood' | 'transport' | 'repairs' | 'tax' | 'misc';

interface Advance { id: ID; workerId: ID; date: string; amount: number; recoveredAmount: number; }

interface PayPeriod {
  id: ID; workerId: ID; from: string; to: string;
  grossEarnings: number; advanceDeduction: number; bonus: number; netPay: number;
  status: 'draft' | 'approved' | 'paid'; paidOn?: string;
}

interface ProductionBatch {          // latex converted to sheets
  id: ID; date: string; latexLitres: number; drcPct: number;
  sheetsMade: number; sheetWeightKg: number; stage: 'drying' | 'smoking' | 'ready' | 'sold';
}

interface Sale {
  id: ID; date: string; buyer: string;
  product: 'latex' | 'RSS1' | 'RSS4' | 'RSS5' | 'scrap';
  quantityKg: number; ratePerKg: number; amount: number; amountReceived: number;
}

interface MarketPrice { date: string; product: string; ratePerKg: number; } // mocked Rubber Board price
```

Mock data volume (enough for realistic charts):

- 1 estate, 5 fields (one immature), 14 tapping tasks, ~5,200 trees
- 16 workers: 12 tappers (mixed pay models), 3 field workers, 1 supervisor; Malayalam names
- 6 months of daily tapping logs, with rain-off clusters in June–July and a wintering dip in Feb
- DRC varying 30–38% per task; 2 tappers with noticeably lower yield so the dashboard has something to flag
- ~120 expenses across all categories, 30 sales, 12 production batches, 8 advances
- Daily market price series around ₹180–₹210/kg for RSS4

## Screens and features

Ten screens behind a sidebar (desktop) or bottom tab bar (mobile). Every list screen has search, filters, an empty state and a loading skeleton.

### 1. Dashboard (Owner)
- Date range picker: Today, This week, This month, Season, Custom
- KPI cards: latex collected (L), dry rubber (kg), trees tapped, rain-off days, income, expenses, profit, cost per kg vs market price
- Charts: daily dry rubber kg (line, with rain-off days marked); yield by field (bar); income vs expenses by month (grouped bar); expense split by category (donut)
- Tapper leaderboard: kg/day and kg/tree per tapper, lowest performers flagged
- Alerts panel: tasks without an assigned tapper, pending wage approvals, unrecovered advances, DRC drop >3 points vs 14-day average
- Stock on hand (latex, sheets by stage, scrap) and estimated value at today's price

### 2. Today (Supervisor home)
- Date at top, weather chip (mocked), quick "Mark rain-off for all" button
- List of tasks due today per tapping system, each a card: task name, tapper, tree count
- Tap a card → entry sheet: status, trees tapped (prefilled), litres, DRC % (prefilled with last value), scrap kg, notes
- Live total at bottom: litres and dry kg so far today
- Large touch targets; whole day loggable in under a minute

### 3. Fields
- Table/cards of fields: name, area, clone, planting year, tree count, status, yield/acre this month
- Field detail: tasks in the field, assigned tappers, 6-month yield chart, field-work history, expenses tagged to the field
- Add/edit field form

### 4. Tapping tasks
- Table of tasks with field, tree count, tapper, rain-guarded flag, avg kg/day
- Assign or reassign tapper (dropdown); unassigned tasks highlighted
- Task detail: daily log history and yield trend

### 5. Workers
- List with role, pay model, phone, active toggle, earnings this month
- Worker profile: details, assigned tasks, attendance calendar (tapped / rain-off / absent), yield trend, payment history, advances
- Add/edit worker form with pay-model selector that shows the right rate fields

### 6. Tapping log (history)
- Filterable table of all logs: date range, field, task, worker, status
- Inline edit of a row; export CSV (client-side)
- Calendar heatmap view of dry kg per day

### 7. Payments
- Pay-period selector (weekly / fortnightly / monthly)
- Table per worker: days tapped, trees, dry kg, gross, advance deduction, bonus, net, status
- Row expand shows the calculation breakdown line by line
- Actions: approve, mark paid (cash/UPI), record advance
- Payslip view: printable, with "Share on WhatsApp" button (opens wa.me link with text summary)

### 8. Field work
- Log jobs: weeding, fertilizer, spraying, rain-guarding; date, field, workers, labour and material cost
- Upcoming schedule list (e.g. rain-guarding before monsoon, fertilizer rounds)

### 9. Expenses
- Add expense: date, category, field (optional), amount, mode, description, receipt photo (stored as data URL in mock)
- Table with filters by category, field, month; totals row
- Recurring expenses section
- Wage expenses appear automatically from approved pay periods (read-only rows, labelled)

### 10. Production and sales
- Production batches: latex in → sheets out, with stage tracker (drying → smoking → ready → sold)
- Stock summary cards
- Sales: buyer, product, kg, rate, amount, received, balance due
- Market price chart (mocked series) with sale rates plotted against it

### Settings
- Estate details, expense categories, default DRC, pay-period length, language (EN/ML), currency format (₹, Indian digit grouping)

## Calculation rules

All calculations live in `src/lib/calculations.ts` as pure functions with unit tests (Vitest), so the backend can reuse them later.

**Dry rubber:** `dryKg = latexLitres × DRC% / 100`. Assume latex density of 1 kg/L in Phase 1; make it a setting.

**Gross earnings per pay period, by pay model**

| Pay model | Formula | Mock rate |
|---|---|---|
| Per tree | sum(treesTapped) × ratePerTree | ₹1.80 / tree |
| Per kg | sum(dryKg + scrapKg × 0.5) × ratePerKgDry | ₹45 / kg |
| Daily wage | daysTapped × dailyRate + incentive on kg above threshold per day | ₹750 / day; ₹30/kg above 12 kg |
| Share | sum(dryKg) × marketRateOfPeriod × workerSharePct | 40% |

Net pay = gross + bonus − min(outstanding advance, deduction set by owner). Only days with status `tapped` count; `rain_off` pays nothing unless a "rain-off allowance" setting is on (default off).

**Other derived numbers**
- Cost per kg = (expenses + wages in period) ÷ dry kg produced in period
- Yield per tree per tapping = dry kg ÷ trees tapped (shown in grams)
- Profit = sales received + value of unsold stock at market price − expenses (label clearly as "estimated")
- Low-yield flag: tapper's 14-day avg kg/tree < 75% of estate average

## Design guidelines

Calm, earthy and readable outdoors: the supervisor uses it in a plantation at 6 a.m., often with wet hands and bright light.

- Palette: deep rubber-leaf green as primary, latex off-white surfaces, warm amber for warnings, muted red for losses; dark mode supported
- Type: Inter for English, Noto Sans Malayalam for Malayalam; base 16px, numbers in tabular figures
- Mobile first: Today screen designed at 375px; touch targets ≥ 48px; numeric keypad for all number inputs
- Numbers: ₹ with Indian grouping (₹1,24,500); litres to 1 decimal, kg to 1 decimal, DRC to 1 decimal
- Units always visible in labels and table headers (L, kg, %, ₹)
- Feedback: toast on save, optimistic updates, undo for deletes
- Accessibility: WCAG AA contrast, labelled form fields, keyboard navigable on desktop
- Language toggle in header; every string goes through i18n from day one, even if Malayalam translations are placeholders

## Build plan for Claude Code

Build in seven milestones; give Claude Code one milestone per session and check it in the browser before moving on.

1. **Foundation:** Vite + TS + Tailwind + shadcn setup, routing, app shell (sidebar, bottom tabs, header with role and language toggles), i18n scaffold, formatters
2. **Data layer:** all types, seed-data generator (deterministic, seeded random), mock service with 200–400ms latency and localStorage persistence, calculation functions + tests
3. **Fields, tasks, workers:** list, detail and form screens; tapper assignment
4. **Daily tapping:** Today screen (mobile) and Tapping log history
5. **Payments:** pay-period table, breakdown, advances, payslip + WhatsApp share
6. **Expenses, field work, production and sales**
7. **Dashboard:** KPIs, charts, alerts, leaderboard; then a polish pass on empty states, loading and responsiveness

## Acceptance criteria for Phase 1

- [ ] Every screen reachable and populated with mock data; no console errors
- [ ] Supervisor can log a full day for 14 tasks on a 375px screen in under 60 seconds
- [ ] Changing a tapping log updates that worker's pay and the dashboard totals without reload
- [ ] Payment breakdown matches calculation rules for all four pay models (unit tests pass)
- [ ] Data persists across reloads; a "Reset demo data" button in Settings restores the seed
- [ ] English/Malayalam toggle switches all navigation and labels
- [ ] Lighthouse accessibility score ≥ 90

## Starter prompt for Claude Code

> Read PRD.md. Build Milestone 1 only. Use React + TypeScript + Vite, Tailwind and shadcn/ui as specified. Follow the folder structure and the rule that screens only call services/api.ts. Stop when Milestone 1 runs with npm run dev and summarise what you built.

## Out of scope and open questions

Not in Phase 1: real backend and database, authentication, offline sync, tapper self-service login, real Rubber Board price feed, actual WhatsApp/SMS sending, multi-estate support, PDF generation beyond browser print.

Open questions (the mock UI supports all options so these can be answered after demos):

- [ ] How are tappers actually paid at the target estate: per tree, per kg, daily wage or share?
- [ ] Who enters data day to day: owner, supervisor, or tappers?
- [ ] Do they make RSS sheets on site or sell latex directly?
- [ ] Is DRC measured daily per tapper, or once per batch?
- [ ] One estate, or a SaaS for many plantation owners?
- [ ] Pay frequency: weekly, fortnightly or monthly?
