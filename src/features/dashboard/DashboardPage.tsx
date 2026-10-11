import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Droplets, HandCoins, UserX, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO, startOfMonth, startOfWeek, subYears } from 'date-fns';
import { axisProps, categorical, chart, tooltipStyle } from '@/components/chartTheme';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { CardsSkeleton, Skeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { isoDate, todayIso } from '@/lib/dates';
import { formatDay, formatGrams, formatINR, formatKg, formatLitres, formatNumber, formatRate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/services/queries';

type Range = 'today' | 'week' | 'month' | 'season' | 'custom';

// The Indian rubber season runs April to March.
const seasonStart = (d: Date) => new Date(d.getMonth() >= 3 ? d.getFullYear() : subYears(d, 1).getFullYear(), 3, 1);

export default function DashboardPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<Range>('month');
  const [custom, setCustom] = useState({ from: isoDate(startOfMonth(new Date())), to: todayIso() });
  const { from, to } = useMemo(() => {
    const now = new Date();
    switch (range) {
      case 'today': return { from: todayIso(), to: todayIso() };
      case 'week': return { from: isoDate(startOfWeek(now, { weekStartsOn: 1 })), to: todayIso() };
      case 'month': return { from: isoDate(startOfMonth(now)), to: todayIso() };
      case 'season': return { from: isoDate(seasonStart(now)), to: todayIso() };
      case 'custom': return custom;
    }
  }, [range, custom]);
  const { data: d, isLoading } = useDashboard(from, to);

  return (
    <>
      <PageHeader title={t('nav.dashboard')} description={t('pages.dashboard')} />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Segmented<Range>
          label={t('dash.range')} value={range} onChange={setRange} className="flex-wrap"
          options={(['today', 'week', 'month', 'season', 'custom'] as const).map((r) => ({ value: r, label: t(`dash.ranges.${r}`) }))}
        />
        {range === 'custom' && (
          <div className="flex gap-2">
            <FormField label={t('common.from')} htmlFor="d-from"><Input id="d-from" type="date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} /></FormField>
            <FormField label={t('common.to')} htmlFor="d-to"><Input id="d-to" type="date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} /></FormField>
          </div>
        )}
      </div>

      {isLoading || !d ? (
        <div className="space-y-4"><CardsSkeleton count={8} /><Skeleton className="h-72" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t('dash.latex')} value={formatLitres(d.latexLitres)} />
            <StatCard label={t('dash.dryRubber')} value={formatKg(d.dryKg)} />
            <StatCard label={t('dash.treesTapped')} value={formatNumber(d.treesTapped)} />
            <StatCard label={t('dash.rainOffDays')} value={String(d.rainOffDays)} tone={d.rainOffDays > 3 ? 'warning' : 'default'} />
            <StatCard label={t('dash.income')} value={formatINR(d.income)} hint={t('dash.incomeHint')} />
            <StatCard label={t('dash.expenses')} value={formatINR(d.expenses)} hint={t('dash.expensesHint', { wages: formatINR(d.wages) })} />
            <StatCard label={t('dash.profit')} value={formatINR(d.profit)} hint={t('dash.profitHint')} tone={d.profit < 0 ? 'loss' : 'default'} />
            <StatCard label={t('dash.costPerKg')} value={d.dryKg ? formatRate(d.costPerKg) : '—'} hint={t('dash.vsMarket', { rate: formatRate(d.marketRate) })} tone={d.costPerKg > d.marketRate ? 'loss' : 'default'} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>{t('dash.dailyChart')}</CardTitle><p className="text-sm text-muted-foreground">{t('dash.dailyChartHint')}</p></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={d.daily.map((x) => ({ ...x, rain: x.rainOff ? 0 : undefined }))} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={chart.grid} vertical={false} />
                    <XAxis dataKey="date" {...axisProps} tickFormatter={(v: string) => format(parseISO(v), 'd MMM')} minTickGap={32} />
                    <YAxis {...axisProps} width={40} />
                    <Tooltip {...tooltipStyle} labelFormatter={(v: string) => formatDay(v)} formatter={(v: number, n: string) => (n === 'rain' ? [t('tappingStatus.rain_off'), ''] : [formatKg(v), t('dash.dryRubber')])} />
                    <Line type="monotone" dataKey="dryKg" stroke={chart.primary} strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Scatter dataKey="rain" fill={chart.rain} shape="triangle" isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('dash.alerts')}</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {d.alerts.map((a) => {
                    const Icon = { unassigned: UserX, pendingWages: Wallet, advances: HandCoins, drcDrop: Droplets }[a.kind];
                    const to = { unassigned: '/tasks', pendingWages: '/payments', advances: '/payments', drcDrop: '/tapping-log' }[a.kind];
                    const ok = a.count === 0;
                    return (
                      <li key={a.kind}>
                        <Link to={to} className="flex gap-3 rounded-md p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          {ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /> : <Icon className="mt-0.5 size-5 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />}
                          <div className="min-w-0">
                            <p className="font-medium">{t(`dash.alert.${a.kind}`, { count: a.count, amount: formatINR(Number(a.detail) || 0) })}</p>
                            {!ok && a.detail && a.kind !== 'advances' && <p className="text-sm text-muted-foreground">{a.detail}</p>}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>{t('dash.yieldByField')}</CardTitle><p className="text-sm text-muted-foreground">{t('dash.kgPerAcre')}</p></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={d.byField.map((f) => ({ ...f, kgPerAcre: Math.round(f.kgPerAcre * 10) / 10 }))} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={chart.grid} vertical={false} />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis {...axisProps} width={40} />
                    <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--muted)' }} formatter={(v: number) => [formatKg(v), t('dash.kgPerAcre')]} />
                    <Bar dataKey="kgPerAcre" fill={chart.primary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('dash.incomeVsExpenses')}</CardTitle><p className="text-sm text-muted-foreground">{t('dash.last6Months')}</p></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={d.monthly} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={chart.grid} vertical={false} />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} width={48} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                    <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--muted)' }} formatter={(v: number, n: string) => [formatINR(v), t(`dash.${n}`)]} />
                    <Legend formatter={(n: string) => <span className="text-sm text-muted-foreground">{t(`dash.${n}`)}</span>} />
                    <Bar dataKey="income" fill={chart.primary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="expenses" fill={chart.secondary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('dash.expenseSplit')}</CardTitle></CardHeader>
              <CardContent>
                {d.byCategory.length === 0 ? <p className="py-16 text-center text-muted-foreground">{t('dash.noExpenses')}</p> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={d.byCategory} dataKey="amount" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="var(--card)" isAnimationActive={false}>
                        {d.byCategory.map((c, i) => <Cell key={c.category} fill={categorical[i % categorical.length]} />)}
                      </Pie>
                      <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [formatINR(v), t(`expenseCategory.${n}`)]} />
                      <Legend formatter={(n: string) => <span className="text-xs text-muted-foreground">{t(`expenseCategory.${n}`)}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-3 text-lg font-semibold">{t('dash.leaderboard')}</h2>
              <Table>
                <THead><TR><TH>#</TH><TH>{t('tasks.tapper')}</TH><TH numeric>{t('pay.days')}</TH><TH numeric>{t('dash.kgPerDay')}</TH><TH numeric>{t('dash.gramsPerTree')}</TH><TH /></TR></THead>
                <TBody>
                  {d.leaderboard.map((r, i) => (
                    <TR key={r.worker.id} className={cn(r.low && 'bg-warning/10')}>
                      <TD className="tabular text-muted-foreground">{i + 1}</TD>
                      <TD className="whitespace-nowrap font-medium">{r.worker.name}</TD>
                      <TD numeric>{r.days}</TD>
                      <TD numeric>{formatKg(r.kgPerDay)}</TD>
                      <TD numeric>{formatGrams(r.gramsPerTree)}</TD>
                      <TD>{r.low && <Badge tone="warning"><AlertTriangle className="size-3" aria-hidden />{t('dash.lowYield')}</Badge>}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <Card className="self-start">
              <CardHeader><CardTitle>{t('dash.stock')}</CardTitle></CardHeader>
              <CardContent>
                <dl className="tabular space-y-2 text-sm">
                  <div className="flex justify-between"><dt>{t('dash.latexToday')}</dt><dd>{formatLitres(d.stock.latexLitres)}</dd></div>
                  {(['drying', 'smoking', 'ready'] as const).map((s) => (
                    <div key={s} className="flex justify-between"><dt>{t('dash.sheets')} · {t(`batchStage.${s}`)}</dt><dd>{formatKg(d.stock.sheets[s])}</dd></div>
                  ))}
                  <div className="flex justify-between"><dt>{t('product.scrap')}</dt><dd>{formatKg(d.stock.scrapKg)}</dd></div>
                  <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>{t('dash.estValue')}</dt><dd>{formatINR(d.stock.value)}</dd></div>
                  <p className="text-xs text-muted-foreground">{t('dash.atToday', { rate: formatRate(d.marketRate) })}</p>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
