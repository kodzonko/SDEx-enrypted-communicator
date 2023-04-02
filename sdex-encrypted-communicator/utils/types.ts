import { Dispatch, SetStateAction } from "react";

export interface IAuthContext {
  isSignedIn: boolean;
  keyPair: { privateKey: string; publicKey: string } | null;
}

export interface IAuthContextSetters {
  setIsSignedIn: Dispatch<SetStateAction<boolean>>;
  setKeyPair: Dispatch<SetStateAction<null>>;
}

export type IAuthContextCombined = IAuthContext & IAuthContextSetters;

export interface IContact {
  id: number;
  name: string;
  surname: string;
  publicKey: string;
}

export interface IChatRoomListItem {
  id: number;
  name: string;
  surname: string;
  lastMsgDate: string;
  unreadMsgCount: number;
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
