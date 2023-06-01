import { create } from "zustand";


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

export const useKeysStore = create<KeyPair & KeyPairUpdate>()(
  devtools(
    persist(
      (set) => ({
        publicKey: "",
        updatePublicKey: (value) => set((state) => ({ publicKey: value })),
        privateKey: "",
        updatePrivateKey: (value) => set((state) => ({ privateKey: value })),
      }),
      {
        name: "keys-storage",
      },
    ),
  ),
);
