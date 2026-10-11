import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { axisProps, chart, tooltipStyle } from '@/components/chartTheme';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CardsSkeleton, Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TFoot, TH, THead, TR } from '@/components/ui/table';
import { isoDate } from '@/lib/dates';
import { formatDay, formatINR, formatKg, formatLitres, formatNumber, formatPct, formatRate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useBatches, useMarketPrices, useSales } from '@/services/queries';
import type { BatchStage } from '@/types';

const STAGES: BatchStage[] = ['drying', 'smoking', 'ready', 'sold'];

export default function SalesPage() {
  const { t } = useTranslation();
  const batches = useBatches();
  const sales = useSales();
  const prices = useMarketPrices();
  const today = prices.data?.at(-1)?.ratePerKg ?? 0;

  const stock = useMemo(() => {
    const s = { drying: 0, smoking: 0, ready: 0 };
    batches.data?.forEach((b) => { if (b.stage !== 'sold') s[b.stage] += b.sheetWeightKg; });
    return s;
  }, [batches.data]);
  const stockKg = stock.drying + stock.smoking + stock.ready;

  const chartData = useMemo(() => {
    const since = isoDate(subDays(new Date(), 180));
    const saleByDate = new Map((sales.data ?? []).filter((s) => s.product === 'RSS4').map((s) => [s.date, s.ratePerKg]));
    return (prices.data ?? []).filter((p) => p.date >= since).map((p) => ({ date: p.date, market: p.ratePerKg, sale: saleByDate.get(p.date) }));
  }, [prices.data, sales.data]);

  const saleRows = [...(sales.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const due = saleRows.reduce((s, x) => s + x.amount - x.amountReceived, 0);

  return (
    <>
      <PageHeader title={t('nav.sales')} description={t('pages.sales')} />
      {batches.isLoading ? <CardsSkeleton /> : (
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t('sales.stockSheets')} value={formatKg(stockKg)} hint={t('sales.stockHint', { drying: formatKg(stock.drying), smoking: formatKg(stock.smoking), ready: formatKg(stock.ready) })} />
          <StatCard label={t('sales.stockValue')} value={formatINR(stockKg * today)} hint={t('sales.atRate', { rate: formatRate(today) })} />
          <StatCard label={t('sales.marketToday')} value={`${formatRate(today)}/kg`} hint="RSS4" />
          <StatCard label={t('sales.balanceDue')} value={formatINR(due)} tone={due > 0 ? 'warning' : 'default'} />
        </div>
      )}

      <section className="mb-8" aria-labelledby="batches-title">
        <h2 id="batches-title" className="mb-3 text-lg font-semibold">{t('sales.batches')}</h2>
        {batches.isLoading ? <TableSkeleton /> : (
          <Table>
            <THead><TR><TH>{t('common.date')}</TH><TH numeric>{t('sales.latexIn')}</TH><TH numeric>{t('log.drc')}</TH><TH numeric>{t('sales.sheets')}</TH><TH numeric>{t('sales.sheetWeight')}</TH><TH>{t('sales.stage')}</TH></TR></THead>
            <TBody>
              {batches.data?.map((b) => (
                <TR key={b.id}>
                  <TD className="whitespace-nowrap">{formatDay(b.date)}</TD>
                  <TD numeric>{formatLitres(b.latexLitres)}</TD>
                  <TD numeric>{formatPct(b.drcPct)}</TD>
                  <TD numeric>{formatNumber(b.sheetsMade)}</TD>
                  <TD numeric>{formatKg(b.sheetWeightKg)}</TD>
                  <TD>
                    <ol className="flex items-center gap-1" aria-label={t(`batchStage.${b.stage}`)}>
                      {STAGES.map((s, i) => {
                        const reached = STAGES.indexOf(b.stage) >= i;
                        return (
                          <li key={s} className="flex items-center gap-1">
                            {i > 0 && <span className={cn('h-0.5 w-3', reached ? 'bg-primary' : 'bg-border')} aria-hidden />}
                            <span className={cn('rounded-full px-2 py-0.5 text-xs', s === b.stage ? 'bg-primary text-primary-foreground' : reached ? 'text-primary' : 'text-muted-foreground')}>{t(`batchStage.${s}`)}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      <section className="mb-8" aria-labelledby="price-title">
        <h2 id="price-title" className="mb-1 text-lg font-semibold">{t('sales.priceChart')}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{t('sales.priceChartHint')}</p>
        <Card className="p-3">
          {prices.isLoading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={chart.grid} vertical={false} />
                <XAxis dataKey="date" {...axisProps} tickFormatter={(d: string) => format(parseISO(d), 'd MMM')} minTickGap={40} />
                <YAxis {...axisProps} domain={[170, 220]} width={44} tickFormatter={(v: number) => `₹${v}`} />
                <Tooltip {...tooltipStyle} labelFormatter={(d: string) => formatDay(d)} formatter={(v: number, n: string) => [formatRate(v), n === 'market' ? t('sales.market') : t('sales.ourSale')]} />
                <Line type="monotone" dataKey="market" stroke={chart.primary} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Scatter dataKey="sale" fill={chart.secondary} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Card>
      </section>

      <section aria-labelledby="sales-title">
        <h2 id="sales-title" className="mb-3 text-lg font-semibold">{t('sales.sales')}</h2>
        {sales.isLoading ? <TableSkeleton /> : (
          <Table>
            <THead><TR><TH>{t('common.date')}</TH><TH>{t('sales.buyer')}</TH><TH>{t('sales.product')}</TH><TH numeric>{t('sales.qty')}</TH><TH numeric>{t('sales.rate')}</TH><TH numeric>{t('pay.amount')}</TH><TH numeric>{t('sales.received')}</TH><TH numeric>{t('sales.balance')}</TH></TR></THead>
            <TBody>
              {saleRows.map((s) => (
                <TR key={s.id}>
                  <TD className="whitespace-nowrap">{formatDay(s.date)}</TD>
                  <TD className="whitespace-nowrap">{s.buyer}</TD>
                  <TD><Badge>{t(`product.${s.product}`)}</Badge></TD>
                  <TD numeric>{formatKg(s.quantityKg)}</TD>
                  <TD numeric>{formatRate(s.ratePerKg)}</TD>
                  <TD numeric>{formatINR(s.amount)}</TD>
                  <TD numeric>{formatINR(s.amountReceived)}</TD>
                  <TD numeric className={s.amount > s.amountReceived ? 'font-semibold text-destructive' : 'text-muted-foreground'}>{formatINR(s.amount - s.amountReceived)}</TD>
                </TR>
              ))}
            </TBody>
            <TFoot><TR><TD colSpan={5}>{t('common.total')}</TD><TD numeric>{formatINR(saleRows.reduce((s, x) => s + x.amount, 0))}</TD><TD numeric>{formatINR(saleRows.reduce((s, x) => s + x.amountReceived, 0))}</TD><TD numeric>{formatINR(due)}</TD></TR></TFoot>
          </Table>
        )}
      </section>
    </>
  );
}
