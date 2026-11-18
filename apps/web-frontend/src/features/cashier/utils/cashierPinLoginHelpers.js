import { useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  cashierSessionMatchesCompany,
  resolveCashierCompanyCode,
} from '../../../utils/authLogin';
import { resolveCashierPostLoginPath } from '../../../utils/cashierPostLoginPath';
import { fetchMainAppAccess } from '../../../utils/fetchMainAppAccess';
import { logoutAndResetSession } from '../../../utils/authSession';

export async function resolvePinHomePath(role) {
  if (role === 'WAITER' || role === 'COOK') {
    return {
      path: resolveCashierPostLoginPath(role),
      access: { ok: false, reason: 'restaurant_role' },
      fetchError: false,
    };
  }
  const { access, businessPayload, fetchError } = await fetchMainAppAccess(role);
  return {
    path: resolveCashierPostLoginPath(role, businessPayload?.defaultTypeCode),
    access,
    fetchError,
  };
}

export function useCashierPinSessionAutoRedirect({
  hasHydrated,
  token,
  user,
  searchParams,
  freshLoginRef,
  logout,
  setPin,
  navigate,
  t,
}) {
  useEffect(() => {
    if (!hasHydrated || !token || !['CASHIER', 'WAITER'].includes(user?.role)) return;
    if (freshLoginRef.current) return;

    let cancelled = false;
    (async () => {
      const expectedCode = await resolveCashierCompanyCode(searchParams);
      if (cancelled || freshLoginRef.current) return;
      if (!cashierSessionMatchesCompany(user, expectedCode)) {
        logout();
        setPin('');
        toast.error(
          t('cashierLogin.companyChanged', {
            defaultValue: 'Код компании изменён — войдите с PIN снова',
          })
        );
        return;
      }
      if (!window.location.pathname.startsWith('/cashier/login')) return;

      const { path, access, fetchError } = await resolvePinHomePath(user.role);
      if (cancelled || freshLoginRef.current) return;
      if (!access.ok && !fetchError) {
        logoutAndResetSession();
        toast.error(t('login.wrongAppUnknown'));
        return;
      }
      navigate(path.startsWith('/cashier') ? path : '/cashier', { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, token, user, navigate, logout, searchParams, freshLoginRef, setPin, t]);
}

export function useCashierPinKeyboard({ loading, pressDigit, backspace, submit }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (loading) return;
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        pressDigit(e.key);
        return;
      }
      if (e.key === 'Backspace') {
        backspace();
        return;
      }
      if (e.key === 'Enter') {
        submit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loading, pressDigit, backspace, submit]);
}
