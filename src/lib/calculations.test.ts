import type { TappingLog } from '@/types';
import { costPerKg, dryKg, estimatedProfit, grossEarnings, isLowYield, netPay, yieldPerTreeGrams } from './calculations';

const log = (date: string, over: Partial<TappingLog> = {}): TappingLog => ({
  id: date, date, taskId: 't', workerId: 'w', status: 'tapped',
  treesTapped: 400, latexLitres: 50, drcPct: 34, scrapKg: 2, enteredBy: 's', ...over,
});

// Two tapped days (17 kg dry each), one rain-off day.
const logs = [log('2026-10-01'), log('2026-10-03'), log('2026-10-05', { status: 'rain_off', treesTapped: 0, latexLitres: 0, scrapKg: 0 })];

describe('dryKg', () => {
  it('applies DRC and density', () => {
    expect(dryKg(50, 34)).toBeCloseTo(17);
    expect(dryKg(50, 34, 1.02)).toBeCloseTo(17.34);
  });
});

describe('grossEarnings', () => {
  it('per tree: trees × rate', () => {
    expect(grossEarnings({ kind: 'per_tree', ratePerTree: 1.8 }, logs).gross).toBe(1440);
  });
  it('per kg: (dry + scrap × 0.5) × rate', () => {
    // (34 + 4 × 0.5) × 45 = 1620
    expect(grossEarnings({ kind: 'per_kg', ratePerKgDry: 45 }, logs).gross).toBe(1620);
  });
  it('daily wage: days × rate + incentive above threshold per day', () => {
    const r = grossEarnings({ kind: 'daily_wage', dailyRate: 750, incentivePerKgAbove: { thresholdKg: 12, rate: 30 } }, logs);
    // 2 × 750 + (5 + 5) × 30 = 1800
    expect(r.gross).toBe(1800);
    expect(r.daysTapped).toBe(2);
  });
  it('share: dry kg × market rate × share %', () => {
    // 34 × 200 × 40% = 2720
    expect(grossEarnings({ kind: 'share', workerSharePct: 40 }, logs, { marketRate: 200 }).gross).toBe(2720);
  });
  it('pays nothing for rain-off unless the allowance is on', () => {
    expect(grossEarnings({ kind: 'per_tree', ratePerTree: 1.8 }, logs).rainOffDays).toBe(1);
    expect(grossEarnings({ kind: 'per_tree', ratePerTree: 1.8 }, logs, { rainOffAllowance: 200 }).gross).toBe(1640);
  });
  it('ignores absent days', () => {
    const r = grossEarnings({ kind: 'per_tree', ratePerTree: 2 }, [log('2026-10-07', { status: 'absent' })]);
    expect(r.gross).toBe(0);
  });
});

describe('netPay', () => {
  it('deducts the smaller of outstanding advance and owner deduction', () => {
    expect(netPay(10000, 500, 1500, 2000)).toEqual({ advanceDeduction: 1500, net: 9000 });
    expect(netPay(10000, 0, 5000, 2000)).toEqual({ advanceDeduction: 2000, net: 8000 });
  });
});

describe('derived numbers', () => {
  it('cost per kg, yield per tree, profit, low-yield flag', () => {
    expect(costPerKg(8000, 2000, 100)).toBe(100);
    expect(costPerKg(1, 1, 0)).toBe(0);
    expect(yieldPerTreeGrams(17, 400)).toBeCloseTo(42.5);
    expect(estimatedProfit(100000, 20000, 70000)).toBe(50000);
    expect(isLowYield(0.03, 0.045)).toBe(true);
    expect(isLowYield(0.04, 0.045)).toBe(false);
  });
});
