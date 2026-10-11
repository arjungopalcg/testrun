// TanStack Query hooks over services/api.ts, with shared cache keys.
import { useQuery } from '@tanstack/react-query';
import * as api from './api';

export const keys = {
  estate: ['estate'], settings: ['settings'], fields: ['fields'], tasks: ['tasks'], workers: ['workers'],
  logs: (f: api.LogFilter) => ['logs', f] as const, fieldWork: ['fieldWork'], expenses: ['expenses'],
  batches: ['batches'], sales: ['sales'], prices: ['prices'], advances: ['advances'],
  payroll: (from: string, to: string) => ['payroll', from, to] as const,
  dashboard: (from: string, to: string) => ['dashboard', from, to] as const,
};

export const useEstate = () => useQuery({ queryKey: keys.estate, queryFn: api.getEstate });
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: api.getSettings });
export const useFields = () => useQuery({ queryKey: keys.fields, queryFn: api.getFields });
export const useTasks = () => useQuery({ queryKey: keys.tasks, queryFn: api.getTasks });
export const useWorkers = () => useQuery({ queryKey: keys.workers, queryFn: api.getWorkers });
export const useTappingLogs = (f: api.LogFilter) => useQuery({ queryKey: keys.logs(f), queryFn: () => api.getTappingLogs(f) });
export const useFieldWork = () => useQuery({ queryKey: keys.fieldWork, queryFn: api.getFieldWork });
export const useExpenses = () => useQuery({ queryKey: keys.expenses, queryFn: api.getExpenses });
export const useBatches = () => useQuery({ queryKey: keys.batches, queryFn: api.getBatches });
export const useSales = () => useQuery({ queryKey: keys.sales, queryFn: api.getSales });
export const useMarketPrices = () => useQuery({ queryKey: keys.prices, queryFn: api.getMarketPrices });
export const useAdvances = () => useQuery({ queryKey: keys.advances, queryFn: api.getAdvances });
export const usePayroll = (from: string, to: string) => useQuery({ queryKey: keys.payroll(from, to), queryFn: () => api.getPayroll(from, to) });
export const useDashboard = (from: string, to: string) => useQuery({ queryKey: keys.dashboard(from, to), queryFn: () => api.getDashboard(from, to) });

/** Lookup map helper: byId(workers)[id]. */
export const byId = <T extends { id: string }>(items: T[] | undefined) =>
  Object.fromEntries((items ?? []).map((i) => [i.id, i])) as Record<string, T>;
