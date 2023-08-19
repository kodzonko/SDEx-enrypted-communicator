import { create } from "zustand";
import { KeyPairState } from "../Types";

export const useKeyPairStore = create<KeyPairState>((set) => ({
  publicKey: "",
  privateKey: "",
  setPublicKey: (publicKey: string) => set(() => ({ publicKey })),
  setPrivateKey: (privateKey: string) => set(() => ({ privateKey })),
}));
