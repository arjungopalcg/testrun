import { createBrowserRouter, Outlet } from 'react-router-dom';
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

export const router = createBrowserRouter([
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
]);
