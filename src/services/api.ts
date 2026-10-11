// The only module screens may import data from. Today it delegates to the mock
// layer; swapping to a real backend later means changing this file alone.
export {
  getEstate, getSettings, updateSettings, resetDemoData,
  getFields, getTasks, getWorkers, assignTapper, setWorkerActive,
  getTappingLogs, saveTappingLog,
  getFieldWork, getExpenses, addExpense,
  getBatches, getSales, getMarketPrices,
  getPayroll, setPayStatus, getAdvances, recordAdvance,
  getDashboard,
} from '@/mocks/service';
export type { LogFilter, ExpenseRow, PayrollRow, DashboardSummary } from '@/mocks/service';
