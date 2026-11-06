import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import ShellPageSkeleton from './ShellPageSkeleton';

/**
 * Каскад: shell уже на экране, lazy-страница грузится только в Outlet.
 * Внешний Suspense Routes больше не гасит сайдбар.
 */
export default function ShellOutlet() {
  return (
    <Suspense fallback={<ShellPageSkeleton />}>
      <Outlet />
    </Suspense>
  );
}
