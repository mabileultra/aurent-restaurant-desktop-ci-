import { useCallback, useState } from 'react';

export function usePosPaymentFlow(closePaymentNav, setPosPane) {
  const [payOpen, setPayOpen] = useState(false);
  const [payFlowOptions, setPayFlowOptions] = useState(null);

  const handleClosePayment = () => {
    closePaymentNav();
  };

  const handleOpenPaymentFlow = (options) => {
    setPayFlowOptions(options);
    setPosPane('register');
    setPayOpen(true);
  };

  const handlePayFlowClosed = useCallback(() => {
    setPayFlowOptions(null);
  }, []);

  return {
    payOpen,
    setPayOpen,
    payFlowOptions,
    handleClosePayment,
    handleOpenPaymentFlow,
    handlePayFlowClosed,
  };
}
