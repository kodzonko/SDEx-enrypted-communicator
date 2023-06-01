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

export type UnauthenticatedStackNavigationParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type AuthenticatedStackNavigationParamList = {
  ChatRooms: undefined;
  Settings: undefined;
  Contacts: undefined;
};

export type LoginScreenPropsType = NativeStackScreenProps<
  UnauthenticatedStackNavigationParamList,
  "Login"
>;

export type SignUpScreenPropsType = NativeStackScreenProps<
  UnauthenticatedStackNavigationParamList,
  "SignUp"
>;

export type ChatRoomsScreenPropsType = NativeStackScreenProps<
  AuthenticatedStackNavigationParamList,
  "ChatRooms"
>;

export type SettingsScreenPropsType = NativeStackScreenProps<
  AuthenticatedStackNavigationParamList,
  "Settings"
>;

export type ContactsScreenPropsType = NativeStackScreenProps<
  AuthenticatedStackNavigationParamList,
  "Contacts"
>;

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface KeyPairUpdate {
  updatePublicKey: (publicKey: KeyPair["publicKey"]) => void;
  updatePrivateKey: (privateKey: KeyPair["privateKey"]) => void;
}
