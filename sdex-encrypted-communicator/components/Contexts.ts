import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { openDatabase } from "./storage/SqlStorageMiddlewares";
import {
  AuthState,
  ChatRoomsStoreChatRoomAction,
  ChatRoomsStoreChatRoomList,
  Contact,
  ContactIdStoreType,
  ContactsStoreContactAction,
  ContactsStoreContactList,
  KeyPair,
  KeyPairUpdate,
  Message,
  MessagesStoreMessageAction,
  MessagesStoreMessageList,
  SqlDbSessionStoreType,
} from "./Types";
import { sortMessagesAscendingByDate } from "./utils/Sort";

const zustandSecureStoreStorage: StateStorage = {
  setItem: async (key, value) => {
    return await SecureStore.setItemAsync(key, value);
  },
  getItem: async (key) => {
    const value = await SecureStore.getItemAsync(key);
    return value ?? null;
  },
  removeItem: (key) => {
    return SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  isSignedIn: false,
  signIn: () => set(() => ({ isSignedIn: true })),
  signOut: () => set(() => ({ isSignedIn: false })),
}));

export const useKeysStore = create<KeyPair & KeyPairUpdate>()(
  persist(
    (set) => ({
      publicKey: "",
      privateKey: "",
      updatePublicKey: (value) => set(() => ({ publicKey: value })),
      updatePrivateKey: (value) => set(() => ({ privateKey: value })),
    }),
    {
      name: "keys-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useContactsStore = create<
  ContactsStoreContactList & ContactsStoreContactAction
>((set, get) => ({
  contacts: [],
  addContact: (value) => set((state) => ({ contacts: [...state.contacts, value] })),
  setContacts: (values) => set(() => ({ contacts: values })),
  getContact: (id): Contact | undefined => {
    return get().contacts.find((contact) => contact.id === id);
  },
  updateContact: (id: number, value: Contact) => {
    set((state) => {
      const index = state.contacts.findIndex((contact) => contact.id === id);
      state.contacts[index] = value;
      return { contacts: state.contacts };
    });
  },
  removeContact: (id) => {
    set((state) => ({
      contacts: state.contacts.filter((contact) => contact.id !== id),
    }));
  },
}));

export const useMessagesStore = create<
  MessagesStoreMessageList & MessagesStoreMessageAction
>((set, get) => ({
  messages: [],
  addMessage: (value) => set((state) => ({ messages: [...state.messages, value] })),
  setMessages: (values) => set(() => ({ messages: values })),
  getLastMessage: (): Message | undefined => {
    const unorderedMessages = get().messages;
    return sortMessagesAscendingByDate(unorderedMessages).pop();
  },
}));

export const useChatRoomsStore = create<
  ChatRoomsStoreChatRoomList & ChatRoomsStoreChatRoomAction
>((set, get) => ({
  chatRooms: [],
  addChatRoom: (value) => set((state) => ({ chatRooms: [...state.chatRooms, value] })),
  setChatRooms: (values) => set(() => ({ chatRooms: values })),
}));

export const useContactIdStore = create<ContactIdStoreType>((set) => ({
  contactId: 0,
  setContactId: (value) => set(() => ({ contactId: value })),
}));

export const useSqlDbSessionStore = create<SqlDbSessionStoreType>((set) => ({
  sqlDbSession: undefined,
  setSqlDbSession: async (name?) => {
    set({
      sqlDbSession: await openDatabase(name),
    });
  },
}));
