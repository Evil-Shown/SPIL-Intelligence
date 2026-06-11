import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  neuralPulse: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarMobileOpen: (open: boolean) => void;
  triggerNeuralPulse: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  neuralPulse: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
  triggerNeuralPulse: () => {
    set({ neuralPulse: true });
    setTimeout(() => set({ neuralPulse: false }), 800);
  },
}));
