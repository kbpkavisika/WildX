import { create } from "zustand";

export type RangerPanel = "waypoint" | "end";

interface RangerPatrolPageState {
  panel: RangerPanel | null;
  notice: string | null;
  error: string | null;
  setPanel: (panel: RangerPanel | null) => void;
  setNotice: (notice: string | null) => void;
  setError: (error: string | null) => void;
}

export const useRangerPatrolPage = create<RangerPatrolPageState>()((set) => ({
  panel: null,
  notice: null,
  error: null,
  setPanel: (panel) => set({ panel, notice: null, error: null }),
  setNotice: (notice) => set({ notice, panel: null, error: null }),
  setError: (error) => set({ error }),
}));
