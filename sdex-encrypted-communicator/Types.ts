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

export interface ChatRoomListItem {
  name: string;
  surname: string;
  lastMsgDate: string;
  unreadMsgCount: number;
}

export interface MessageItem {
  id: number;
  contactId: number;
  textContent: string;
  mediaContentPath: string;
  time: Date;
  unread: boolean;
}

export type StackNavigationParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
};

export type TabsNavigationParamList = {
  Settings: undefined;
  Contacts: undefined;
  ChatRooms: undefined;
  Chat: undefined;
};

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface KeyPairUpdate {
  updatePublicKey: (publicKey: KeyPair["publicKey"]) => void;
  updatePrivateKey: (privateKey: KeyPair["privateKey"]) => void;
}
