import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { monthStartIso, todayIso } from '@/lib/dates';
import { formatINR } from '@/lib/format';
import { describePayModel } from '@/lib/payModel';
import { setWorkerActive } from '@/services/api';
import { keys, usePayroll, useTasks, useWorkers } from '@/services/queries';
import type { WorkerRole } from '@/types';

export default function WorkersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workers = useWorkers();
  const tasks = useTasks();
  const payroll = usePayroll(monthStartIso(), todayIso());
  const [q, setQ] = useState('');
  const [role, setRole] = useState<WorkerRole | ''>('');

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setWorkerActive(id, active),
    onSuccess: (w) => {
      void qc.invalidateQueries({ queryKey: keys.workers });
      toast.success(t(w.active ? 'workers.activated' : 'workers.deactivated', { name: w.name }));
    },
  });

  const earnings = useMemo(() => Object.fromEntries((payroll.data ?? []).map((r) => [r.worker.id, r.earnings.gross])), [payroll.data]);
  const rows = (workers.data ?? []).filter((w) => (!role || w.role === role) && `${w.name} ${w.phone}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title={t('nav.workers')} description={t('pages.workers')} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBar value={q} onChange={setQ} />
        <Select id="worker-role" aria-label={t('workers.role')} value={role} onChange={(e) => setRole(e.target.value as WorkerRole | '')} className="w-auto">
          <option value="">{t('workers.allRoles')}</option>
          {(['tapper', 'field_worker', 'supervisor'] as const).map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
        </Select>
      </div>
      {workers.isLoading ? <TableSkeleton /> : rows.length === 0 ? <EmptyState icon={Users} title={t('common.noResults')} /> : (
        <Table>
          <THead>
            <TR>
              <TH>{t('workers.name')}</TH><TH>{t('workers.role')}</TH><TH>{t('workers.payModel')}</TH><TH>{t('workers.phone')}</TH>
              <TH>{t('workers.tasks')}</TH><TH numeric>{t('workers.earningsMonth')}</TH><TH>{t('workers.active')}</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((w) => (
              <TR key={w.id} className={w.active ? '' : 'opacity-60'}>
                <TD className="font-medium">{w.name}</TD>
                <TD><Badge tone={w.role === 'tapper' ? 'good' : w.role === 'supervisor' ? 'info' : 'neutral'}>{t(`role.${w.role}`)}</Badge></TD>
                <TD className="whitespace-nowrap">{describePayModel(w.payModel, t)}</TD>
                <TD className="tabular whitespace-nowrap">{w.phone}</TD>
                <TD className="text-muted-foreground">{tasks.data?.filter((x) => x.assignedWorkerId === w.id).map((x) => x.name.replace('Block ', '').replace(' - Task ', '·')).join(', ') || '—'}</TD>
                <TD numeric>{w.id in earnings ? formatINR(earnings[w.id]) : '—'}</TD>
                <TD>
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2">
                    <input
                      id={`active-${w.id}`}
                      type="checkbox"
                      className="size-5 accent-[var(--primary)]"
                      checked={w.active}
                      onChange={(e) => toggle.mutate({ id: w.id, active: e.target.checked })}
                    />
                    <span className="sr-only">{t('workers.activeFor', { name: w.name })}</span>
                  </label>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
