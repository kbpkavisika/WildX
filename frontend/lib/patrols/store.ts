import { create } from "zustand";
import { PATROL_FILTERS, type PatrolFilter } from "./types";

interface PatrolSelectionState {
  selectedId: number | null;
  toggle: (id: number) => void;
}

export const usePatrolSelection = create<PatrolSelectionState>()((set) => ({
  selectedId: null,
  toggle: (id) => set((state) => ({ selectedId: state.selectedId === id ? null : id })),
}));

interface PatrolsPageState {
  filter: PatrolFilter;
  formOpen: boolean;
  setFilter: (filter: PatrolFilter) => void;
  setFormOpen: (open: boolean) => void;
}

export const usePatrolsPage = create<PatrolsPageState>()((set) => ({
  filter: PATROL_FILTERS.ALL,
  formOpen: false,
  setFilter: (filter) => set({ filter }),
  setFormOpen: (formOpen) => set({ formOpen }),
}));
