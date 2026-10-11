import { useMemo, useState } from 'react';
import { Plus, Receipt, Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField, Input, Select } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TFoot, TH, THead, TR } from '@/components/ui/table';
import { todayIso } from '@/lib/dates';
import { formatDay, formatINR } from '@/lib/format';
import { addExpense } from '@/services/api';
import { byId, keys, useExpenses, useFields } from '@/services/queries';
import type { ExpenseCategory, PaymentMode } from '@/types';

const CATEGORIES: ExpenseCategory[] = ['wages', 'fertilizer', 'chemicals', 'rain_guards', 'tools', 'formic_acid', 'fuel_firewood', 'transport', 'repairs', 'tax', 'misc'];

export default function ExpensesPage() {
  const { t } = useTranslation();
  const expenses = useExpenses();
  const fields = useFields();
  const fieldMap = byId(fields.data);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [fieldId, setFieldId] = useState('');
  const [month, setMonth] = useState('');
  const [adding, setAdding] = useState(false);

  const all = expenses.data ?? [];
  const months = useMemo(() => [...new Set(all.map((e) => e.date.slice(0, 7)))].sort().reverse(), [all]);
  const rows = all.filter((e) =>
    (!category || e.category === category) && (!fieldId || e.fieldId === fieldId) && (!month || e.date.startsWith(month)) &&
    e.description.toLowerCase().includes(q.toLowerCase()));
  const recurring = all.filter((e) => e.recurring === 'monthly');
  const recurringLatest = [...new Map(recurring.map((e) => [e.description, e])).values()];

  return (
    <>
      <PageHeader title={t('nav.expenses')} description={t('pages.expenses')} actions={<Button onClick={() => setAdding((a) => !a)}><Plus />{t('expenses.add')}</Button>} />
      {adding && <AddExpense onDone={() => setAdding(false)} />}
      {recurringLatest.length > 0 && (
        <section className="mb-6" aria-labelledby="rec-title">
          <h2 id="rec-title" className="mb-3 text-lg font-semibold">{t('expenses.recurring')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recurringLatest.map((e) => (
              <Card key={e.id} className="flex items-center gap-3 p-4">
                <Repeat className="size-5 text-primary" aria-hidden />
                <div className="min-w-0 flex-1"><p className="font-medium">{e.description}</p><p className="text-sm text-muted-foreground">{t('expenses.monthly')}</p></div>
                <p className="tabular font-semibold">{formatINR(e.amount)}</p>
              </Card>
            ))}
          </div>
        </section>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBar value={q} onChange={setQ} />
        <Select id="exp-cat" aria-label={t('expenses.category')} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory | '')} className="w-auto">
          <option value="">{t('expenses.allCategories')}</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{t(`expenseCategory.${c}`)}</option>)}
        </Select>
        <Select id="exp-field" aria-label={t('common.field')} value={fieldId} onChange={(e) => setFieldId(e.target.value)} className="w-auto">
          <option value="">{t('common.allFields')}</option>
          {fields.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
        <Select id="exp-month" aria-label={t('common.month')} value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto">
          <option value="">{t('common.allMonths')}</option>
          {months.map((m) => <option key={m} value={m}>{format(parseISO(`${m}-01`), 'MMMM yyyy')}</option>)}
        </Select>
      </div>
      {expenses.isLoading ? <TableSkeleton rows={10} /> : rows.length === 0 ? <EmptyState icon={Receipt} title={t('common.noResults')} /> : (
        <Table>
          <THead><TR><TH>{t('common.date')}</TH><TH>{t('expenses.category')}</TH><TH>{t('expenses.description')}</TH><TH>{t('common.field')}</TH><TH>{t('expenses.mode')}</TH><TH numeric>{t('pay.amount')}</TH></TR></THead>
          <TBody>
            {rows.map((e) => (
              <TR key={e.id} className={e.fromPayroll ? 'bg-muted/40' : ''}>
                <TD className="whitespace-nowrap">{formatDay(e.date)}</TD>
                <TD><Badge tone={e.category === 'wages' ? 'info' : 'neutral'}>{t(`expenseCategory.${e.category}`)}</Badge></TD>
                <TD>{e.description}{e.fromPayroll && <span className="ml-2 text-xs text-muted-foreground">({t('expenses.fromPayroll')})</span>}</TD>
                <TD>{e.fieldId ? fieldMap[e.fieldId]?.name : '—'}</TD>
                <TD>{t(`paymentMode.${e.paymentMode}`)}</TD>
                <TD numeric>{formatINR(e.amount)}</TD>
              </TR>
            ))}
          </TBody>
          <TFoot><TR><TD colSpan={5}>{t('log.totalRows', { count: rows.length })}</TD><TD numeric>{formatINR(rows.reduce((s, e) => s + e.amount, 0))}</TD></TR></TFoot>
        </Table>
      )}
    </>
  );
}

function AddExpense({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fields = useFields();
  const [form, setForm] = useState({ date: todayIso(), category: 'fertilizer' as ExpenseCategory, fieldId: '', amount: '', paymentMode: 'cash' as PaymentMode, description: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const add = useMutation({
    mutationFn: () => addExpense({ date: form.date, category: form.category, fieldId: form.fieldId || undefined, amount: Number(form.amount), paymentMode: form.paymentMode, description: form.description, recurring: null }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: keys.expenses }); void qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success(t('expenses.saved')); onDone(); },
  });
  return (
    <Card className="mb-6 p-4">
      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
        <FormField label={t('common.date')} htmlFor="ne-date"><Input id="ne-date" type="date" value={form.date} onChange={set('date')} required /></FormField>
        <FormField label={t('expenses.category')} htmlFor="ne-cat">
          <Select id="ne-cat" value={form.category} onChange={set('category')}>{CATEGORIES.filter((c) => c !== 'wages').map((c) => <option key={c} value={c}>{t(`expenseCategory.${c}`)}</option>)}</Select>
        </FormField>
        <FormField label={`${t('common.field')} (${t('common.optional')})`} htmlFor="ne-field">
          <Select id="ne-field" value={form.fieldId} onChange={set('fieldId')}><option value="">—</option>{fields.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</Select>
        </FormField>
        <FormField label={t('pay.amount')} htmlFor="ne-amount"><Input id="ne-amount" inputMode="numeric" value={form.amount} onChange={set('amount')} required /></FormField>
        <FormField label={t('expenses.mode')} htmlFor="ne-mode">
          <Select id="ne-mode" value={form.paymentMode} onChange={set('paymentMode')}>{(['cash', 'upi', 'bank'] as const).map((m) => <option key={m} value={m}>{t(`paymentMode.${m}`)}</option>)}</Select>
        </FormField>
        <FormField label={t('expenses.description')} htmlFor="ne-desc"><Input id="ne-desc" value={form.description} onChange={set('description')} required /></FormField>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit" disabled={add.isPending}>{t('common.save')}</Button>
          <Button type="button" variant="ghost" onClick={onDone}>{t('common.cancel')}</Button>
        </div>
      </form>
    </Card>
  );
}
