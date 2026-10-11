import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField, Input, Select } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { isoDate, todayIso } from '@/lib/dates';
import { formatDay, formatINR, formatKg, formatNumber } from '@/lib/format';
import { describePayModel } from '@/lib/payModel';
import { recordAdvance, setPayStatus, type PayrollRow } from '@/services/api';
import { byId, useAdvances, usePayroll, useWorkers } from '@/services/queries';

const statusTone = { draft: 'neutral', approved: 'warning', paid: 'good' } as const;

export default function PaymentsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const months = useMemo(() => Array.from({ length: 7 }, (_, i) => subMonths(new Date(), i)), []);
  const [monthIdx, setMonthIdx] = useState(1);
  const m = months[monthIdx];
  const from = isoDate(startOfMonth(m));
  const to = monthIdx === 0 ? todayIso() : isoDate(endOfMonth(m));
  const payroll = usePayroll(from, to);
  const [expanded, setExpanded] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ predicate: (q) => ['payroll', 'dashboard', 'expenses', 'advances'].includes(q.queryKey[0] as string) });
  const status = useMutation({
    mutationFn: ({ row, next }: { row: PayrollRow; next: 'approved' | 'paid' }) =>
      setPayStatus(row.worker.id, from, to, next, { gross: row.earnings.gross, bonus: row.bonus, advanceDeduction: row.advanceDeduction, net: row.net }),
    onSuccess: (p) => { void invalidate(); toast.success(t(p.status === 'paid' ? 'pay.markedPaid' : 'pay.approved')); },
  });

  const rows = payroll.data ?? [];
  const total = (k: (r: PayrollRow) => number) => rows.reduce((s, r) => s + k(r), 0);

  const shareText = (r: PayrollRow) => encodeURIComponent(
    `${t('pay.payslip')} · ${format(m, 'MMMM yyyy')}\n${r.worker.name}\n` +
    `${t('pay.days')}: ${r.earnings.daysTapped}, ${t('log.dryKg')}: ${r.earnings.dryKg.toFixed(1)}\n` +
    `${t('pay.gross')}: ${formatINR(r.earnings.gross)}\n${t('pay.advance')}: -${formatINR(r.advanceDeduction)}\n` +
    `${t('pay.bonus')}: ${formatINR(r.bonus)}\n${t('pay.net')}: ${formatINR(r.net)}`,
  );

  return (
    <>
      <PageHeader title={t('nav.payments')} description={t('pages.payments')} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <FormField label={t('pay.period')} htmlFor="pay-month">
          <Select id="pay-month" value={monthIdx} onChange={(e) => { setMonthIdx(Number(e.target.value)); setExpanded(null); }} className="w-auto">
            {months.map((d, i) => <option key={i} value={i}>{format(d, 'MMMM yyyy')}{i === 0 ? ` (${t('pay.toDate')})` : ''}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('pay.gross')} value={formatINR(total((r) => r.earnings.gross))} />
        <StatCard label={t('pay.advance')} value={formatINR(total((r) => r.advanceDeduction))} />
        <StatCard label={t('pay.net')} value={formatINR(total((r) => r.net))} />
        <StatCard label={t('pay.pending')} value={String(rows.filter((r) => r.status !== 'paid').length)} tone={rows.some((r) => r.status !== 'paid') ? 'warning' : 'default'} />
      </div>
      {payroll.isLoading ? <TableSkeleton rows={12} /> : (
        <Table>
          <THead>
            <TR>
              <TH><span className="sr-only">{t('pay.details')}</span></TH>
              <TH>{t('workers.name')}</TH><TH>{t('workers.payModel')}</TH><TH numeric>{t('pay.days')}</TH><TH numeric>{t('log.trees')}</TH>
              <TH numeric>{t('log.dryKg')}</TH><TH numeric>{t('pay.gross')}</TH><TH numeric>{t('pay.advance')}</TH><TH numeric>{t('pay.bonus')}</TH>
              <TH numeric>{t('pay.net')}</TH><TH>{t('common.status')}</TH><TH>{t('pay.actions')}</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((r) => {
              const open = expanded === r.worker.id;
              return (
                <Fragment key={r.worker.id}>
                  <TR>
                    <TD>
                      <Button variant="ghost" size="icon" className="size-9" aria-expanded={open} aria-label={t('pay.showBreakdown', { name: r.worker.name })} onClick={() => setExpanded(open ? null : r.worker.id)}>
                        {open ? <ChevronDown /> : <ChevronRight />}
                      </Button>
                    </TD>
                    <TD className="whitespace-nowrap font-medium">{r.worker.name}</TD>
                    <TD className="whitespace-nowrap text-muted-foreground">{describePayModel(r.worker.payModel, t)}</TD>
                    <TD numeric>{r.earnings.daysTapped}</TD>
                    <TD numeric>{formatNumber(r.earnings.trees)}</TD>
                    <TD numeric>{formatKg(r.earnings.dryKg)}</TD>
                    <TD numeric>{formatINR(r.earnings.gross)}</TD>
                    <TD numeric>{r.advanceDeduction ? `−${formatINR(r.advanceDeduction)}` : '—'}</TD>
                    <TD numeric>{r.bonus ? formatINR(r.bonus) : '—'}</TD>
                    <TD numeric className="font-semibold">{formatINR(r.net)}</TD>
                    <TD><Badge tone={statusTone[r.status]}>{t(`payStatus.${r.status}`)}</Badge></TD>
                    <TD>
                      <div className="flex gap-2">
                        {r.status === 'draft' && <Button size="sm" variant="outline" onClick={() => status.mutate({ row: r, next: 'approved' })}>{t('pay.approve')}</Button>}
                        {r.status === 'approved' && <Button size="sm" onClick={() => status.mutate({ row: r, next: 'paid' })}>{t('pay.markPaid')}</Button>}
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`https://wa.me/?text=${shareText(r)}`} target="_blank" rel="noreferrer" aria-label={t('pay.shareWhatsApp', { name: r.worker.name })}><MessageCircle /></a>
                        </Button>
                      </div>
                    </TD>
                  </TR>
                  {open && (
                    <TR className="bg-muted/40">
                      <TD />
                      <TD colSpan={11}>
                        <dl className="tabular grid max-w-xl gap-1 py-1 text-sm">
                          {r.earnings.lines.map((line) => (
                            <div key={line.label} className="flex justify-between gap-4"><dt>{t(`pay.line.${line.label}`)} <span className="text-muted-foreground">({line.detail})</span></dt><dd>{formatINR(line.amount)}</dd></div>
                          ))}
                          <div className="flex justify-between gap-4 border-t pt-1"><dt>{t('pay.gross')}</dt><dd>{formatINR(r.earnings.gross)}</dd></div>
                          <div className="flex justify-between gap-4"><dt>{t('pay.bonus')}</dt><dd>{formatINR(r.bonus)}</dd></div>
                          <div className="flex justify-between gap-4"><dt>{t('pay.advance')} <span className="text-muted-foreground">({t('pay.outstanding')}: {formatINR(r.outstandingAdvance)})</span></dt><dd>−{formatINR(r.advanceDeduction)}</dd></div>
                          <div className="flex justify-between gap-4 border-t pt-1 font-semibold"><dt>{t('pay.net')}</dt><dd>{formatINR(r.net)}</dd></div>
                          {r.paidOn && <p className="text-muted-foreground">{t('pay.paidOn', { date: formatDay(r.paidOn) })}</p>}
                        </dl>
                      </TD>
                    </TR>
                  )}
                </Fragment>
              );
            })}
          </TBody>
        </Table>
      )}
      <Advances onChange={invalidate} />
    </>
  );
}

