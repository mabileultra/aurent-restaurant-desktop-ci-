import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ShellOutlet from '../shared/ShellOutlet';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { visiblePlatformNavGrouped } from '../../features/platform/nav/platformNav';
import SuperAdminTopHeader from './SuperAdminTopHeader';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminMobileDrawer from './SuperAdminMobileDrawer';
import '../../styles/aa/tokens.css';
import '../../styles/aa/components.css';

/**
 * Aurent Admin — Super-admin (platform) karkasi.
 * Grid: chapda sidebar 248px, o‘ngda kontent (bg-aa-canvas, max-w 1360px).
 */
export default function SuperAdminLayout() {
  const { user } = useAuthStore();
  const { hasModule } = useModuleAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuButtonRef = useRef(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('app-area--platform');
    return () => {
      root.classList.remove('app-area--platform');
    };
  }, []);

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

  // Faol guruhni aniqlash va ochiqligini ta'minlash
  const activeGroupId = useMemo(() => {
    for (const group of groupedLinks) {
      if (
        group.items.some(
          (item) =>
            location.pathname === item.to ||
            location.pathname.startsWith(`${item.to}/`)
        )
      ) {
        return group.id;
      }
    }
    return null;
  }, [groupedLinks, location.pathname]);

  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) =>
        prev[activeGroupId] ? prev : { ...prev, [activeGroupId]: true }
      );
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
    <div className="flex h-screen overflow-hidden bg-aa-canvas text-aa-ink">
      {/* Desktop Sidebar (248px) */}
      <SuperAdminSidebar
        className="hidden aa-desktop:flex"
        groupedLinks={groupedLinks}
        openGroups={openGroups}
        toggleGroup={toggleGroup}
        location={location}
        onCloseMobileNav={() => setMobileNavOpen(false)}
      />

      {/* Mobil uchun drawer va scrim */}
      <SuperAdminMobileDrawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        triggerRef={menuButtonRef}
        groupedLinks={groupedLinks}
        openGroups={openGroups}
        toggleGroup={toggleGroup}
        location={location}
      />

      {/* O‘ng qism: Tepa panel + Kontent */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <SuperAdminTopHeader
          onOpenMobileNav={() => setMobileNavOpen(true)}
          menuButtonRef={menuButtonRef}
          user={user}
          onLogout={handleLogout}
        />

        <main
          className="flex-1 overflow-y-auto bg-aa-canvas"
          data-purpose="main-content"
        >
          <div className="max-w-[1360px] mx-auto p-4 space-y-4 aa-desktop:px-8 aa-desktop:pt-6 aa-desktop:pb-12 aa-desktop:space-y-6">
            <ShellOutlet />
          </div>
        </main>
      </div>
    </div>
  );
}
