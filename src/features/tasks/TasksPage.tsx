import { useMemo, useState } from 'react';
import { ListChecks, Umbrella } from 'lucide-react';
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
import { logDryKg } from '@/lib/calculations';
import { isoDate } from '@/lib/dates';
import { formatKg, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { assignTapper } from '@/services/api';
import { byId, keys, useFields, useTappingLogs, useTasks, useWorkers } from '@/services/queries';
import { subDays } from 'date-fns';

export default function TasksPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const tasks = useTasks();
  const fields = useFields();
  const workers = useWorkers();
  const since = useMemo(() => isoDate(subDays(new Date(), 30)), []);
  const logs = useTappingLogs({ from: since, status: 'tapped' });
  const [q, setQ] = useState('');
  const [fieldId, setFieldId] = useState('');

  const assign = useMutation({
    mutationFn: ({ taskId, workerId }: { taskId: string; workerId: string | null }) => assignTapper(taskId, workerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.tasks });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('tasks.assigned'));
    },
  });

  const avgKg = useMemo(() => {
    const m: Record<string, { kg: number; days: number }> = {};
    logs.data?.forEach((l) => {
      const v = (m[l.taskId] ??= { kg: 0, days: 0 });
      v.kg += logDryKg(l);
      v.days++;
    });
    return m;
  }, [logs.data]);

  const fieldMap = byId(fields.data);
  const workerMap = byId(workers.data);
  const tappers = workers.data?.filter((w) => w.role === 'tapper' && w.active) ?? [];
  const rows = (tasks.data ?? []).filter((task) => {
    const tapper = task.assignedWorkerId ? workerMap[task.assignedWorkerId]?.name ?? '' : '';
    return (!fieldId || task.fieldId === fieldId) && `${task.name} ${tapper}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <>
      <PageHeader title={t('nav.tasks')} description={t('pages.tasks')} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBar value={q} onChange={setQ} />
        <Select id="task-field" aria-label={t('common.field')} value={fieldId} onChange={(e) => setFieldId(e.target.value)} className="w-auto">
          <option value="">{t('common.allFields')}</option>
          {fields.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
      </div>
      {tasks.isLoading ? <TableSkeleton /> : rows.length === 0 ? <EmptyState icon={ListChecks} title={t('common.noResults')} /> : (
        <Table>
          <THead>
            <TR>
              <TH>{t('tasks.task')}</TH><TH>{t('common.field')}</TH><TH numeric>{t('fields.trees')}</TH>
              <TH>{t('tasks.tapper')}</TH><TH>{t('tasks.rainGuard')}</TH><TH numeric>{t('tasks.avgKgDay')}</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((task) => {
              const a = avgKg[task.id];
              return (
                <TR key={task.id} className={cn(!task.assignedWorkerId && 'bg-warning/15')}>
                  <TD className="font-medium">{task.name}</TD>
                  <TD>{fieldMap[task.fieldId]?.name}</TD>
                  <TD numeric>{formatNumber(task.treeCount)}</TD>
                  <TD>
                    <Select
                      id={`assign-${task.id}`}
                      aria-label={t('tasks.assignFor', { task: task.name })}
                      value={task.assignedWorkerId ?? ''}
                      onChange={(e) => assign.mutate({ taskId: task.id, workerId: e.target.value || null })}
                      className="h-10 min-w-44"
                    >
                      <option value="">{t('tasks.unassigned')}</option>
                      {tappers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </Select>
                  </TD>
                  <TD>{task.rainGuarded ? <Badge tone="info"><Umbrella className="size-3" aria-hidden />{t('common.yes')}</Badge> : <span className="text-muted-foreground">{t('common.no')}</span>}</TD>
                  <TD numeric>{a ? formatKg(a.kg / a.days) : '—'}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
