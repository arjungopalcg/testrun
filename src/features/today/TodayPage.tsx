import { useMemo, useState } from 'react';
import { CheckCircle2, CloudRain, CloudSun, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { dryKg, logDryKg } from '@/lib/calculations';
import { isoDate, todayIso } from '@/lib/dates';
import { formatKg, formatLitres, formatNumber, formatPct } from '@/lib/format';
import { isTaskDue } from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { saveTappingLog } from '@/services/api';
import { byId, useFields, useSettings, useTappingLogs, useTasks, useWorkers } from '@/services/queries';
import type { TappingLog, TappingStatus, TappingTask } from '@/types';

const STATUSES: TappingStatus[] = ['tapped', 'rain_off', 'absent', 'holiday'];
const statusTone = { tapped: 'good', rain_off: 'info', absent: 'warning', holiday: 'neutral' } as const;

export default function TodayPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const date = todayIso();
  const since = useMemo(() => isoDate(subDays(new Date(), 14)), []);
  const tasks = useTasks();
  const fields = useFields();
  const workers = useWorkers();
  const settings = useSettings();
  const recent = useTappingLogs({ from: since });
  const [open, setOpen] = useState<TappingTask | null>(null);

  const fieldMap = byId(fields.data);
  const workerMap = byId(workers.data);
  const todayLogs = useMemo(() => Object.fromEntries((recent.data ?? []).filter((l) => l.date === date).map((l) => [l.taskId, l])), [recent.data, date]);
  const lastDrc = useMemo(() => {
    const m: Record<string, number> = {};
    // recent.data is newest first, so the first tapped entry per task wins.
    recent.data?.forEach((l) => { if (l.status === 'tapped' && l.date < date && !(l.taskId in m)) m[l.taskId] = l.drcPct; });
    return m;
  }, [recent.data, date]);

  const due = (tasks.data ?? []).filter((task) => task.assignedWorkerId && fieldMap[task.fieldId] && isTaskDue(task, fieldMap[task.fieldId], date));
  const logged = due.filter((task) => todayLogs[task.id]);
  const totals = logged.reduce((s, task) => {
    const l = todayLogs[task.id];
    return { litres: s.litres + l.latexLitres, kg: s.kg + (l.status === 'tapped' ? logDryKg(l, settings.data?.latexDensity) : 0) };
  }, { litres: 0, kg: 0 });

  const save = useMutation({
    mutationFn: saveTappingLog,
    onSuccess: () => qc.invalidateQueries({ predicate: (q) => ['logs', 'dashboard', 'payroll'].includes(q.queryKey[0] as string) }),
  });

  const rainOffAll = async () => {
    const pending = due.filter((task) => !todayLogs[task.id]);
    await Promise.all(pending.map((task) => save.mutateAsync({
      date, taskId: task.id, workerId: task.assignedWorkerId!, status: 'rain_off', treesTapped: 0, latexLitres: 0, drcPct: 0, scrapKg: 0, enteredBy: 'worker-16',
    })));
    toast.success(t('today.rainOffMarked', { count: pending.length }));
  };

  const loading = tasks.isLoading || fields.isLoading || recent.isLoading;

  return (
    <div className="mx-auto max-w-xl pb-24">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{t('nav.today')}</p>
          <h1 className="text-2xl font-semibold">{format(new Date(), 'EEEE, d MMM')}</h1>
        </div>
        <Badge tone="info" className="py-1.5 text-sm"><CloudSun className="size-4" aria-hidden />{t('today.weather')}</Badge>
      </div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-muted-foreground">{t('today.progress', { done: logged.length, total: due.length })}</p>
        <Button variant="outline" size="lg" onClick={rainOffAll} disabled={save.isPending || logged.length === due.length}>
          <CloudRain />{t('today.rainOffAll')}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : due.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={t('today.noneDue')} />
      ) : (
        <ul className="space-y-3">
          {due.map((task) => {
            const l = todayLogs[task.id];
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => setOpen(task)}
                  className={cn(
                    'flex min-h-20 w-full items-center gap-3 rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    l && 'border-primary/40',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{task.name}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="size-3.5" aria-hidden />{workerMap[task.assignedWorkerId!]?.name} · {formatNumber(task.treeCount)} {t('common.treesUnit')}
                    </p>
                  </div>
                  {l ? (
                    <div className="text-right">
                      <Badge tone={statusTone[l.status]}>{t(`tappingStatus.${l.status}`)}</Badge>
                      {l.status === 'tapped' && <p className="tabular mt-1 text-sm">{formatLitres(l.latexLitres)} · {formatPct(l.drcPct)}</p>}
                    </div>
                  ) : <Badge>{t('today.pending')}</Badge>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t bg-card/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-xl justify-between text-sm">
          <span className="text-muted-foreground">{t('today.totalSoFar')}</span>
          <span className="tabular font-semibold">{formatLitres(totals.litres)} · {formatKg(totals.kg)} {t('today.dry')}</span>
        </div>
      </div>

      {open && (
        <EntrySheet
          task={open}
          existing={todayLogs[open.id]}
          defaultDrc={lastDrc[open.id] ?? settings.data?.defaultDrcPct ?? 34}
          tapperName={workerMap[open.assignedWorkerId!]?.name ?? ''}
          saving={save.isPending}
          onClose={() => setOpen(null)}
          onSave={async (entry) => {
            await save.mutateAsync({ ...entry, date, taskId: open.id, workerId: open.assignedWorkerId!, enteredBy: 'worker-16' });
            toast.success(t('today.saved', { task: open.name }));
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}

type Entry = Pick<TappingLog, 'status' | 'treesTapped' | 'latexLitres' | 'drcPct' | 'scrapKg' | 'notes'>;

function EntrySheet({ task, existing, defaultDrc, tapperName, saving, onClose, onSave }: {
  task: TappingTask; existing?: TappingLog; defaultDrc: number; tapperName: string; saving: boolean;
  onClose: () => void; onSave: (e: Entry) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TappingStatus>(existing?.status ?? 'tapped');
  const [trees, setTrees] = useState(String(existing?.treesTapped || task.treeCount));
  const [litres, setLitres] = useState(existing?.latexLitres ? String(existing.latexLitres) : '');
  const [drc, setDrc] = useState(String(existing?.drcPct || defaultDrc));
  const [scrap, setScrap] = useState(existing?.scrapKg ? String(existing.scrapKg) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const tapped = status === 'tapped';
  const num = (s: string) => Number(s) || 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="entry-title">
      <form
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          void onSave(tapped
            ? { status, treesTapped: num(trees), latexLitres: num(litres), drcPct: num(drc), scrapKg: num(scrap), notes: notes || undefined }
            : { status, treesTapped: 0, latexLitres: 0, drcPct: 0, scrapKg: 0, notes: notes || undefined });
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="entry-title" className="text-lg font-semibold">{task.name}</h2>
            <p className="text-sm text-muted-foreground">{tapperName}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-11" onClick={onClose} aria-label={t('common.close')}><X /></Button>
        </div>
        <fieldset className="mb-4">
          <legend className="mb-1.5 text-sm font-medium text-muted-foreground">{t('common.status')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)} aria-pressed={status === s}
                className={cn('min-h-12 rounded-md border font-medium', status === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-background')}>
                {t(`tappingStatus.${s}`)}
              </button>
            ))}
          </div>
        </fieldset>
        {tapped && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('log.trees')} htmlFor="e-trees"><Input id="e-trees" inputMode="numeric" value={trees} onChange={(e) => setTrees(e.target.value)} /></FormField>
            <FormField label={t('log.litres')} htmlFor="e-litres"><Input id="e-litres" inputMode="decimal" value={litres} onChange={(e) => setLitres(e.target.value)} autoFocus required /></FormField>
            <FormField label={t('log.drc')} htmlFor="e-drc"><Input id="e-drc" inputMode="decimal" value={drc} onChange={(e) => setDrc(e.target.value)} /></FormField>
            <FormField label={t('log.scrap')} htmlFor="e-scrap"><Input id="e-scrap" inputMode="decimal" value={scrap} onChange={(e) => setScrap(e.target.value)} /></FormField>
          </div>
        )}
        <FormField label={t('log.notes')} htmlFor="e-notes" className="mt-3"><Input id="e-notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
        {tapped && (
          <p className="tabular mt-4 rounded-md bg-muted p-3 text-sm">
            {t('today.dryPreview')}: <strong>{formatKg(dryKg(num(litres), num(drc)))}</strong>
          </p>
        )}
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={saving}>{t('common.save')}</Button>
      </form>
    </div>
  );
}
