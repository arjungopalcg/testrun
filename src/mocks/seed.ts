// Deterministic seed-data generator (PRD "Mock data volume").
// Everything is generated relative to `today`, so the demo always shows recent data.
import { addDays, addMonths, endOfMonth, format, getDay, getMonth, startOfMonth, subDays, subMonths } from 'date-fns';
import { dryKg, grossEarnings, netPay } from '@/lib/calculations';
import { isTaskDue } from '@/lib/schedule';
import { createRandom } from '@/lib/random';
import type {
  Advance, Database, Expense, ExpenseCategory, Field, FieldWork, MarketPrice, PayModel, PayPeriod,
  ProductionBatch, Sale, TappingLog, TappingTask, Worker,
} from '@/types';

export const DB_VERSION = 1;
const iso = (d: Date) => format(d, 'yyyy-MM-dd');
const r1 = (n: number) => Math.round(n * 10) / 10;

// Seasonal yield multiplier by month (Jan = 0). Feb–Mar wintering dip, peak Oct–Dec.
const SEASON = [0.8, 0.45, 0.55, 0.7, 0.85, 0.9, 0.9, 1.0, 1.1, 1.15, 1.2, 1.1];
// Chance a day starts a rain-off spell, and how likely a spell continues, by month.
const RAIN_START = [0.01, 0.01, 0.03, 0.06, 0.1, 0.3, 0.3, 0.15, 0.12, 0.12, 0.08, 0.03];
const RAIN_STAY = [0.2, 0.2, 0.3, 0.4, 0.5, 0.7, 0.7, 0.55, 0.45, 0.45, 0.4, 0.3];

const TAPPERS: { name: string; pay: PayModel; skill: number }[] = [
  { name: 'Rajan K.', pay: { kind: 'per_tree', ratePerTree: 1.8 }, skill: 1.05 },
  { name: 'Suresh P.', pay: { kind: 'per_kg', ratePerKgDry: 45 }, skill: 1.0 },
  { name: 'Biju Thomas', pay: { kind: 'daily_wage', dailyRate: 750, incentivePerKgAbove: { thresholdKg: 12, rate: 30 } }, skill: 1.08 },
  { name: 'Sasikumar M.', pay: { kind: 'per_tree', ratePerTree: 1.8 }, skill: 0.64 },
  { name: 'Mohanan V.', pay: { kind: 'share', workerSharePct: 40 }, skill: 1.02 },
  { name: 'Babu Joseph', pay: { kind: 'per_kg', ratePerKgDry: 45 }, skill: 0.97 },
  { name: 'Thankamma R.', pay: { kind: 'per_tree', ratePerTree: 1.8 }, skill: 1.0 },
  { name: 'Anil Kumar S.', pay: { kind: 'daily_wage', dailyRate: 750, incentivePerKgAbove: { thresholdKg: 12, rate: 30 } }, skill: 0.95 },
  { name: 'Leela Raghavan', pay: { kind: 'per_kg', ratePerKgDry: 45 }, skill: 1.04 },
  { name: 'Shaji Mathew', pay: { kind: 'per_tree', ratePerTree: 1.8 }, skill: 0.62 },
  { name: 'Omana Kuttan', pay: { kind: 'share', workerSharePct: 40 }, skill: 1.0 },
  { name: 'Saji Varghese', pay: { kind: 'daily_wage', dailyRate: 750, incentivePerKgAbove: { thresholdKg: 12, rate: 30 } }, skill: 0.99 },
];
const FIELD_WORKERS = ['Kunjumon P.', 'Raghavan Nair', 'Sarojini K.'];

