import { createContext, useContext, useMemo, useRef } from 'react';

const PharmacyPosActionsContext = createContext(null);

export function PharmacyPosActionsProvider({ children }) {
  const handlers = useRef({});
  const pay = useRef({});
  const api = useMemo(() => ({
    bind(next) {
      handlers.current = next || {};
    },
    run(name) {
      const fn = handlers.current[name];
      if (typeof fn === 'function') fn();
    },
    bindPay(next) {
      pay.current = next || {};
    },
    runPay(name) {
      const fn = pay.current[name];
      if (typeof fn === 'function') fn();
    },
  }), []);
  return (
    <PharmacyPosActionsContext.Provider value={api}>
      {children}
    </PharmacyPosActionsContext.Provider>
  );
}

export function usePharmacyPosActions() {
  return useContext(PharmacyPosActionsContext);
}
