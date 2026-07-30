/**
 * Global logout confirmation visibility (prompt from any screen).
 */

import { create } from 'zustand';

type LogoutConfirmState = {
  visible: boolean;
  promptLogout: () => void;
  cancelLogout: () => void;
};

/**
 * Opens / closes the shared logout confirmation modal.
 */
export const useLogoutConfirmStore = create<LogoutConfirmState>((set) => ({
  visible: false,
  promptLogout: () => set({ visible: true }),
  cancelLogout: () => set({ visible: false }),
}));
