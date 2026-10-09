import { create } from "zustand";
import { CAMERA_FILTERS, type CameraFilter } from "./types";

interface CameraPageState {
  filter: CameraFilter;
  selectedId: number | null;
  setFilter: (filter: CameraFilter) => void;
  toggle: (id: number) => void;
  focus: (id: number) => void;
}

export const useCameraPage = create<CameraPageState>()((set) => ({
  filter: CAMERA_FILTERS.PENDING,
  selectedId: null,
  setFilter: (filter) => set({ filter, selectedId: null }),
  toggle: (id) => set((state) => ({ selectedId: state.selectedId === id ? null : id })),
  focus: (id) => set({ filter: CAMERA_FILTERS.ALL, selectedId: id }),
}));
