import { create } from "zustand";
import { ALERT_FILTERS, type AlertAction, type AlertFilter } from "./types";

interface AlertsPageState {
  filter: AlertFilter;
  selectedId: number | null;
  action: AlertAction | null;
  notice: string | null;
  setFilter: (filter: AlertFilter) => void;
  toggle: (id: number) => void;
  setAction: (action: AlertAction | null) => void;
  setNotice: (notice: string | null) => void;
}

export const useAlertsPage = create<AlertsPageState>()((set) => ({
  filter: ALERT_FILTERS.OPEN,
  selectedId: null,
  action: null,
  notice: null,
  setFilter: (filter) => set({ filter, selectedId: null, action: null, notice: null }),
  toggle: (id) => set((state) => ({ selectedId: state.selectedId === id ? null : id, action: null, notice: null })),
  setAction: (action) => set({ action, notice: null }),
  setNotice: (notice) => set({ notice, action: null }),
}));
