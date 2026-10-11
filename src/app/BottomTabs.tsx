import { useEffect, useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { bottomTabKeys, itemsForRole } from './nav';

const tabClass = (active: boolean) =>
  cn(
    'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
    active ? 'text-primary' : 'text-muted-foreground',
  );

export function BottomTabs() {
  const { t } = useTranslation();
  const role = useUIStore((s) => s.role);
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname, role]);

  const items = itemsForRole(role);
  const tabs = bottomTabKeys[role].map((k) => items.find((i) => i.key === k)!).filter(Boolean);
  const rest = items.filter((i) => !bottomTabKeys[role].includes(i.key));
  const moreActive = rest.some((i) => (i.path === '/' ? pathname === '/' : pathname.startsWith(i.path)));

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMoreOpen(false)} aria-hidden />
      )}
      {moreOpen && (
        <div
          id="more-menu"
          className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-50 rounded-t-xl border-t bg-card p-3 shadow-lg lg:hidden"
        >
          <ul className="grid grid-cols-3 gap-2">
            {rest.map(({ key, path, icon: Icon }) => (
              <li key={key}>
                <NavLink
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg p-2 text-center text-xs font-medium',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                    )
                  }
                >
                  <Icon className="size-6" aria-hidden />
                  {t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {tabs.map(({ key, path, icon: Icon }) => (
          <NavLink key={key} to={path} end={path === '/'} className={({ isActive }) => tabClass(isActive && !moreOpen)}>
            <Icon className="size-6" aria-hidden />
            <span className="max-w-full truncate">{t(`nav.${key}`)}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={tabClass(moreOpen || moreActive)}
          aria-expanded={moreOpen}
          aria-controls="more-menu"
          onClick={() => setMoreOpen((o) => !o)}
        >
          {moreOpen ? <X className="size-6" aria-hidden /> : <MoreHorizontal className="size-6" aria-hidden />}
          <span>{t('nav.more')}</span>
        </button>
      </nav>
    </>
  );
}
