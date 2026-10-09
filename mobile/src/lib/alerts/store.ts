import { create } from "zustand";

interface AlertsPageState {
  selectedId: number | null;
  resolving: boolean;
  notice: string | null;
  toggle: (id: number) => void;
  setResolving: (resolving: boolean) => void;
  setNotice: (notice: string | null) => void;
}

export const useAlertsPage = create<AlertsPageState>()((set) => ({
  selectedId: null,
  resolving: false,
  notice: null,
  toggle: (id) => set((state) => ({ selectedId: state.selectedId === id ? null : id, resolving: false, notice: null })),
  setResolving: (resolving) => set({ resolving, notice: null }),
  setNotice: (notice) => set({ notice, resolving: false }),
}));
