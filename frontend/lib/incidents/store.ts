import { create } from "zustand";
import { INCIDENT_STATUSES } from "@/lib/enums";
import { ALL, type IncidentQueueFilters } from "./types";

interface IncidentQueueState {
  filters: IncidentQueueFilters;
  setFilter: (change: Partial<IncidentQueueFilters>) => void;
}

export const useIncidentQueue = create<IncidentQueueState>()((set) => ({
  filters: { status: INCIDENT_STATUSES.NEW, typeId: ALL, severity: ALL },
  setFilter: (change) => set((state) => ({ filters: { ...state.filters, ...change } })),
}));

interface IncidentTypesPageState {
  formOpen: boolean;
  editingId: number | null;
  openNew: () => void;
  openEdit: (id: number) => void;
  close: () => void;
}

export const useIncidentTypesPage = create<IncidentTypesPageState>()((set) => ({
  formOpen: false,
  editingId: null,
  openNew: () => set({ formOpen: true, editingId: null }),
  openEdit: (editingId) => set({ formOpen: true, editingId }),
  close: () => set({ formOpen: false, editingId: null }),
}));
