import { create } from "zustand";

interface UsersPageState {
  formOpen: boolean;
  editingId: number | null;
  openNew: () => void;
  openEdit: (id: number) => void;
  close: () => void;
}

export const useUsersPage = create<UsersPageState>()((set) => ({
  formOpen: false,
  editingId: null,
  openNew: () => set({ formOpen: true, editingId: null }),
  openEdit: (editingId) => set({ formOpen: true, editingId }),
  close: () => set({ formOpen: false, editingId: null }),
}));
