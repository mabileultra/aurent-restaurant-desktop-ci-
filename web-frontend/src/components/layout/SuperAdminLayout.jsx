import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ShellOutlet from '../shared/ShellOutlet';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { visiblePlatformNavGrouped } from '../../features/platform/nav/platformNav';
import SuperAdminTopHeader from './SuperAdminTopHeader';
import SuperAdminSidebar from './SuperAdminSidebar';

export default function SuperAdminLayout() {
  const { user } = useAuthStore();
  const { hasModule } = useModuleAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const groupedLinks = useMemo(
    () => visiblePlatformNavGrouped(user?.role, hasModule),
    [user?.role, hasModule]
  );

  const [openGroups, setOpenGroups] = useState({
    main: true,
    finance: true,
    management: true,
  });

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? true),
    }));
  };

  // Find active group and ensure it's open
  const activeGroupId = useMemo(() => {
    for (const group of groupedLinks) {
      if (group.items.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))) {
        return group.id;
      }
    }
    return null;
  }, [groupedLinks, location.pathname]);

  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => (prev[activeGroupId] ? prev : { ...prev, [activeGroupId]: true }));
    }
  }, [activeGroupId, location.pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logoutAndResetSession();
    navigate('/login');
  };

  return (
    <div className="platform-shell admin-shell flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <SuperAdminTopHeader
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Container: Sidebar + Outlet */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <SuperAdminSidebar
          mobileNavOpen={mobileNavOpen}
          onCloseMobileNav={() => setMobileNavOpen(false)}
          groupedLinks={groupedLinks}
          openGroups={openGroups}
          toggleGroup={toggleGroup}
          location={location}
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main
          className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-hidden"
          data-purpose="main-content"
        >
          <div className="admin-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
            <ShellOutlet />
          </div>
        </main>
      </div>
    </div>
  );
}
