import { useState } from 'react';
import { CalendarClock, Shovel } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TFoot, TH, THead, TR } from '@/components/ui/table';
import { todayIso } from '@/lib/dates';
import { formatDay, formatINR } from '@/lib/format';
import { byId, useFieldWork, useFields, useWorkers } from '@/services/queries';
import type { FieldWorkType } from '@/types';

const TYPES: FieldWorkType[] = ['weeding', 'fertilizer', 'spraying', 'rain_guarding', 'other'];

export default function FieldWorkPage() {
  const { t } = useTranslation();
  const work = useFieldWork();
  const fieldMap = byId(useFields().data);
  const workerMap = byId(useWorkers().data);
  const [type, setType] = useState<FieldWorkType | ''>('');
  const today = todayIso();
  const upcoming = (work.data ?? []).filter((w) => w.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const past = (work.data ?? []).filter((w) => w.date <= today && (!type || w.type === type));
  const sum = (k: 'labourCost' | 'materialCost') => past.reduce((s, w) => s + w[k], 0);

  return (
    <>
      <PageHeader title={t('nav.fieldWork')} description={t('pages.fieldWork')} />
      <section aria-labelledby="fw-up" className="mb-8">
        <h2 id="fw-up" className="mb-3 text-lg font-semibold">{t('fieldWork.upcoming')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.map((w) => (
            <Card key={w.id} className="p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="size-4" aria-hidden />{formatDay(w.date)}</div>
              <p className="font-semibold">{t(`fieldWorkType.${w.type}`)} · {fieldMap[w.fieldId]?.name}</p>
              {w.notes && <p className="mt-1 text-sm text-muted-foreground">{w.notes}</p>}
            </Card>
          ))}
        </div>
      </section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t('fieldWork.history')}</h2>
        <Select id="fw-type" aria-label={t('fieldWork.type')} value={type} onChange={(e) => setType(e.target.value as FieldWorkType | '')} className="w-auto">
          <option value="">{t('fieldWork.allTypes')}</option>
          {TYPES.map((x) => <option key={x} value={x}>{t(`fieldWorkType.${x}`)}</option>)}
        </Select>
      </div>
      {work.isLoading ? <TableSkeleton /> : past.length === 0 ? <EmptyState icon={Shovel} title={t('common.noResults')} /> : (
        <Table>
          <THead><TR><TH>{t('common.date')}</TH><TH>{t('fieldWork.type')}</TH><TH>{t('common.field')}</TH><TH>{t('fieldWork.workers')}</TH><TH numeric>{t('fieldWork.labour')}</TH><TH numeric>{t('fieldWork.material')}</TH><TH>{t('log.notes')}</TH></TR></THead>
          <TBody>
            {past.map((w) => (
              <TR key={w.id}>
                <TD className="whitespace-nowrap">{formatDay(w.date)}</TD>
                <TD><Badge tone={w.type === 'rain_guarding' ? 'info' : 'neutral'}>{t(`fieldWorkType.${w.type}`)}</Badge></TD>
                <TD>{fieldMap[w.fieldId]?.name}</TD>
                <TD className="text-muted-foreground">{w.workerIds.map((id) => workerMap[id]?.name).join(', ')}</TD>
                <TD numeric>{formatINR(w.labourCost)}</TD>
                <TD numeric>{w.materialCost ? formatINR(w.materialCost) : '—'}</TD>
                <TD className="text-muted-foreground">{w.notes ?? ''}</TD>
              </TR>
            ))}
          </TBody>
          <TFoot><TR><TD colSpan={4}>{t('common.total')}</TD><TD numeric>{formatINR(sum('labourCost'))}</TD><TD numeric>{formatINR(sum('materialCost'))}</TD><TD /></TR></TFoot>
        </Table>
      )}
    </>
  );
}
