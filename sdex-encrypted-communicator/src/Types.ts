import * as SQLite from "expo-sqlite";
import { Socket } from "socket.io-client";
import { DisconnectDescription } from "socket.io-client/build/esm/socket";

export interface AuthState {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
}

export interface ServerState {
  isRegistered: boolean;
  setRegistered: () => void;
  setUnregistered: () => void;
}

export class Contact {
  public id?: number;

  public name: string;

  public surname: string;

  public publicKey: string;

  constructor(name: string, surname: string, publicKey: string, id?: number) {
    this.name = name;
    this.surname = surname;
    this.publicKey = publicKey;
    this.id = id;
  }

  public getFullName(): string {
    return `${this.name} ${this.surname}`;
  }
}

export class ContactListItem {
  public id: number;

  public name: string;

  public surname: string;

  constructor(id: number, name: string, surname: string) {
    this.id = id;
    this.name = name;
    this.surname = surname;
  }
}

export type ContactsStoreContactList = { contacts: Contact[] };

export type ContactsStoreContactAction = {
  addContact: (contact: Contact) => void;
  setContacts: (contacts: Contact[]) => void;
  getContact: (id: number) => Contact | undefined;
  updateContact: (id: number, contact: Contact) => void;
  removeContact: (id: number) => void;
};

export class ChatRoom {
  public name: string;

  public surname: string;

  public contactId: number;

  public lastMessageDate: Date;

  public unreadMessageCount: number;

  constructor(
    name: string,
    surname: string,
    contactId: number,
    lastMessageDate: Date,
    unreadMessageCount: number,
  ) {
    this.name = name;
    this.surname = surname;
    this.contactId = contactId;
    this.lastMessageDate = lastMessageDate;
    this.unreadMessageCount = unreadMessageCount;
  }
}

export class Message {
  public id?: number;

  public contactIdFrom: number;

  public contactIdTo: number;

  public text: string;

  public createdAt: Date;

  public unread: boolean;

  public image?: string;

  public video?: string;

  public audio?: string;

  constructor(
    contactIdFrom: number,
    contactIdTo: number,
    text: string,
    createdAt: Date,
    unread: boolean,
    image?: string,
    video?: string,
    audio?: string,
    id?: number,
  ) {
    this.id = id;
    this.contactIdFrom = contactIdFrom;
    this.contactIdTo = contactIdTo;
    this.text = text;
    this.createdAt = createdAt;
    this.unread = unread;
    this.image = image;
    this.video = video;
    this.audio = audio;
  }
}

export type TransportedMessage = {
  publicKeyTo: string;
  publicKeyFrom: string;
  text: string;
  createdAt: Date;
  image?: string;
  video?: string;
  audio?: string;
};

export type ChatRoomsStoreChatRoomList = { chatRooms: ChatRoom[] };

export type ChatRoomsStoreChatRoomAction = {
  addChatRoom: (chatRoom: ChatRoom) => void;
  setChatRooms: (chatRooms: ChatRoom[]) => void;
};

export type SqlDbSessionStoreType = {
  sqlDbSession?: SQLite.WebSQLDatabase;
  setSqlDbSession: (fileName?: string) => Promise<void>;
};

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export type KeyPairState = KeyPair & {
  setPublicKey: (publicKey: string) => void;
  setPrivateKey: (privateKey: string) => void;
};

export type QrScannedStoreType = {
  publicKey: string;
  setPublicKey: (publicKey: string) => void;
};

export type MessageBufferStoreType = {
  newMessage?: Message;
  addNewMessage: (message: Message) => void;
  clearBuffer: () => void;
};

export type FirstPartySdexEngineContext = {
  initializationHash?: Uint8Array;
  hashFromUserPassword?: Uint8Array;
};

export type ThirdPartySdexEngineContext = {
  initializationHash?: Uint8Array;
  hashFromUserPassword?: Uint8Array;
  sessionKey?: Uint8Array;
};

export type CryptoContextState = {
  sessionKeys: Map<string, Uint8Array>;
  addSessionKey: (publicKey: string, sessionKey: Uint8Array) => void;
};

export type StatusResponse = "success" | "error";

export type RegisterFollowUpPayload = {
  login: string;
  publicKey: string;
  signature: string;
};

export type ChatInitPayload = {
  publicKeyFrom: string;
  publicKeyTo: string;
  sessionKeyPartEncrypted: string;
};

export type ChatInitFollowUpPayload = {
  sessionKeyPartEncrypted: string;
  publicKeyFrom: string;
};

export interface ServerToClientEvents {
  connect: () => void;
  disconnect: (
    reason: Socket.DisconnectReason,
    description?: DisconnectDescription | undefined,
  ) => void;
  connect_error: (error: Error) => void;
  registerInit: (salt: string) => void;
  registerFollowUp: (status: StatusResponse) => void;
  chatInit: (data: ChatInitPayload) => void;
  chatInitFollowUp: (data: ChatInitFollowUpPayload) => void;
  chat: (message: TransportedMessage) => void;
}

export interface ClientToServerEvents {
  registerInit: (callback: (challenge: string) => void) => void;
  registerFollowUp: (
    payload: RegisterFollowUpPayload,
    callback: (status: StatusResponse) => void,
  ) => void;
  chatInit: (data: ChatInitPayload, callback: (response?: string) => void) => void;
  chat: (message: TransportedMessage, callback: (status: StatusResponse) => void) => void;
  checkKey: (publicKey: { publicKey: string }, callback: (response: boolean) => void) => void;
  checkOnline: (publicKey: { publicKey: string }, callback: (response: boolean) => void) => void;
}
