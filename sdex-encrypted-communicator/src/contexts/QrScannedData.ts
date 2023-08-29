import { create } from "zustand";
import { QrScannedStoreType } from "../Types";

export const useQrScannedStore = create<QrScannedStoreType>((set) => ({
  publicKey: "",
  setPublicKey: (publicKey: string) => set(() => ({ publicKey })),
}));
