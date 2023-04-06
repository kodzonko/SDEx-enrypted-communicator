import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface AuthState {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
}

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