function Advances({ onChange }: { onChange: () => void }) {
  const { t } = useTranslation();
  const advances = useAdvances();
  const workers = useWorkers();
  const workerMap = byId(workers.data);
  const [workerId, setWorkerId] = useState('');
  const [amount, setAmount] = useState('');
  const add = useMutation({
    mutationFn: () => recordAdvance(workerId, Number(amount)),
    onSuccess: () => { onChange(); setAmount(''); toast.success(t('pay.advanceRecorded')); },
  });
  const list = [...(advances.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section className="mt-10" aria-labelledby="adv-title">
      <h2 id="adv-title" className="mb-3 text-lg font-semibold">{t('pay.advances')}</h2>
      <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (workerId && Number(amount) > 0) add.mutate(); }}>
        <FormField label={t('workers.name')} htmlFor="adv-worker">
          <Select id="adv-worker" value={workerId} onChange={(e) => setWorkerId(e.target.value)} required className="w-56">
            <option value="">{t('pay.chooseWorker')}</option>
            {workers.data?.filter((w) => w.active).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </FormField>
        <FormField label={t('pay.amount')} htmlFor="adv-amount"><Input id="adv-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-36" /></FormField>
        <Button type="submit" disabled={add.isPending}>{t('pay.recordAdvance')}</Button>
      </form>
      {advances.isLoading ? <TableSkeleton rows={4} /> : (
        <Table>
          <THead><TR><TH>{t('common.date')}</TH><TH>{t('workers.name')}</TH><TH numeric>{t('pay.amount')}</TH><TH numeric>{t('pay.recovered')}</TH><TH numeric>{t('pay.outstanding')}</TH></TR></THead>
          <TBody>
            {list.map((a) => (
              <TR key={a.id}>
                <TD>{formatDay(a.date)}</TD><TD>{workerMap[a.workerId]?.name}</TD><TD numeric>{formatINR(a.amount)}</TD>
                <TD numeric>{formatINR(a.recoveredAmount)}</TD>
                <TD numeric className={a.amount > a.recoveredAmount ? 'font-semibold' : 'text-muted-foreground'}>{formatINR(a.amount - a.recoveredAmount)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </section>
  );
}
