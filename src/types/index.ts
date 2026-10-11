// Domain types (PRD "Data model"). Shared by the mock layer, services and screens.
export type ID = string;

export interface Estate { id: ID; name: string; location: string; totalAreaAcres: number; ownerName: string; }

export type FieldStatus = 'immature' | 'tapping' | 'resting' | 'replanting';
export type TappingSystem = 'S/2 d1' | 'S/2 d2' | 'S/2 d3';

export interface Field {
  id: ID; estateId: ID; name: string; areaAcres: number;
  plantingYear: number; clone: string; treeCount: number;
  status: FieldStatus;
  tappingSystem: TappingSystem;
}

export interface TappingTask {
  id: ID; fieldId: ID; name: string;
  treeCount: number; assignedWorkerId: ID | null;
  rainGuarded: boolean;
}

export type WorkerRole = 'tapper' | 'field_worker' | 'supervisor';

export interface Worker {
  id: ID; name: string; phone: string;
  role: WorkerRole;
  payModel: PayModel; joinedOn: string; active: boolean;
  upiId?: string; bankLast4?: string;
}

export type PayModel =
  | { kind: 'per_tree'; ratePerTree: number }
  | { kind: 'per_kg'; ratePerKgDry: number }
  | { kind: 'daily_wage'; dailyRate: number; incentivePerKgAbove?: { thresholdKg: number; rate: number } }
  | { kind: 'share'; workerSharePct: number };

export type TappingStatus = 'tapped' | 'rain_off' | 'absent' | 'holiday';

export interface TappingLog {
  id: ID; date: string; taskId: ID; workerId: ID;
  status: TappingStatus;
  treesTapped: number; latexLitres: number; drcPct: number;
  scrapKg: number; notes?: string; enteredBy: ID;
}

export type FieldWorkType = 'weeding' | 'fertilizer' | 'spraying' | 'rain_guarding' | 'other';

export interface FieldWork {
  id: ID; date: string; fieldId: ID;
  type: FieldWorkType;
  workerIds: ID[]; labourCost: number; materialCost: number; notes?: string;
}

export type ExpenseCategory = 'wages' | 'fertilizer' | 'chemicals' | 'rain_guards' | 'tools'
  | 'formic_acid' | 'fuel_firewood' | 'transport' | 'repairs' | 'tax' | 'misc';
export type PaymentMode = 'cash' | 'upi' | 'bank';

export interface Expense {
  id: ID; date: string; category: ExpenseCategory; fieldId?: ID;
  amount: number; paymentMode: PaymentMode; description: string;
  receiptUrl?: string; recurring?: 'monthly' | null;
}

export interface Advance { id: ID; workerId: ID; date: string; amount: number; recoveredAmount: number; }

export type PayStatus = 'draft' | 'approved' | 'paid';

export interface PayPeriod {
  id: ID; workerId: ID; from: string; to: string;
  grossEarnings: number; advanceDeduction: number; bonus: number; netPay: number;
  status: PayStatus; paidOn?: string;
}

export type BatchStage = 'drying' | 'smoking' | 'ready' | 'sold';

export interface ProductionBatch {
  id: ID; date: string; latexLitres: number; drcPct: number;
  sheetsMade: number; sheetWeightKg: number; stage: BatchStage;
}

export type Product = 'latex' | 'RSS1' | 'RSS4' | 'RSS5' | 'scrap';

export interface Sale {
  id: ID; date: string; buyer: string;
  product: Product;
  quantityKg: number; ratePerKg: number; amount: number; amountReceived: number;
}

export interface MarketPrice { date: string; product: string; ratePerKg: number; }

export interface Settings {
  latexDensity: number;        // kg per litre
  defaultDrcPct: number;
  payPeriod: 'weekly' | 'fortnightly' | 'monthly';
  rainOffAllowance: number;    // ₹ per rain-off day; 0 = off
  defaultAdvanceDeduction: number;
}

export interface Database {
  version: number;
  seededOn: string;
  estate: Estate;
  fields: Field[];
  tasks: TappingTask[];
  workers: Worker[];
  tappingLogs: TappingLog[];
  fieldWork: FieldWork[];
  expenses: Expense[];
  advances: Advance[];
  payPeriods: PayPeriod[];
  batches: ProductionBatch[];
  sales: Sale[];
  marketPrices: MarketPrice[];
  settings: Settings;
}
