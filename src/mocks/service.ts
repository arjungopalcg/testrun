// Mock implementation of the API. Only services/api.ts imports this module.
import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth, subDays, subMonths } from 'date-fns';
import { costPerKg, estimatedProfit, grossEarnings, isLowYield, logDryKg, netPay, type EarningsResult } from '@/lib/calculations';
import type {
  Advance, Expense, ExpenseCategory, ID, PayPeriod, PayStatus, Settings, TappingLog, TappingStatus, Worker,
} from '@/types';
import { getDb, reset, save } from './db';

const delay = <T,>(fn: () => T): Promise<T> =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(structuredClone(fn()));
      } catch (e) {
        reject(e);
      }
    }, 200 + Math.random() * 200),
  );
const iso = (d: Date) => format(d, 'yyyy-MM-dd');
const inRange = (date: string, from: string, to: string) => date >= from && date <= to;
let seq = Date.now();
const newId = (prefix: string) => `${prefix}-${(seq++).toString(36)}`;

// ---- Estate, fields, tasks, workers ----

export const getEstate = () => delay(() => getDb().estate);
export const getSettings = () => delay(() => getDb().settings);
export const updateSettings = (patch: Partial<Settings>) =>
  delay(() => {
    const db = getDb();
    db.settings = { ...db.settings, ...patch };
    save();
    return db.settings;
  });
export const resetDemoData = () => delay(() => { reset(); return true; });

export const getFields = () => delay(() => getDb().fields);
export const getTasks = () => delay(() => getDb().tasks);
export const getWorkers = () => delay(() => getDb().workers);

export const assignTapper = (taskId: ID, workerId: ID | null) =>
  delay(() => {
    const task = getDb().tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    task.assignedWorkerId = workerId;
    save();
    return task;
  });

export const setWorkerActive = (workerId: ID, active: boolean) =>
  delay(() => {
    const w = getDb().workers.find((x) => x.id === workerId);
    if (!w) throw new Error('Worker not found');
    w.active = active;
    save();
    return w;
  });

// ---- Tapping logs ----

export interface LogFilter { from?: string; to?: string; fieldId?: ID; taskId?: ID; workerId?: ID; status?: TappingStatus; }

export const getTappingLogs = (filter: LogFilter = {}) =>
  delay(() => {
    const db = getDb();
    const fieldTasks = filter.fieldId ? new Set(db.tasks.filter((t) => t.fieldId === filter.fieldId).map((t) => t.id)) : null;
    return db.tappingLogs
      .filter((l) =>
        (!filter.from || l.date >= filter.from) && (!filter.to || l.date <= filter.to) &&
        (!fieldTasks || fieldTasks.has(l.taskId)) && (!filter.taskId || l.taskId === filter.taskId) &&
        (!filter.workerId || l.workerId === filter.workerId) && (!filter.status || l.status === filter.status))
      .sort((a, b) => b.date.localeCompare(a.date) || a.taskId.localeCompare(b.taskId, undefined, { numeric: true }));
  });

export const saveTappingLog = (log: Omit<TappingLog, 'id'> & { id?: ID }) =>
  delay(() => {
    const db = getDb();
    const existing = db.tappingLogs.findIndex((l) => (log.id ? l.id === log.id : l.date === log.date && l.taskId === log.taskId));
    const saved: TappingLog = { ...log, id: log.id ?? (existing >= 0 ? db.tappingLogs[existing].id : newId('log')) };
    if (existing >= 0) db.tappingLogs[existing] = saved;
    else db.tappingLogs.push(saved);
    save();
    return saved;
  });

// ---- Field work, expenses ----

export const getFieldWork = () => delay(() => getDb().fieldWork);

export type ExpenseRow = Expense & { fromPayroll?: boolean };

