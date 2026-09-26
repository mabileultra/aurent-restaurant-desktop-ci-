import { useCallback, useEffect, useRef, useState } from 'react';
import PlatformModuleAccessUserRow from './PlatformModuleAccessUserRow';

export const MODULE_ACCESS_USERS_PAGE_SIZE = 30;

export default function PlatformModuleAccessUsersList({
  t,
  usersLoading,
  filteredUsers,
  listResetKey,
  selectedUserId,
  onSelectUser,
  selectedUserIds,
  onToggleUserSelection,
}) {
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(MODULE_ACCESS_USERS_PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(MODULE_ACCESS_USERS_PAGE_SIZE);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [listResetKey]);

  const total = filteredUsers.length;
  const visibleUsers = filteredUsers.slice(0, visibleCount);
  const hasMore = visibleCount < total;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + MODULE_ACCESS_USERS_PAGE_SIZE, total));
  }, [total]);

  useEffect(() => {
    if (!hasMore || usersLoading) return undefined;
    const node = sentinelRef.current;
    const root = scrollRef.current;
    if (!node || !root) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { root, rootMargin: '80px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, usersLoading, loadMore, visibleUsers.length]);

  return (
    <div
      ref={scrollRef}
      className="module-access-panel__body max-h-[min(70vh,520px)] overflow-y-auto"
    >
      {usersLoading ? (
        <p className="p-4 text-sm text-slate-500">{t('common.loading')}</p>
      ) : total === 0 ? (
        <p className="p-4 text-sm text-slate-500">{t('platform.noSearchResults')}</p>
      ) : (
        <>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleUsers.map((u) => (
              <li key={u.userId} className="flex items-stretch">
                <label className="flex items-center px-3">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.has(u.userId)}
                    onChange={() => onToggleUserSelection(u.userId)}
                  />
                </label>
                <PlatformModuleAccessUserRow
                  t={t}
                  user={u}
                  selected={selectedUserId === u.userId}
                  onSelect={onSelectUser}
                />
              </li>
            ))}
          </ul>
          {hasMore ? <div ref={sentinelRef} className="h-1" aria-hidden /> : null}
          <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-800">
            {t('platform.moduleAccess.shownOfTotal', {
              shown: visibleUsers.length,
              total,
            })}
          </p>
        </>
      )}
    </div>
  );
}
