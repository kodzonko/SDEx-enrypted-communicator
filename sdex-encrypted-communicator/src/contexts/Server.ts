import { create } from "zustand";
import { ServerState } from "../Types";

export const useServerStore = create<ServerState>((set) => ({
  isRegistered: false,
  setRegistered: () => set(() => ({ isRegistered: true })),
  setUnregistered: () => set(() => ({ isRegistered: false })),
}));
