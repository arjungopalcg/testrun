import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';

export function SearchBar({ value, onChange, id = 'search' }: { value: string; onChange: (v: string) => void; id?: string }) {
  const { t } = useTranslation();
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={t('common.search')} aria-label={t('common.search')} className="pl-9" />
    </div>
  );
}
