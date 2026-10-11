// Pure calculation rules from the PRD. No I/O, so a backend can reuse them as-is.
import type { PayModel, TappingLog } from '@/types';

export const SCRAP_WEIGHT_FACTOR = 0.5;

/** dryKg = litres × density × DRC% / 100 */
export function dryKg(latexLitres: number, drcPct: number, density = 1): number {
  return (latexLitres * density * drcPct) / 100;
}

export const logDryKg = (log: Pick<TappingLog, 'latexLitres' | 'drcPct'>, density = 1) =>
  dryKg(log.latexLitres, log.drcPct, density);

export interface BreakdownLine { label: string; detail: string; amount: number; }

export interface EarningsResult {
  daysTapped: number;
  rainOffDays: number;
  trees: number;
  dryKg: number;
  scrapKg: number;
  gross: number;
  lines: BreakdownLine[];
}

export interface EarningsOptions {
  density?: number;
  /** Average market rate (₹/kg) for the period; used by the share model. */
  marketRate?: number;
  /** ₹ paid per rain-off day; 0 means the allowance is off (PRD default). */
  rainOffAllowance?: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Gross earnings for one worker over a pay period. Only `tapped` days earn. */
export function grossEarnings(payModel: PayModel, logs: TappingLog[], opts: EarningsOptions = {}): EarningsResult {
  const density = opts.density ?? 1;
  const tapped = logs.filter((l) => l.status === 'tapped');
  const rainOffDays = new Set(logs.filter((l) => l.status === 'rain_off').map((l) => l.date)).size;
  const days = new Set(tapped.map((l) => l.date)).size;
  const trees = tapped.reduce((s, l) => s + l.treesTapped, 0);
  const kg = tapped.reduce((s, l) => s + logDryKg(l, density), 0);
  const scrap = tapped.reduce((s, l) => s + l.scrapKg, 0);
  const lines: BreakdownLine[] = [];

  switch (payModel.kind) {
    case 'per_tree':
      lines.push({ label: 'trees', detail: `${trees} × ₹${payModel.ratePerTree}`, amount: trees * payModel.ratePerTree });
      break;
    case 'per_kg': {
      const paidKg = kg + scrap * SCRAP_WEIGHT_FACTOR;
      lines.push({
        label: 'dryRubber',
        detail: `(${r2(kg)} + ${r2(scrap)} × ${SCRAP_WEIGHT_FACTOR}) kg × ₹${payModel.ratePerKgDry}`,
        amount: paidKg * payModel.ratePerKgDry,
      });
      break;
    }
    case 'daily_wage': {
      lines.push({ label: 'days', detail: `${days} × ₹${payModel.dailyRate}`, amount: days * payModel.dailyRate });
      const inc = payModel.incentivePerKgAbove;
      if (inc) {
        const byDay = new Map<string, number>();
        tapped.forEach((l) => byDay.set(l.date, (byDay.get(l.date) ?? 0) + logDryKg(l, density)));
        const extraKg = [...byDay.values()].reduce((s, k) => s + Math.max(0, k - inc.thresholdKg), 0);
        lines.push({ label: 'incentive', detail: `${r2(extraKg)} kg above ${inc.thresholdKg} kg/day × ₹${inc.rate}`, amount: extraKg * inc.rate });
      }
      break;
    }
    case 'share': {
      const rate = opts.marketRate ?? 0;
      lines.push({
        label: 'share',
        detail: `${r2(kg)} kg × ₹${r2(rate)} × ${payModel.workerSharePct}%`,
        amount: (kg * rate * payModel.workerSharePct) / 100,
      });
      break;
    }
  }

  if (opts.rainOffAllowance && rainOffDays > 0) {
    lines.push({ label: 'rainOff', detail: `${rainOffDays} × ₹${opts.rainOffAllowance}`, amount: rainOffDays * opts.rainOffAllowance });
  }

  const gross = Math.round(lines.reduce((s, l) => s + l.amount, 0));
  return { daysTapped: days, rainOffDays, trees, dryKg: kg, scrapKg: scrap, gross, lines };
}

/** Net pay = gross + bonus − min(outstanding advance, deduction set by owner). */
export function netPay(gross: number, bonus: number, outstandingAdvance: number, deduction: number) {
  const advanceDeduction = Math.max(0, Math.min(outstandingAdvance, deduction));
  return { advanceDeduction, net: gross + bonus - advanceDeduction };
}

/** Cost per kg = (expenses + wages) ÷ dry kg produced. */
export const costPerKg = (expenses: number, wages: number, kg: number) => (kg > 0 ? (expenses + wages) / kg : 0);

/** Yield per tree per tapping, in grams. */
export const yieldPerTreeGrams = (kg: number, trees: number) => (trees > 0 ? (kg / trees) * 1000 : 0);

/** Estimated profit = sales received + unsold stock value − expenses. */
export const estimatedProfit = (salesReceived: number, stockValue: number, expenses: number) =>
  salesReceived + stockValue - expenses;

/** Low-yield flag: tapper's 14-day avg kg/tree < 75% of estate average. */
export const isLowYield = (tapperKgPerTree: number, estateKgPerTree: number) =>
  estateKgPerTree > 0 && tapperKgPerTree < 0.75 * estateKgPerTree;
