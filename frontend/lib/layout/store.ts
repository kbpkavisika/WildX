import { create } from "zustand";

interface NavState {
  expanded: Record<string, boolean>;
  setExpanded: (group: string, value: boolean) => void;
}

export const useNavStore = create<NavState>()((set) => ({
  expanded: {},
  setExpanded: (group, value) => set((state) => ({ expanded: { ...state.expanded, [group]: value } })),
}));
