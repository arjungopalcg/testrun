import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/ui';
import { homePath, navItems } from './nav';

/** When the role changes, leave screens the new role can't see and land on its home. */
export function RoleRedirect() {
  const role = useUIStore((s) => s.role);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const prevRole = useRef(role);

  useEffect(() => {
    const current = navItems.find((i) => (i.path === '/' ? pathname === '/' : pathname.startsWith(i.path)));
    const roleChanged = prevRole.current !== role;
    prevRole.current = role;
    if (current && !current.roles.includes(role)) navigate(homePath[role], { replace: true });
    else if (roleChanged && pathname === '/' && role === 'supervisor') navigate(homePath[role], { replace: true });
  }, [role, pathname, navigate]);

  return null;
}
