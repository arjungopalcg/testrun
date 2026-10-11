import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/i18n';

export type Role = 'owner' | 'supervisor';
export type Theme = 'light' | 'dark';

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
      theme: typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      selectedEstateId: null,
      setRole: (role) => set({ role }),
      setLanguage: (language) => set({ language }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setSelectedEstateId: (selectedEstateId) => set({ selectedEstateId }),
    }),
    { name: 'rpm-ui' },
  ),
);
