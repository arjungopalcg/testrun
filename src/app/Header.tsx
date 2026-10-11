import { Leaf, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { getEstate } from '@/services/api';
import { useUIStore, type Role } from '@/store/ui';
import type { Language } from '@/i18n';

export function Header() {
  const { t } = useTranslation();
  const { role, setRole, language, setLanguage, theme, toggleTheme } = useUIStore();
  const { data: estate } = useQuery({ queryKey: ['estate'], queryFn: getEstate });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2 lg:hidden">
        <Leaf className="size-6 shrink-0 text-primary" aria-hidden />
        <span className="truncate font-semibold">{t('app.short')}</span>
      </div>
      <div className="hidden min-w-0 lg:block">
        <p className="text-xs text-muted-foreground">{t('header.estate')}</p>
        <p className="truncate font-medium">{estate ? `${estate.name} · ${estate.location}` : '…'}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Segmented<Role>
          label={t('header.role')}
          value={role}
          onChange={setRole}
          options={[
            { value: 'owner', label: t('header.owner') },
            { value: 'supervisor', label: t('header.supervisor') },
          ]}
        />
        <Segmented<Language>
          label={t('header.language')}
          value={language}
          onChange={setLanguage}
          options={[
            { value: 'en', label: 'EN' },
            { value: 'ml', label: 'മല' },
          ]}
        />
        <Button variant="ghost" size="icon" className="size-10" onClick={toggleTheme} aria-label={t('header.theme')}>
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  );
}
