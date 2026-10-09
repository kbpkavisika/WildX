import { create } from "zustand";
import { defaultReportRange } from "@/lib/incidents/report-mappers";

interface AlertReportState {
  from: string;
  to: string;
  setRange: (change: Partial<{ from: string; to: string }>) => void;
}

export const useAlertReportRange = create<AlertReportState>()((set) => ({
  ...defaultReportRange(new Date()),
  setRange: (change) => set(change),
}));
