import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/i18n';

export type Role = 'owner' | 'supervisor';
export type Theme = 'light' | 'dark';

// Honour a host-set data-theme (e.g. when embedded), then the OS preference.
function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const host = document.documentElement.dataset.theme;
  if (host === 'dark' || host === 'light') return host;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface UIState {
  role: Role;
  language: Language;
  theme: Theme;
  selectedEstateId: string | null;
  setRole: (role: Role) => void;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
  setSelectedEstateId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      role: 'owner',
      language: 'en',
      theme: initialTheme(),
      selectedEstateId: null,
      setRole: (role) => set({ role }),
      setLanguage: (language) => set({ language }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setSelectedEstateId: (selectedEstateId) => set({ selectedEstateId }),
    }),
    { name: 'rpm-ui' },
  ),
);
