import { useLayoutEffect, useRef } from 'react';

/** Overlay оплаты: открытие сразу, закрытие без задержки (касса). */
export function usePayFlowTransition(payOpen, onFlowClosed) {
  const prevPayOpenRef = useRef(payOpen);

  useLayoutEffect(() => {
    if (prevPayOpenRef.current && !payOpen) {
      onFlowClosed?.();
    }
    prevPayOpenRef.current = payOpen;
  }, [payOpen, onFlowClosed]);

  return {
    flowVisible: payOpen,
    isClosing: false,
    flowActive: payOpen,
  };
}
