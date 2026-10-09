import { create } from "zustand";
import { defaultReportRange } from "@/lib/incidents/report-mappers";
import type { GpsFix } from "./tracking";
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

interface RoutesPageState {
  formOpen: boolean;
  editingId: number | null;
  openNew: () => void;
  openEdit: (id: number) => void;
  close: () => void;
}

export const useRoutesPage = create<RoutesPageState>()((set) => ({
  formOpen: false,
  editingId: null,
  openNew: () => set({ formOpen: true, editingId: null }),
  openEdit: (id) => set({ formOpen: true, editingId: id }),
  close: () => set({ formOpen: false, editingId: null }),
}));

interface CoverageSelectionState {
  selectedId: number | null;
  toggle: (id: number) => void;
}

export const useCoverageSelection = create<CoverageSelectionState>()((set) => ({
  selectedId: null,
  toggle: (id) => set((state) => ({ selectedId: state.selectedId === id ? null : id })),
}));

interface CoverageReportState {
  from: string;
  to: string;
  setRange: (change: Partial<{ from: string; to: string }>) => void;
}

export const useCoverageReportRange = create<CoverageReportState>()((set) => ({
  ...defaultReportRange(new Date()),
  setRange: (change) => set(change),
}));

interface ReplayScrubState {
  patrolId: number | null;
  index: number;
  scrub: (patrolId: number, index: number) => void;
}

export const useReplayScrub = create<ReplayScrubState>()((set) => ({
  patrolId: null,
  index: 0,
  scrub: (patrolId, index) => set({ patrolId, index }),
}));

interface TrackerState {
  fix: GpsFix | null;
  gpsLost: boolean;
  setFix: (fix: GpsFix | null) => void;
  setGpsLost: (gpsLost: boolean) => void;
}

export const useTracker = create<TrackerState>()((set) => ({
  fix: null,
  gpsLost: false,
  setFix: (fix) => set({ fix }),
  setGpsLost: (gpsLost) => set({ gpsLost }),
}));

export type RangerPanel = "waypoint" | "end";

interface RangerPatrolPageState {
  panel: RangerPanel | null;
  notice: string | null;
  setPanel: (panel: RangerPanel | null) => void;
  setNotice: (notice: string | null) => void;
}

export const useRangerPatrolPage = create<RangerPatrolPageState>()((set) => ({
  panel: null,
  notice: null,
  setPanel: (panel) => set({ panel, notice: null }),
  setNotice: (notice) => set({ notice, panel: null }),
}));
