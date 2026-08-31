import { create } from 'zustand';

export const useVirtualKeyboardStore = create((set) => ({
  visible: false,
  target: null,
  show: (target = null) => set({ visible: true, target }),
  hide: () => set({ visible: false, target: null }),
  toggle: () => set((state) => ({ visible: !state.visible })),
}));
