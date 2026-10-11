import { createBrowserRouter, createMemoryRouter, Outlet, type RouteObject } from 'react-router-dom';
import DashboardPage from '@/features/dashboard/DashboardPage';
import TodayPage from '@/features/today/TodayPage';
import FieldsPage from '@/features/fields/FieldsPage';
import TasksPage from '@/features/tasks/TasksPage';
import WorkersPage from '@/features/workers/WorkersPage';
import TappingLogPage from '@/features/tapping/TappingLogPage';
import PaymentsPage from '@/features/payments/PaymentsPage';
import FieldWorkPage from '@/features/fieldwork/FieldWorkPage';
import ExpensesPage from '@/features/expenses/ExpensesPage';
import SalesPage from '@/features/sales/SalesPage';
import SettingsPage from '@/features/settings/SettingsPage';
import { AppShell } from './AppShell';
import { NotFound } from './NotFound';
import { RoleRedirect } from './RoleRedirect';

const routes: RouteObject[] = [
  {
    element: (
      <>
        <RoleRedirect />
        <Outlet />
      </>
    ),
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'today', element: <TodayPage /> },
          { path: 'fields', element: <FieldsPage /> },
          { path: 'tasks', element: <TasksPage /> },
          { path: 'workers', element: <WorkersPage /> },
          { path: 'tapping-log', element: <TappingLogPage /> },
          { path: 'payments', element: <PaymentsPage /> },
          { path: 'field-work', element: <FieldWorkPage /> },
          { path: 'expenses', element: <ExpensesPage /> },
          { path: 'sales', element: <SalesPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
];

// The hosted demo (`npm run build:demo`) runs inside a sandboxed frame where the URL
// can't be used for routing, so it keeps the route in memory instead.
export const router = import.meta.env.VITE_MEMORY_ROUTER ? createMemoryRouter(routes) : createBrowserRouter(routes);
