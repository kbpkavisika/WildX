import { create } from "zustand";

export type TaskAction = "complete" | "decline";

interface DispatchTaskState {
  open: { dispatchId: number; action: TaskAction } | null;
  openAction: (dispatchId: number, action: TaskAction) => void;
  close: () => void;
}

export const useDispatchTaskPage = create<DispatchTaskState>()((set) => ({
  open: null,
  openAction: (dispatchId, action) => set({ open: { dispatchId, action } }),
  close: () => set({ open: null }),
}));
