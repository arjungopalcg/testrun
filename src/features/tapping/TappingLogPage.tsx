import { useMemo, useState } from 'react';
import { Download, Droplets } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { subDays } from 'date-fns';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField, Input, Select } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TFoot, TH, THead, TR } from '@/components/ui/table';
import { logDryKg } from '@/lib/calculations';
import { isoDate, todayIso } from '@/lib/dates';
import { formatDay, formatKg, formatLitres, formatNumber, formatPct } from '@/lib/format';
import { byId, useFields, useTappingLogs, useTasks, useWorkers } from '@/services/queries';
import type { TappingStatus } from '@/types';

const PAGE = 50;
const statusTone = { tapped: 'good', rain_off: 'info', absent: 'warning', holiday: 'neutral' } as const;

export default function TappingLogPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(() => isoDate(subDays(new Date(), 30)));
  const [to, setTo] = useState(todayIso);
  const [fieldId, setFieldId] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [status, setStatus] = useState<TappingStatus | ''>('');
  const [limit, setLimit] = useState(PAGE);
  const logs = useTappingLogs({ from, to, fieldId: fieldId || undefined, workerId: workerId || undefined, status: status || undefined });
  const tasks = byId(useTasks().data);
  const fields = useFields();
  const workers = useWorkers();
  const workerMap = byId(workers.data);

  const rows = logs.data ?? [];
  const totals = useMemo(() => rows.reduce((s, l) => ({ trees: s.trees + l.treesTapped, litres: s.litres + l.latexLitres, kg: s.kg + (l.status === 'tapped' ? logDryKg(l) : 0), scrap: s.scrap + l.scrapKg }), { trees: 0, litres: 0, kg: 0, scrap: 0 }), [rows]);

  const exportCsv = () => {
    const header = ['date', 'task', 'tapper', 'status', 'trees', 'latex_l', 'drc_pct', 'dry_kg', 'scrap_kg'];
    const lines = rows.map((l) => [l.date, tasks[l.taskId]?.name, workerMap[l.workerId]?.name, l.status, l.treesTapped, l.latexLitres, l.drcPct, logDryKg(l).toFixed(1), l.scrapKg].join(','));
    const url = URL.createObjectURL(new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `tapping-log-${from}-to-${to}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title={t('nav.tappingLog')} description={t('pages.tappingLog')} actions={<Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download />{t('log.exportCsv')}</Button>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <FormField label={t('common.from')} htmlFor="log-from"><Input id="log-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></FormField>
        <FormField label={t('common.to')} htmlFor="log-to"><Input id="log-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></FormField>
        <FormField label={t('common.field')} htmlFor="log-field">
          <Select id="log-field" value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
            <option value="">{t('common.allFields')}</option>
            {fields.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </FormField>
        <FormField label={t('tasks.tapper')} htmlFor="log-worker">
          <Select id="log-worker" value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
            <option value="">{t('log.allTappers')}</option>
            {workers.data?.filter((w) => w.role === 'tapper').map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </FormField>
        <FormField label={t('common.status')} htmlFor="log-status">
          <Select id="log-status" value={status} onChange={(e) => setStatus(e.target.value as TappingStatus | '')}>
            <option value="">{t('common.allStatuses')}</option>
            {(['tapped', 'rain_off', 'absent', 'holiday'] as const).map((s) => <option key={s} value={s}>{t(`tappingStatus.${s}`)}</option>)}
          </Select>
        </FormField>
      </div>
      {logs.isLoading ? <TableSkeleton rows={10} /> : rows.length === 0 ? <EmptyState icon={Droplets} title={t('common.noResults')} /> : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>{t('common.date')}</TH><TH>{t('tasks.task')}</TH><TH>{t('tasks.tapper')}</TH><TH>{t('common.status')}</TH>
                <TH numeric>{t('log.trees')}</TH><TH numeric>{t('log.litres')}</TH><TH numeric>{t('log.drc')}</TH>
                <TH numeric>{t('log.dryKg')}</TH><TH numeric>{t('log.scrap')}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.slice(0, limit).map((l) => (
                <TR key={l.id}>
                  <TD className="whitespace-nowrap">{formatDay(l.date)}</TD>
                  <TD className="whitespace-nowrap">{tasks[l.taskId]?.name}</TD>
                  <TD className="whitespace-nowrap">{workerMap[l.workerId]?.name}</TD>
                  <TD><Badge tone={statusTone[l.status]}>{t(`tappingStatus.${l.status}`)}</Badge></TD>
                  <TD numeric>{l.treesTapped ? formatNumber(l.treesTapped) : '—'}</TD>
                  <TD numeric>{l.latexLitres ? formatLitres(l.latexLitres) : '—'}</TD>
                  <TD numeric>{l.drcPct ? formatPct(l.drcPct) : '—'}</TD>
                  <TD numeric>{l.status === 'tapped' ? formatKg(logDryKg(l)) : '—'}</TD>
                  <TD numeric>{l.scrapKg ? formatKg(l.scrapKg) : '—'}</TD>
                </TR>
              ))}
            </TBody>
            <TFoot>
              <TR>
                <TD colSpan={4}>{t('log.totalRows', { count: rows.length })}</TD>
                <TD numeric>{formatNumber(totals.trees)}</TD><TD numeric>{formatLitres(totals.litres)}</TD><TD />
                <TD numeric>{formatKg(totals.kg)}</TD><TD numeric>{formatKg(totals.scrap)}</TD>
              </TR>
            </TFoot>
          </Table>
          {rows.length > limit && (
            <div className="mt-4 text-center"><Button variant="outline" onClick={() => setLimit((n) => n + PAGE)}>{t('common.showMore')}</Button></div>
          )}
        </>
      )}
    </>
  );
}
