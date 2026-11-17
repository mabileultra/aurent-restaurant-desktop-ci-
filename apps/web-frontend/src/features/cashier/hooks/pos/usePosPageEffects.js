import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { shouldAutoPromptCashierShift } from '../../../../utils/shouldAutoPromptCashierShift';

export function usePosPageEffects({
  storeId,
  shiftFetched,
  shiftFetching,
  shift,
  shiftQueryError,
  openShiftModal,
  handleGoToCatalog,
  handleGoToRegister,
  searchInputRef,
  returnOpen,
  payOpen,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const shiftAutoPromptedRef = useRef(false);

  useEffect(() => {
    if (shiftAutoPromptedRef.current) return;
    if (
      !storeId ||
      !shouldAutoPromptCashierShift({
        shiftFetched,
        shiftFetching,
        shiftStatus: shift?.status,
        shiftQueryError,
      })
    ) {
      return;
    }
    shiftAutoPromptedRef.current = true;
    openShiftModal();
  }, [storeId, shiftFetched, shiftFetching, shift?.status, shiftQueryError, openShiftModal]);

  useEffect(() => {
    if (location.state?.pane !== 'catalog') return;
    handleGoToCatalog();
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state?.pane, handleGoToCatalog, navigate]);

  useEffect(() => {
    if (location.state?.pane !== 'register') return;
    handleGoToRegister();
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state?.pane, handleGoToRegister, navigate]);

  useEffect(() => {
    if (storeId) searchInputRef.current?.focus();
  }, [storeId, searchInputRef]);

  useEffect(() => {
    if (!returnOpen && !payOpen && storeId) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [returnOpen, payOpen, storeId, searchInputRef]);
}
