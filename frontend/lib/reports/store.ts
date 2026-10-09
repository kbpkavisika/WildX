import { create } from "zustand";
import type { TrendUnit } from "./types";

interface TrendUnitState {
  unit: TrendUnit;
  setUnit: (unit: TrendUnit) => void;
}

export const useTrendUnit = create<TrendUnitState>()((set) => ({
  unit: "week",
  setUnit: (unit) => set({ unit }),
}));