/** Expenses plus read-only wage rows generated from approved and paid pay periods. */
export const getExpenses = () =>
  delay((): ExpenseRow[] => {
    const db = getDb();
    const wages: ExpenseRow[] = db.payPeriods
      .filter((p) => p.status !== 'draft')
      .map((p) => ({
        id: `wage-${p.id}`, date: p.paidOn ?? p.to, category: 'wages', amount: p.netPay, paymentMode: 'cash',
        description: `Wages: ${db.workers.find((w) => w.id === p.workerId)?.name ?? ''} (${p.from} to ${p.to})`, fromPayroll: true,
      }));
    return [...db.expenses, ...wages].sort((a, b) => b.date.localeCompare(a.date));
  });

export const addExpense = (expense: Omit<Expense, 'id'>) =>
  delay(() => {
    const saved = { ...expense, id: newId('exp') };
    getDb().expenses.push(saved);
    save();
    return saved;
  });

// ---- Production, sales, prices ----

export const getBatches = () => delay(() => getDb().batches);
export const getSales = () => delay(() => getDb().sales);
export const getMarketPrices = () => delay(() => getDb().marketPrices);

// ---- Payments ----

export interface PayrollRow {
  worker: Worker;
  earnings: EarningsResult;
  bonus: number;
  outstandingAdvance: number;
  advanceDeduction: number;
  net: number;
  status: PayStatus;
  paidOn?: string;
}

function avgMarketRate(from: string, to: string) {
  const p = getDb().marketPrices.filter((m) => inRange(m.date, from, to));
  return p.length ? p.reduce((s, m) => s + m.ratePerKg, 0) / p.length : 0;
}
const outstanding = (advances: Advance[], workerId: ID) =>
  advances.filter((a) => a.workerId === workerId).reduce((s, a) => s + a.amount - a.recoveredAmount, 0);

export const getPayroll = (from: string, to: string) =>
  delay((): PayrollRow[] => {
    const db = getDb();
    const marketRate = avgMarketRate(from, to);
    return db.workers.filter((w) => w.role === 'tapper').map((worker) => {
      const logs = db.tappingLogs.filter((l) => l.workerId === worker.id && inRange(l.date, from, to));
      const earnings = grossEarnings(worker.payModel, logs, { density: db.settings.latexDensity, marketRate, rainOffAllowance: db.settings.rainOffAllowance });
      const period = db.payPeriods.find((p) => p.workerId === worker.id && p.from === from && p.to === to);
      const owed = outstanding(db.advances, worker.id);
      if (period && period.status !== 'draft') {
        return { worker, earnings, bonus: period.bonus, outstandingAdvance: owed, advanceDeduction: period.advanceDeduction, net: period.netPay, status: period.status, paidOn: period.paidOn };
      }
      const bonus = period?.bonus ?? 0;
      const { advanceDeduction, net } = netPay(earnings.gross, bonus, owed, period?.advanceDeduction ?? db.settings.defaultAdvanceDeduction);
      return { worker, earnings, bonus, outstandingAdvance: owed, advanceDeduction, net, status: 'draft' };
    });
  });

export const setPayStatus = (workerId: ID, from: string, to: string, status: PayStatus, row: Pick<PayrollRow, 'bonus' | 'advanceDeduction' | 'net'> & { gross: number }) =>
  delay(() => {
    const db = getDb();
    let period = db.payPeriods.find((p) => p.workerId === workerId && p.from === from && p.to === to);
    if (!period) {
      period = { id: newId('pay'), workerId, from, to, grossEarnings: row.gross, advanceDeduction: row.advanceDeduction, bonus: row.bonus, netPay: row.net, status };
      db.payPeriods.push(period);
    }
    Object.assign(period, { grossEarnings: row.gross, advanceDeduction: row.advanceDeduction, bonus: row.bonus, netPay: row.net, status } satisfies Partial<PayPeriod>);
    if (status === 'paid') {
      period.paidOn = iso(new Date());
      // Recover the deducted amount from the oldest advances first.
      let left = row.advanceDeduction;
      for (const a of db.advances.filter((x) => x.workerId === workerId).sort((x, y) => x.date.localeCompare(y.date))) {
        const take = Math.min(left, a.amount - a.recoveredAmount);
        a.recoveredAmount += take;
        left -= take;
      }
    }
    save();
    return period;
  });

export const getAdvances = () => delay(() => getDb().advances);

