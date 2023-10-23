import { create } from "zustand";
import { AuthState } from "../Types";

export const useAuthStore = create<AuthState>((set) => ({
    isSignedIn: false,
    signIn: () => set(() => ({ isSignedIn: true })),
    signOut: () => set(() => ({ isSignedIn: false })),
}));
