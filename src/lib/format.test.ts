import { formatINR, formatKg, formatLitres, formatPct, formatNumber, formatDay } from './format';

describe('formatters', () => {
  it('uses Indian digit grouping for rupees', () => {
    expect(formatINR(124500)).toBe('₹1,24,500');
    expect(formatINR(12345678)).toBe('₹1,23,45,678');
  });
  it('formats litres, kg and DRC to one decimal with units', () => {
    expect(formatLitres(1234.56)).toBe('1,234.6 L');
    expect(formatKg(12)).toBe('12.0 kg');
    expect(formatPct(34.25)).toBe('34.3%');
  });
  it('formats integers and dates', () => {
    expect(formatNumber(5200)).toBe('5,200');
    expect(formatDay('2026-10-11')).toBe('11 Oct 2026');
  });
});
