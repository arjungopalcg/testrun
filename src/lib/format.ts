import { format as formatDate, parseISO } from 'date-fns';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const oneDecimal = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹1,24,500 — Indian digit grouping, whole rupees. */
export const formatINR = (amount: number) => inr.format(amount);
/** ₹1.80 — for per-unit rates. */
export const formatRate = (amount: number) => inrPaise.format(amount);
/** 12,345 */
export const formatNumber = (n: number) => integer.format(n);
/** 1,234.5 L */
export const formatLitres = (l: number) => `${oneDecimal.format(l)} L`;
/** 1,234.5 kg */
export const formatKg = (kg: number) => `${oneDecimal.format(kg)} kg`;
/** 34.5% */
export const formatPct = (pct: number) => `${oneDecimal.format(pct)}%`;
/** 42 g */
export const formatGrams = (g: number) => `${integer.format(g)} g`;
/** 11 Oct 2026 */
export const formatDay = (iso: string) => formatDate(parseISO(iso), 'd MMM yyyy');
