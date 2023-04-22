import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { AuthState } from "./Types";

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        isSignedIn: false,
        signIn: () => set((state) => ({ isSignedIn: true })),
        signOut: () => set((state) => ({ isSignedIn: false })),
      }),
      {
        name: "auth-storage",
      },
    ),
  ),
);
