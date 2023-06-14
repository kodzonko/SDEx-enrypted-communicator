import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { createDbSession } from "./storage/SqlStorageMiddlewares";
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
  SqlDbSessionStoreType,
} from "./Types";

const zustandSecureStoreStorage: StateStorage = {
  setItem: async (key, value) => SecureStore.setItemAsync(key, value),
  getItem: async (key) => {
    const value = await SecureStore.getItemAsync(key);
    return value ?? null;
  },
  removeItem: (key) => SecureStore.deleteItemAsync(key),
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

export const useContactsStore = create<ContactsStoreContactList & ContactsStoreContactAction>(
  (set, get) => ({
    contacts: [],
    addContact: (value) => set((state) => ({ contacts: [...state.contacts, value] })),
    setContacts: (values) => set(() => ({ contacts: values })),
    getContact: (id): Contact | undefined => get().contacts.find((contact) => contact.id === id),
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
  }),
);

export const useChatRoomsStore = create<ChatRoomsStoreChatRoomList & ChatRoomsStoreChatRoomAction>(
  (set) => ({
    chatRooms: [],
    addChatRoom: (value) => set((state) => ({ chatRooms: [...state.chatRooms, value] })),
    setChatRooms: (values) => set(() => ({ chatRooms: values })),
  }),
);

export const useContactIdStore = create<ContactIdStoreType>((set) => ({
  contactId: 0,
  setContactId: (value) => set(() => ({ contactId: value })),
}));

export const useSqlDbSessionStore = create<SqlDbSessionStoreType>((set) => ({
  sqlDbSession: undefined,
  setSqlDbSession: async (name?) => {
    set({
      sqlDbSession: await createDbSession(name),
    });
  },
}));
