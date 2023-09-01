import { create } from "zustand";
import { MessageBufferStoreType } from "../Types";

export const useMessagesBufferStore = create<MessageBufferStoreType>((set) => ({
  newMessage: undefined,
  addNewMessage: (message) => set(() => ({ newMessage: message })),
  clearBuffer: () => set(() => ({ newMessage: undefined })),
}));
