import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Role } from "@/lib/enums";

const SESSION_STORAGE_KEY = "wildx-session";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  parkId: number | null;
}

interface SessionState {
  token: string | null;
  user: SessionUser | null;
  remember: boolean;
  hydrated: boolean;
  setSession: (token: string, user: SessionUser, remember: boolean) => void;
  clearSession: () => void;
}

const secureStorage = createJSONStorage(() => ({
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
}));

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      remember: true,
      hydrated: false,
      setSession: (token, user, remember) => set({ token, user, remember }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: secureStorage,
      partialize: (state) => (state.remember ? { token: state.token, user: state.user, remember: true } : { remember: false }),
      onRehydrateStorage: () => () => useSession.setState({ hydrated: true }),
    },
  ),
);
