import { useMemo, useState } from 'react';
import { Trees } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { logDryKg } from '@/lib/calculations';
import { monthStartIso } from '@/lib/dates';
import { formatKg, formatNumber } from '@/lib/format';
import { useFields, useTappingLogs, useTasks, byId } from '@/services/queries';
import type { FieldStatus } from '@/types';

const statusTone = { tapping: 'good', immature: 'info', resting: 'warning', replanting: 'neutral' } as const;

export default function FieldsPage() {
  const { t } = useTranslation();
  const fields = useFields();
  const tasks = useTasks();
  const logs = useTappingLogs({ from: monthStartIso(), status: 'tapped' });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<FieldStatus | ''>('');

  const kgByField = useMemo(() => {
    const taskMap = byId(tasks.data);
    const m: Record<string, number> = {};
    logs.data?.forEach((l) => {
      const f = taskMap[l.taskId]?.fieldId;
      if (f) m[f] = (m[f] ?? 0) + logDryKg(l);
    });
    return m;
  }, [logs.data, tasks.data]);

  const rows = (fields.data ?? []).filter(
    (f) => (!status || f.status === status) && `${f.name} ${f.clone}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader title={t('nav.fields')} description={t('pages.fields')} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBar value={q} onChange={setQ} />
        <Select id="field-status" aria-label={t('common.status')} value={status} onChange={(e) => setStatus(e.target.value as FieldStatus | '')} className="w-auto">
          <option value="">{t('common.allStatuses')}</option>
          {(['tapping', 'immature', 'resting', 'replanting'] as const).map((s) => <option key={s} value={s}>{t(`fieldStatus.${s}`)}</option>)}
        </Select>
      </div>
      {fields.isLoading ? <TableSkeleton rows={5} /> : rows.length === 0 ? (
        <EmptyState icon={Trees} title={t('common.noResults')} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t('fields.name')}</TH><TH numeric>{t('fields.area')}</TH><TH>{t('fields.clone')}</TH>
              <TH numeric>{t('fields.planted')}</TH><TH numeric>{t('fields.trees')}</TH><TH>{t('fields.system')}</TH>
              <TH>{t('common.status')}</TH><TH numeric>{t('fields.yieldPerAcre')}</TH><TH numeric>{t('fields.tasks')}</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((f) => (
              <TR key={f.id}>
                <TD className="font-medium">{f.name}</TD>
                <TD numeric>{f.areaAcres}</TD>
                <TD>{f.clone}</TD>
                <TD numeric>{f.plantingYear}</TD>
                <TD numeric>{formatNumber(f.treeCount)}</TD>
                <TD>{f.tappingSystem}</TD>
                <TD><Badge tone={statusTone[f.status]}>{t(`fieldStatus.${f.status}`)}</Badge></TD>
                <TD numeric>{f.status === 'tapping' ? formatKg((kgByField[f.id] ?? 0) / f.areaAcres) : '—'}</TD>
                <TD numeric>{tasks.data?.filter((x) => x.fieldId === f.id).length ?? '…'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