export const recordAdvance = (workerId: ID, amount: number) =>
  delay(() => {
    const adv: Advance = { id: newId('adv'), workerId, date: iso(new Date()), amount, recoveredAmount: 0 };
    getDb().advances.push(adv);
    save();
    return adv;
  });

// ---- Dashboard ----

export interface DashboardSummary {
  latexLitres: number; dryKg: number; treesTapped: number; rainOffDays: number;
  income: number; expenses: number; wages: number; profit: number; costPerKg: number; marketRate: number;
  daily: { date: string; dryKg: number; rainOff: boolean }[];
  byField: { name: string; kgPerAcre: number; kg: number }[];
  monthly: { month: string; income: number; expenses: number }[];
  byCategory: { category: ExpenseCategory; amount: number }[];
  leaderboard: { worker: Worker; kgPerDay: number; gramsPerTree: number; days: number; low: boolean }[];
  alerts: { kind: 'unassigned' | 'pendingWages' | 'advances' | 'drcDrop'; count: number; detail: string }[];
  stock: { latexLitres: number; sheets: Record<'drying' | 'smoking' | 'ready', number>; scrapKg: number; value: number };
}

export const getDashboard = (from: string, to: string) =>
  delay((): DashboardSummary => {
    const db = getDb();
    const density = db.settings.latexDensity;
    const today = iso(new Date());
    const logs = db.tappingLogs.filter((l) => inRange(l.date, from, to));
    const tapped = logs.filter((l) => l.status === 'tapped');
    const kgOf = (ls: TappingLog[]) => ls.reduce((s, l) => s + (l.status === 'tapped' ? logDryKg(l, density) : 0), 0);
    const kg = kgOf(tapped);
    const wagesIn = (f: string, t: string) => db.payPeriods.filter((p) => p.status !== 'draft' && inRange(p.to, f, t)).reduce((s, p) => s + p.netPay, 0);
    const expensesIn = (f: string, t: string) => db.expenses.filter((e) => inRange(e.date, f, t)).reduce((s, e) => s + e.amount, 0);
    const incomeIn = (f: string, t: string) => db.sales.filter((s) => inRange(s.date, f, t)).reduce((s, x) => s + x.amountReceived, 0);
    const expenses = expensesIn(from, to);
    const wages = wagesIn(from, to);
    const income = incomeIn(from, to);
    const marketRate = db.marketPrices.find((p) => p.date === today)?.ratePerKg ?? db.marketPrices.at(-1)?.ratePerKg ?? 0;

    // Stock on hand
    const sheets = { drying: 0, smoking: 0, ready: 0 };
    db.batches.forEach((b) => { if (b.stage !== 'sold') sheets[b.stage] += b.sheetWeightKg; });
    const since30 = iso(subDays(new Date(), 30));
    const scrapIn = db.tappingLogs.filter((l) => l.date >= since30).reduce((s, l) => s + l.scrapKg, 0);
    const scrapOut = db.sales.filter((s) => s.product === 'scrap' && s.date >= since30).reduce((s, x) => s + x.quantityKg, 0);
    const scrapKg = Math.max(0, scrapIn - scrapOut);
    const latexLitres = db.tappingLogs.filter((l) => l.date === today).reduce((s, l) => s + l.latexLitres, 0);
    const stockValue = (sheets.drying + sheets.smoking + sheets.ready) * marketRate + scrapKg * (marketRate - 70) + latexLitres * 0.34 * (marketRate - 55);

    // Daily series
    const byDate = new Map<string, { kg: number; rainOff: number; total: number }>();
    logs.forEach((l) => {
      const d = byDate.get(l.date) ?? { kg: 0, rainOff: 0, total: 0 };
      d.total++;
      if (l.status === 'rain_off') d.rainOff++;
      if (l.status === 'tapped') d.kg += logDryKg(l, density);
      byDate.set(l.date, d);
    });
    const daily = eachDayOfInterval({ start: parseISO(from), end: parseISO(to < today ? to : today) }).map((d) => {
      const v = byDate.get(iso(d));
      return { date: iso(d), dryKg: Math.round((v?.kg ?? 0) * 10) / 10, rainOff: !!v && v.rainOff > v.total / 2 };
    });

    const byField = db.fields.filter((f) => f.status === 'tapping').map((f) => {
      const ids = new Set(db.tasks.filter((t) => t.fieldId === f.id).map((t) => t.id));
      const fkg = kgOf(tapped.filter((l) => ids.has(l.taskId)));
      return { name: f.name, kg: fkg, kgPerAcre: fkg / f.areaAcres };
    });

    const monthly = Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(new Date(), 5 - i);
      const f = iso(startOfMonth(m)), t = iso(endOfMonth(m));
      return { month: format(m, 'MMM'), income: incomeIn(f, t), expenses: expensesIn(f, t) + wagesIn(f, t) };
    });

    const cat = new Map<ExpenseCategory, number>();
    db.expenses.filter((e) => inRange(e.date, from, to)).forEach((e) => cat.set(e.category, (cat.get(e.category) ?? 0) + e.amount));
    if (wages) cat.set('wages', wages);
    const byCategory = [...cat].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);

    // Leaderboard over the range; low-yield flag over the last 14 days.
    const since14 = iso(subDays(new Date(), 14));
    const recent = db.tappingLogs.filter((l) => l.date >= since14 && l.status === 'tapped');
    const kgPerTree = (ls: TappingLog[]) => { const t = ls.reduce((s, l) => s + l.treesTapped, 0); return t ? kgOf(ls) / t : 0; };
    const estateKpt = kgPerTree(recent);
    const leaderboard = db.workers.filter((w) => w.role === 'tapper').map((worker) => {
      const mine = tapped.filter((l) => l.workerId === worker.id);
      const days = new Set(mine.map((l) => l.date)).size;
      const trees = mine.reduce((s, l) => s + l.treesTapped, 0);
      const wkg = kgOf(mine);
      return { worker, days, kgPerDay: days ? wkg / days : 0, gramsPerTree: trees ? (wkg / trees) * 1000 : 0, low: isLowYield(kgPerTree(recent.filter((l) => l.workerId === worker.id)), estateKpt) };
    }).sort((a, b) => b.gramsPerTree - a.gramsPerTree);

    // Alerts
    const unassigned = db.tasks.filter((t) => !t.assignedWorkerId);
    const pending = db.payPeriods.filter((p) => p.status === 'approved');
    const openAdv = db.advances.filter((a) => a.amount > a.recoveredAmount);
    const drcDrops = db.tasks.filter((t) => {
      const tl = db.tappingLogs.filter((l) => l.taskId === t.id && l.status === 'tapped' && l.date >= since14).sort((a, b) => a.date.localeCompare(b.date));
      if (tl.length < 4) return false;
      const avg = tl.reduce((s, l) => s + l.drcPct, 0) / tl.length;
      return avg - tl[tl.length - 1].drcPct > 3;
    });
    const alerts: DashboardSummary['alerts'] = [
      { kind: 'unassigned', count: unassigned.length, detail: unassigned.map((t) => t.name).join(', ') },
      { kind: 'pendingWages', count: pending.length, detail: '' },
      { kind: 'advances', count: openAdv.length, detail: String(openAdv.reduce((s, a) => s + a.amount - a.recoveredAmount, 0)) },
      { kind: 'drcDrop', count: drcDrops.length, detail: drcDrops.map((t) => t.name).join(', ') },
    ];

    return {
      latexLitres: tapped.reduce((s, l) => s + l.latexLitres, 0), dryKg: kg, treesTapped: tapped.reduce((s, l) => s + l.treesTapped, 0),
      rainOffDays: daily.filter((d) => d.rainOff).length, income, expenses: expenses + wages, wages,
      profit: estimatedProfit(income, stockValue, expenses + wages), costPerKg: costPerKg(expenses, wages, kg), marketRate,
      daily, byField, monthly, byCategory, leaderboard, alerts,
      stock: { latexLitres, sheets, scrapKg, value: stockValue },
    };
  });
