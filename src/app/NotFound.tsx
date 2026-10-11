import { MapPinOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={MapPinOff}
      title={t('common.notFound')}
      action={<Button asChild><Link to="/">{t('common.goHome')}</Link></Button>}
    />
  );
}
