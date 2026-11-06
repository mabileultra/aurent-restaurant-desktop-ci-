import { create } from 'zustand';

/** Minimal session reset stub — retail cart is not used in restaurant SPA. */
export const useCartStore = create((set) => ({
  items: [],
  clearCart: () => set({ items: [] }),
}));
