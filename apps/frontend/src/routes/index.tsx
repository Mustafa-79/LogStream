import type { RouteObject } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useRoutes } from 'react-router-dom';

import DashboardLayout from '../layout/DashboardLayout';
import Analytics from '../pages/Analytics';
import Dashboard from '../pages/Dashboard';
import Applications from '../pages/Applications';
import UserGroups from '../pages/UserGroups';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import Login from '../pages/Login';

// Type-safe route array
const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/analytics',
    element: <Analytics />,
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
              <Dashboard />
        ),
      },
      {
        path: 'analytics',
        element: (
            <Analytics />
        ),
      },
      {
        path: 'settings',
        element: (
          <Settings />
        ),
      },
      {
        path: 'applications',
        element: (
          <Applications />
        ),
      },
      {
        path: 'user-groups',
        element: (
          <UserGroups />
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
        <NotFound />
    ),
  },
];

export default function ThemeRoutes(): ReactElement | null {
  return useRoutes(routes);
}
