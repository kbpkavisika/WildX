import { create } from "zustand";

export type TaskAction = "complete" | "decline";

interface DispatchTaskState {
  open: { dispatchId: number; action: TaskAction } | null;
  notice: string | null;
  openAction: (dispatchId: number, action: TaskAction) => void;
  close: () => void;
  setNotice: (notice: string | null) => void;
  reset: () => void;
}

export const useDispatchTaskPage = create<DispatchTaskState>()((set) => ({
  open: null,
  notice: null,
  openAction: (dispatchId, action) => set({ open: { dispatchId, action }, notice: null }),
  close: () => set({ open: null }),
  setNotice: (notice) => set({ notice, open: null }),
  reset: () => set({ open: null, notice: null }),
}));
