import { generateSeed } from './seed';

describe('generateSeed', () => {
  const today = new Date(2026, 9, 11);
  const db = generateSeed(today);

  it('is deterministic', () => {
    expect(generateSeed(today)).toEqual(db);
  });
  it('matches the PRD volumes', () => {
    expect(db.fields).toHaveLength(5);
    expect(db.fields.filter((f) => f.status === 'immature')).toHaveLength(1);
    expect(db.tasks).toHaveLength(14);
    expect(db.workers.filter((w) => w.role === 'tapper')).toHaveLength(12);
    expect(db.workers).toHaveLength(16);
    expect(db.fields.reduce((s, f) => s + f.treeCount, 0)).toBeGreaterThan(5000);
    expect(db.expenses.length).toBeGreaterThanOrEqual(115);
    expect(db.sales).toHaveLength(30);
    expect(db.batches).toHaveLength(12);
    expect(db.advances).toHaveLength(8);
    expect(db.tasks.filter((t) => !t.assignedWorkerId)).toHaveLength(1);
  });
  it('has monsoon rain-off days and DRC in range', () => {
    const rainOff = db.tappingLogs.filter((l) => l.status === 'rain_off' && /-0[67]-/.test(l.date));
    expect(rainOff.length).toBeGreaterThan(20);
    const tapped = db.tappingLogs.filter((l) => l.status === 'tapped');
    expect(Math.min(...tapped.map((l) => l.drcPct))).toBeGreaterThan(24);
    expect(Math.max(...tapped.map((l) => l.drcPct))).toBeLessThan(39);
    expect(db.marketPrices.every((p) => p.ratePerKg >= 180 && p.ratePerKg <= 210)).toBe(true);
  });
});
