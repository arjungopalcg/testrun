import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import { useUIStore } from '@/store/ui';
import { BottomTabs } from './BottomTabs';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const { i18n } = useTranslation();
  const { language, theme } = useUIStore();

  useEffect(() => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [i18n, language]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-4 py-6 pb-28 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomTabs />
      <Toaster position="top-center" theme={theme} richColors />
    </div>
  );
}
