import { create } from "zustand";
import type { GpsFix } from "./sampling";

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
