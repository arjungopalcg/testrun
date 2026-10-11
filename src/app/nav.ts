import {
  Banknote, CalendarCheck, ClipboardList, Droplets, Factory, LayoutDashboard, ListChecks,
  Receipt, Settings, Shovel, Trees, Users, type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/store/ui';

export interface NavItem {
  key: string;          // i18n key under nav.* and pages.*
  path: string;
  icon: LucideIcon;
  roles: Role[];        // who sees it in navigation
  milestone: number;    // when the screen gets real content
}

export const navItems: NavItem[] = [
  { key: 'dashboard', path: '/', icon: LayoutDashboard, roles: ['owner'], milestone: 7 },
  { key: 'today', path: '/today', icon: CalendarCheck, roles: ['owner', 'supervisor'], milestone: 4 },
  { key: 'fields', path: '/fields', icon: Trees, roles: ['owner', 'supervisor'], milestone: 3 },
  { key: 'tasks', path: '/tasks', icon: ListChecks, roles: ['owner', 'supervisor'], milestone: 3 },
  { key: 'workers', path: '/workers', icon: Users, roles: ['owner', 'supervisor'], milestone: 3 },
  { key: 'tappingLog', path: '/tapping-log', icon: Droplets, roles: ['owner', 'supervisor'], milestone: 4 },
  { key: 'payments', path: '/payments', icon: Banknote, roles: ['owner'], milestone: 5 },
  { key: 'fieldWork', path: '/field-work', icon: Shovel, roles: ['owner', 'supervisor'], milestone: 6 },
  { key: 'expenses', path: '/expenses', icon: Receipt, roles: ['owner'], milestone: 6 },
  { key: 'sales', path: '/sales', icon: Factory, roles: ['owner'], milestone: 6 },
  { key: 'settings', path: '/settings', icon: Settings, roles: ['owner', 'supervisor'], milestone: 2 },
];

/** First four items per role go in the mobile bottom tab bar; the rest live under "More". */
export const bottomTabKeys: Record<Role, string[]> = {
  owner: ['dashboard', 'today', 'payments', 'expenses'],
  supervisor: ['today', 'tappingLog', 'fieldWork', 'workers'],
};

export const homePath: Record<Role, string> = { owner: '/', supervisor: '/today' };

export const moreIcon = ClipboardList;

export const itemsForRole = (role: Role) => navItems.filter((i) => i.roles.includes(role));
