import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StackScreenProps } from "@react-navigation/stack";
import * as SQLite from "expo-sqlite";

export interface AuthState {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
}

export interface Contact {
  id: number;
  name: string;
  surname: string;
  publicKey: string;
  messagingKey: string;
}

export type ContactsStoreContactList = { contacts: Contact[] };

export type ContactsStoreContactAction = {
  addContact: (contact: Contact) => void;
  setContacts: (contacts: Contact[]) => void;
  getContact: (id: number) => Contact | undefined;
  updateContact: (id: number, contact: Contact) => void;
  removeContact: (id: number) => void;
};

export type ChatRoomListItem = {
  name: string;
  surname: string;
  contactId: number;
  lastMsgDate: Date;
  unreadMsgCount: number;
};

export type Message = {
  id: number;
  contactId: number;
  text: string;
  createdAt: Date;
  unread: boolean;
  image?: string;
  video?: string;
  audio?: string;
};

export type MessagesStoreMessageList = { messages: Message[] };

export type MessagesStoreMessageAction = {
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  getLastMessage: (contactId: number) => Message | undefined;
};

export type ChatRoomsStoreChatRoomList = { chatRooms: ChatRoomListItem[] };

export type ChatRoomsStoreChatRoomAction = {
  addChatRoom: (chatRoom: ChatRoomListItem) => void;
  setChatRooms: (chatRooms: ChatRoomListItem[]) => void;
};

export type ContactIdStoreType = {
  contactId: number;
  setContactId: (id: number) => void;
};

export type SqlDbSessionStoreType = {
  sqlDbSession?: SQLite.WebSQLDatabase;
  setSqlDbSession: (name?: string) => void;
};

export type UnauthenticatedStackNavigationParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type UnauthenticatedStackLoginScreenPropsType = NativeStackScreenProps<
  UnauthenticatedStackNavigationParamList,
  "Login"
>;

export type UnauthenticatedStackSignUpScreenPropsType = NativeStackScreenProps<
  UnauthenticatedStackNavigationParamList,
  "SignUp"
>;

export type AuthenticatedBottomTabNavigationParamList = {
  ChatRoomsStack: undefined;
  ContactsStack: undefined;
};

export type ChatRoomsStackNavigationParamList = {
  ChatRooms: undefined;
  Chat: undefined;
  Settings: undefined;
};

export type ChatRoomsStackChatRoomsScreenPropsType = NativeStackScreenProps<
  ChatRoomsStackNavigationParamList,
  "ChatRooms"
>;

export type ChatRoomsStackChatScreenPropsType = NativeStackScreenProps<
  ChatRoomsStackNavigationParamList,
  "Chat"
>;

export type ContactsStackNavigationParamList = {
  Contacts: undefined;
  Settings: undefined;
};

export type ContactsStackContactsScreenPropsType = NativeStackScreenProps<
  ContactsStackNavigationParamList,
  "Contacts"
>;

export type SettingsScreenPropsType = CompositeScreenProps<
  StackScreenProps<ChatRoomsStackNavigationParamList, "Settings">,
  StackScreenProps<ContactsStackNavigationParamList, "Settings">
>;

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export type KeyPairUpdate = {
  updatePublicKey: (publicKey: KeyPair["publicKey"]) => void; // eslint-disable-line no-unused-vars
  updatePrivateKey: (privateKey: KeyPair["privateKey"]) => void; // eslint-disable-line no-unused-vars
};
