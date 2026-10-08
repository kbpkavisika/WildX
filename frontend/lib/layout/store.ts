import { create } from "zustand";

interface NavState {
  collapsed: Record<string, boolean>;
  toggle: (group: string) => void;
}

export const useNavStore = create<NavState>()((set) => ({
  collapsed: {},
  toggle: (group) => set((state) => ({ collapsed: { ...state.collapsed, [group]: !state.collapsed[group] } })),
}));
