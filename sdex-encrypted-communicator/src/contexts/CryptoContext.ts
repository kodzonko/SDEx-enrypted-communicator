import { create } from "zustand";
import { CryptoContextState } from "../Types";

export const useCryptoContextStore = create<CryptoContextState>((set) => ({
  sessionKeys: new Map<string, Uint8Array>(),

  addSessionKey: (publicKey: string, sessionKey: Uint8Array): void => {
    set((prev) => ({
      sessionKeys: new Map(prev.sessionKeys).set(publicKey, sessionKey),
    }));
  },
}));
