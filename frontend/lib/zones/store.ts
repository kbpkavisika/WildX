import { create } from "zustand";
import type { LatLng } from "@/lib/patrols/types";

interface ZonesPageState {
  selectedId: number | null;
  formOpen: boolean;
  editingId: number | null;
  draft: LatLng[][] | null;
  toggle: (id: number) => void;
  openNew: () => void;
  openEdit: (id: number) => void;
  close: () => void;
  setDraft: (draft: LatLng[][] | null) => void;
}

export const useZonesPage = create<ZonesPageState>()((set) => ({
  selectedId: null,
  formOpen: false,
  editingId: null,
  draft: null,
  toggle: (id) => set((state) => ({ selectedId: state.selectedId === id ? null : id })),
  openNew: () => set({ formOpen: true, editingId: null, draft: null }),
  openEdit: (id) => set({ formOpen: true, editingId: id, selectedId: id, draft: null }),
  close: () => set({ formOpen: false, editingId: null, draft: null }),
  setDraft: (draft) => set({ draft }),
}));
