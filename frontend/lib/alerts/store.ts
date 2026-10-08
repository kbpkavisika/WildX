import { create } from "zustand";
import { ALERT_FILTERS, type AlertFilter } from "./types";

interface AlertsPageState {
  filter: AlertFilter;
  selectedId: number | null;
  setFilter: (filter: AlertFilter) => void;
  toggle: (id: number) => void;
}

export const useAlertsPage = create<AlertsPageState>()((set) => ({
  filter: ALERT_FILTERS.OPEN,
  selectedId: null,
  setFilter: (filter) => set({ filter, selectedId: null }),
  toggle: (id) => set((state) => ({ selectedId: state.selectedId === id ? null : id })),
}));
