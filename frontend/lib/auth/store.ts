import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/enums";

const AUTH_STORAGE_KEY = "wildx-auth";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  parkId: number | null;
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  setSession: (token: string, user: SessionUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    { name: AUTH_STORAGE_KEY },
  ),
);
