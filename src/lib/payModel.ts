import type { TFunction } from 'i18next';
import type { PayModel } from '@/types';
import { formatRate } from './format';

export function describePayModel(p: PayModel, t: TFunction) {
  switch (p.kind) {
    case 'per_tree': return t('payModel.perTreeRate', { rate: formatRate(p.ratePerTree) });
    case 'per_kg': return t('payModel.perKgRate', { rate: formatRate(p.ratePerKgDry) });
    case 'daily_wage': return t('payModel.dailyRate', { rate: formatRate(p.dailyRate) });
    case 'share': return t('payModel.shareRate', { pct: p.workerSharePct });
  }
}
