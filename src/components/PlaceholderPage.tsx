import { Hammer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { navItems } from '@/app/nav';
import { EmptyState } from './EmptyState';
import { PageHeader } from './PageHeader';

/** Stand-in for screens whose content arrives in a later milestone. */
export function PlaceholderPage({ navKey }: { navKey: string }) {
  const { t } = useTranslation();
  const item = navItems.find((i) => i.key === navKey)!;
  return (
    <>
      <PageHeader title={t(`nav.${navKey}`)} description={t(`pages.${navKey}`)} />
      <EmptyState
        icon={item.icon ?? Hammer}
        title={t('common.comingSoon', { n: item.milestone })}
        body={t('common.comingSoonBody')}
      />
    </>
  );
}
