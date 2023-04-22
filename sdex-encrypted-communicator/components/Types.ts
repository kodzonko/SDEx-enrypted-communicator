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
  text: string;
  mediaPath: string;
  time: Date;
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