export function generateSeed(today = new Date()): Database {
  const rnd = createRandom(20261011);
  const start = startOfMonth(subMonths(today, 6));
  const todayIso = iso(today);

  const estate = { id: 'estate-1', name: 'Meenachil Estate', location: 'Pala, Kottayam', totalAreaAcres: 30, ownerName: 'Arjun Gopal' };

  const fields: Field[] = [
    { id: 'field-a', estateId: estate.id, name: 'Block A', areaAcres: 7, plantingYear: 2008, clone: 'RRII 105', treeCount: 1300, status: 'tapping', tappingSystem: 'S/2 d2' },
    { id: 'field-b', estateId: estate.id, name: 'Block B', areaAcres: 6.5, plantingYear: 2012, clone: 'RRII 430', treeCount: 1200, status: 'tapping', tappingSystem: 'S/2 d2' },
    { id: 'field-c', estateId: estate.id, name: 'Block C', areaAcres: 6, plantingYear: 2015, clone: 'RRII 105', treeCount: 1100, status: 'tapping', tappingSystem: 'S/2 d3' },
    { id: 'field-d', estateId: estate.id, name: 'Block D', areaAcres: 6, plantingYear: 2004, clone: 'RRIM 600', treeCount: 1000, status: 'tapping', tappingSystem: 'S/2 d2' },
    { id: 'field-e', estateId: estate.id, name: 'Block E', areaAcres: 4.5, plantingYear: 2021, clone: 'RRII 430', treeCount: 620, status: 'immature', tappingSystem: 'S/2 d2' },
  ];

  const workers: Worker[] = [
    ...TAPPERS.map((t, i): Worker => ({
      id: `worker-${i + 1}`, name: t.name, phone: `+91 94${String(4710000 + i * 1373).padStart(8, '0')}`,
      role: 'tapper', payModel: t.pay, joinedOn: iso(subDays(today, 400 + i * 97)), active: true,
      ...(i % 2 === 0 ? { upiId: `${t.name.split(' ')[0].toLowerCase()}@okaxis` } : { bankLast4: String(3100 + i * 17) }),
    })),
    ...FIELD_WORKERS.map((name, i): Worker => ({
      id: `worker-${13 + i}`, name, phone: `+91 98${String(4620000 + i * 911).padStart(8, '0')}`,
      role: 'field_worker', payModel: { kind: 'daily_wage', dailyRate: 700 }, joinedOn: iso(subDays(today, 900 + i * 50)), active: true,
    })),
    { id: 'worker-16', name: 'Joy Mathew', phone: '+91 9447123456', role: 'supervisor', payModel: { kind: 'daily_wage', dailyRate: 950 }, joinedOn: iso(subDays(today, 2200)), active: true, upiId: 'joymathew@oksbi' },
  ];

  // 14 tasks: A×4, B×4, C×3, D×3. Tapper 1 covers two tasks, the last task is unassigned.
  const taskPlan: [string, number][] = [['field-a', 4], ['field-b', 4], ['field-c', 3], ['field-d', 3]];
  const tasks: TappingTask[] = [];
  let tapperIdx = 0;
  for (const [fieldId, count] of taskPlan) {
    const field = fields.find((f) => f.id === fieldId)!;
    const base = Math.floor(field.treeCount / count);
    for (let n = 1; n <= count; n++) {
      const idx = tasks.length;
      const worker = idx === 13 ? null : idx === 12 ? workers[0] : workers[tapperIdx++];
      tasks.push({
        id: `task-${idx + 1}`, fieldId, name: `${field.name} - Task ${n}`,
        treeCount: n === count ? field.treeCount - base * (count - 1) : base,
        assignedWorkerId: worker?.id ?? null, rainGuarded: fieldId === 'field-a' || fieldId === 'field-d' || (fieldId === 'field-b' && n <= 2),
      });
    }
  }
  const taskDrc = new Map(tasks.map((t) => [t.id, rnd.between(31, 37)]));
  const skillOf = (workerId: string) => TAPPERS[Number(workerId.split('-')[1]) - 1]?.skill ?? 1;

  // Daily estate weather and market price.
  const days: Date[] = [];
  for (let d = start; d < today; d = addDays(d, 1)) days.push(d);
  const rainy = new Map<string, boolean>();
  let wet = false;
  for (const d of days) {
    const m = getMonth(d);
    wet = wet ? rnd.chance(RAIN_STAY[m]) : rnd.chance(RAIN_START[m]);
    rainy.set(iso(d), wet);
  }
  const marketPrices: MarketPrice[] = [];
  let price = 192;
  for (let d = start; d <= today; d = addDays(d, 1)) {
    price = Math.min(210, Math.max(180, price + rnd.between(-2.2, 2.3)));
    marketPrices.push({ date: iso(d), product: 'RSS4', ratePerKg: r1(price) });
  }

  // Tapping logs.
  const tappingLogs: TappingLog[] = [];
  const holidays = new Set([iso(new Date(today.getFullYear(), 7, 26)), iso(new Date(today.getFullYear(), 7, 27))]); // Onam
  days.forEach((d, dayIdx) => {
    const date = iso(d);
    tasks.forEach((task) => {
      const field = fields.find((f) => f.id === task.fieldId)!;
      if (!isTaskDue(task, field, date)) return;
      const workerId = task.assignedWorkerId ?? 'worker-16';
      const base = { id: `log-${date}-${task.id}`, date, taskId: task.id, workerId, enteredBy: 'worker-16' };
      const empty = { treesTapped: 0, latexLitres: 0, drcPct: 0, scrapKg: 0 };
      if (task.assignedWorkerId === null) return;
      if (holidays.has(date)) return tappingLogs.push({ ...base, ...empty, status: 'holiday', notes: 'Onam' });
      if (rainy.get(date) && !(task.rainGuarded && rnd.chance(0.75))) return tappingLogs.push({ ...base, ...empty, status: 'rain_off' });
      if (rnd.chance(0.03) || getDay(d) === 0 && rnd.chance(0.1)) return tappingLogs.push({ ...base, ...empty, status: 'absent' });
      const trees = task.treeCount - rnd.int(0, 12);
      const season = SEASON[getMonth(d)];
      const monsoonDrcDrop = [5, 6].includes(getMonth(d)) ? 2 : 0;
      // A visible DRC drop on task 6 over the last 5 days, for the dashboard alert.
      const recentDrop = task.id === 'task-6' && dayIdx > days.length - 6 ? 4.5 : 0;
      const drcPct = r1(taskDrc.get(task.id)! - monsoonDrcDrop - recentDrop + rnd.between(-0.8, 0.8));
      const litres = r1(trees * 0.15 * season * skillOf(workerId) * rnd.between(0.9, 1.1) * (rainy.get(date) ? 0.85 : 1));
      tappingLogs.push({ ...base, status: 'tapped', treesTapped: trees, latexLitres: litres, drcPct, scrapKg: r1(trees * 0.0022 * rnd.between(0.7, 1.3)) });
    });
  });

  // Advances: 8, some partly recovered.
  const advances: Advance[] = [0, 2, 3, 5, 6, 8, 9, 11].map((w, i) => {
    const amount = [5000, 3000, 8000, 2000, 4000, 6000, 10000, 2500][i];
    return {
      id: `adv-${i + 1}`, workerId: workers[w].id, date: iso(subDays(today, 20 + i * 17)),
      amount, recoveredAmount: i % 3 === 0 ? amount : i % 3 === 1 ? Math.round(amount / 2) : 0,
    };
  });

  // Pay periods: monthly; completed months paid, last month approved, current month left as draft.
  const avgRate = (from: string, to: string) => {
    const p = marketPrices.filter((m) => m.date >= from && m.date <= to);
    return p.reduce((s, m) => s + m.ratePerKg, 0) / Math.max(1, p.length);
  };
  const payPeriods: PayPeriod[] = [];
  for (let m = 6; m >= 1; m--) {
    const from = iso(startOfMonth(subMonths(today, m)));
    const to = iso(endOfMonth(subMonths(today, m)));
    workers.filter((w) => w.role === 'tapper').forEach((w) => {
      const logs = tappingLogs.filter((l) => l.workerId === w.id && l.date >= from && l.date <= to);
      const { gross } = grossEarnings(w.payModel, logs, { marketRate: avgRate(from, to) });
      const bonus = m === 2 && getMonth(subMonths(today, 2)) === 7 ? 1500 : 0; // Onam bonus
      const deduction = m <= 2 && advances.some((a) => a.workerId === w.id) ? 1000 : 0;
      const { advanceDeduction, net } = netPay(gross, bonus, deduction, deduction);
      payPeriods.push({
        id: `pay-${w.id}-${from}`, workerId: w.id, from, to, grossEarnings: gross, advanceDeduction, bonus, netPay: net,
        status: m === 1 ? 'approved' : 'paid', ...(m === 1 ? {} : { paidOn: iso(addDays(endOfMonth(subMonths(today, m)), 3)) }),
      });
    });
  }

  // Expenses: ~120 across non-wage categories (wages come from pay periods).
  const expenseTemplates: [ExpenseCategory, string, number, number, boolean][] = [
    ['fertilizer', 'NPK 10:10:10 fertilizer', 6000, 18000, true],
    ['chemicals', 'Copper oxychloride for leaf fall', 3000, 9000, true],
    ['rain_guards', 'Polythene rain guards', 4000, 12000, true],
    ['tools', 'Tapping knives and cups', 400, 2500, false],
    ['formic_acid', 'Formic acid 35 L can', 1800, 3200, false],
    ['fuel_firewood', 'Firewood for smoke house', 2000, 5000, false],
    ['transport', 'Pickup to dealer', 600, 1800, false],
    ['repairs', 'Roller machine repair', 800, 6000, false],
    ['misc', 'Tea and snacks for workers', 300, 900, false],
  ];
  const expenses: Expense[] = [];
  for (let i = 0; i < 112; i++) {
    const [category, description, min, max, fielded] = rnd.pick(expenseTemplates);
    const date = rnd.pick(days);
    expenses.push({
      id: `exp-${i + 1}`, date: iso(date), category, description,
      fieldId: fielded ? rnd.pick(fields.slice(0, 4)).id : undefined,
      amount: Math.round(rnd.between(min, max) / 10) * 10,
      paymentMode: rnd.pick(['cash', 'upi', 'bank'] as const), recurring: null,
    });
  }
  for (let m = 0; m <= 6; m++) {
    const d = addDays(startOfMonth(addMonths(start, m)), 4);
    if (d >= today) break;
    expenses.push({ id: `exp-elec-${m}`, date: iso(d), category: 'misc', description: 'Electricity (smoke house and store)', amount: 1450, paymentMode: 'upi', recurring: 'monthly' });
  }
  const taxDate = addDays(start, 40);
  expenses.push({ id: 'exp-tax-1', date: iso(taxDate), category: 'tax', description: 'Land tax (half-yearly)', amount: 4200, paymentMode: 'bank', recurring: null });
  expenses.sort((a, b) => b.date.localeCompare(a.date));

  // Field work: past jobs and upcoming schedule.
  const fwTypes = ['weeding', 'fertilizer', 'spraying', 'rain_guarding', 'other'] as const;
  const fieldWork: FieldWork[] = [];
  for (let i = 0; i < 24; i++) {
    const type = i < 4 ? 'rain_guarding' : rnd.pick(fwTypes);
    const date = i < 4 ? iso(addDays(startOfMonth(subMonths(today, 5)), 10 + i * 3)) : iso(rnd.pick(days));
    const crew = workers.filter((w) => w.role === 'field_worker').filter(() => rnd.chance(0.7));
    const ids = crew.length ? crew.map((w) => w.id) : ['worker-13'];
    fieldWork.push({
      id: `fw-${i + 1}`, date, fieldId: rnd.pick(fields).id, type, workerIds: ids,
      labourCost: ids.length * 700 * rnd.int(1, 3), materialCost: type === 'weeding' ? 0 : Math.round(rnd.between(1000, 9000) / 10) * 10,
      notes: type === 'rain_guarding' ? 'Before monsoon' : undefined,
    });
  }
  const upcoming: [number, FieldWork['type'], string, string][] = [
    [6, 'fertilizer', 'field-a', 'Second fertilizer round'],
    [9, 'weeding', 'field-e', 'Circle weeding around young plants'],
    [15, 'fertilizer', 'field-b', 'Second fertilizer round'],
    [24, 'spraying', 'field-c', 'Pink disease check and spray'],
  ];
  upcoming.forEach(([inDays, type, fieldId, notes], i) => fieldWork.push({
    id: `fw-up-${i + 1}`, date: iso(addDays(today, inDays)), fieldId, type, workerIds: ['worker-13', 'worker-14'], labourCost: 1400, materialCost: 0, notes,
  }));
  fieldWork.sort((a, b) => b.date.localeCompare(a.date));

  // Production batches: 12, latest still in process.
  const batches: ProductionBatch[] = Array.from({ length: 12 }, (_, i) => {
    const date = subDays(today, 4 + i * 14);
    const latexLitres = Math.round(rnd.between(380, 620));
    const drcPct = r1(rnd.between(32, 36));
    const sheetWeightKg = r1(dryKg(latexLitres, drcPct) * 0.97);
    return {
      id: `batch-${12 - i}`, date: iso(date), latexLitres, drcPct, sheetsMade: Math.round(sheetWeightKg / 0.75), sheetWeightKg,
      stage: i === 0 ? 'drying' : i === 1 ? 'smoking' : i === 2 ? 'ready' : 'sold',
    };
  });

  // Sales: 30 across products, a few with balance due.
  const buyers = ['Pala Rubber Traders', 'St. Thomas Rubber Mart', 'Kottayam Latex Co.', 'Meenachil Rubber Society'];
  const offset: Record<Sale['product'], number> = { RSS1: 8, RSS4: 0, RSS5: -6, latex: -55, scrap: -70 };
  const sales: Sale[] = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 3 + i * 6);
    const product = rnd.pick(['RSS4', 'RSS4', 'RSS4', 'RSS5', 'RSS1', 'scrap', 'latex'] as const);
    const market = marketPrices.find((p) => p.date === iso(date))?.ratePerKg ?? 195;
    const ratePerKg = r1(market + offset[product] + rnd.between(-3, 3));
    const quantityKg = Math.round(product === 'scrap' ? rnd.between(60, 180) : rnd.between(120, 420));
    const amount = Math.round(quantityKg * ratePerKg);
    return {
      id: `sale-${30 - i}`, date: iso(date), buyer: rnd.pick(buyers), product, quantityKg, ratePerKg, amount,
      amountReceived: i < 3 && i !== 1 ? Math.round(amount * 0.6) : amount,
    };
  });

  return {
    version: DB_VERSION, seededOn: todayIso, estate, fields, tasks, workers, tappingLogs, fieldWork, expenses,
    advances, payPeriods, batches, sales, marketPrices,
    settings: { latexDensity: 1, defaultDrcPct: 34, payPeriod: 'monthly', rainOffAllowance: 0, defaultAdvanceDeduction: 2000 },
  };
}
