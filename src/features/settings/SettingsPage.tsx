import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, Input, Select } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR } from '@/lib/format';
import { resetDemoData, updateSettings } from '@/services/api';
import { useEstate, useSettings } from '@/services/queries';
import { useUIStore } from '@/store/ui';
import type { Language } from '@/i18n';
import type { Settings } from '@/types';

export default function SettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const estate = useEstate();
  const settings = useSettings();
  const { language, setLanguage } = useUIStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const update = useMutation({
    mutationFn: (patch: Partial<Settings>) => updateSettings(patch),
    onSuccess: () => { void qc.invalidateQueries(); toast.success(t('settings.saved')); },
  });
  const reset = useMutation({
    mutationFn: resetDemoData,
    onSuccess: () => { void qc.invalidateQueries(); setConfirmReset(false); toast.success(t('settings.resetDone')); },
  });
  const s = settings.data;

  return (
    <>
      <PageHeader title={t('nav.settings')} description={t('pages.settings')} />
      <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('settings.estate')}</CardTitle></CardHeader>
          <CardContent>
            {estate.data ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">{t('settings.estateName')}</dt><dd>{estate.data.name}</dd>
                <dt className="text-muted-foreground">{t('settings.location')}</dt><dd>{estate.data.location}</dd>
                <dt className="text-muted-foreground">{t('settings.area')}</dt><dd>{estate.data.totalAreaAcres} {t('settings.acres')}</dd>
                <dt className="text-muted-foreground">{t('settings.owner')}</dt><dd>{estate.data.ownerName}</dd>
              </dl>
            ) : <Skeleton className="h-24" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('settings.preferences')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">{t('header.language')}</span>
              <Segmented<Language> label={t('header.language')} value={language} onChange={setLanguage} options={[{ value: 'en', label: 'English' }, { value: 'ml', label: 'മലയാളം' }]} />
            </div>
            <p className="text-sm text-muted-foreground">{t('settings.currencyFormat')}: <span className="tabular text-foreground">{formatINR(124500)}</span></p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t('settings.defaults')}</CardTitle></CardHeader>
          <CardContent>
            {s ? (
              <form key={JSON.stringify(s)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                update.mutate({
                  defaultDrcPct: Number(f.get('drc')), latexDensity: Number(f.get('density')), payPeriod: f.get('period') as Settings['payPeriod'],
                  rainOffAllowance: Number(f.get('rain')), defaultAdvanceDeduction: Number(f.get('deduction')),
                });
              }}>
                <FormField label={t('settings.defaultDrc')} htmlFor="s-drc"><Input id="s-drc" name="drc" inputMode="decimal" defaultValue={s.defaultDrcPct} /></FormField>
                <FormField label={t('settings.density')} htmlFor="s-density"><Input id="s-density" name="density" inputMode="decimal" defaultValue={s.latexDensity} /></FormField>
                <FormField label={t('settings.payPeriod')} htmlFor="s-period">
                  <Select id="s-period" name="period" defaultValue={s.payPeriod}>{(['weekly', 'fortnightly', 'monthly'] as const).map((p) => <option key={p} value={p}>{t(`settings.${p}`)}</option>)}</Select>
                </FormField>
                <FormField label={t('settings.rainOffAllowance')} htmlFor="s-rain"><Input id="s-rain" name="rain" inputMode="numeric" defaultValue={s.rainOffAllowance} /></FormField>
                <FormField label={t('settings.advanceDeduction')} htmlFor="s-deduction"><Input id="s-deduction" name="deduction" inputMode="numeric" defaultValue={s.defaultAdvanceDeduction} /></FormField>
                <div className="flex items-end"><Button type="submit" disabled={update.isPending}>{t('common.save')}</Button></div>
              </form>
            ) : <Skeleton className="h-32" />}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t('settings.demoData')}</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <p className="flex-1 text-sm text-muted-foreground">{t('settings.demoDataHint')}</p>
            {confirmReset ? (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => reset.mutate()} disabled={reset.isPending}>{t('settings.confirmReset')}</Button>
                <Button variant="ghost" onClick={() => setConfirmReset(false)}>{t('common.cancel')}</Button>
              </div>
            ) : <Button variant="outline" onClick={() => setConfirmReset(true)}><RotateCcw />{t('settings.reset')}</Button>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
