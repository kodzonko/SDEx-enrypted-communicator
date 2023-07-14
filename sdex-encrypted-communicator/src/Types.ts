import * as SQLite from "expo-sqlite";

export interface AuthState {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
}

export class Contact {
  public id?: number;

  public name: string;

  public surname: string;

  public publicKey: string;

  public messagingKey: string;

  constructor(name: string, surname: string, publicKey: string, messagingKey: string, id?: number) {
    this.name = name;
    this.surname = surname;
    this.publicKey = publicKey;
    this.messagingKey = messagingKey;
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

export type ChatRoomsStoreChatRoomList = { chatRooms: ChatRoom[] };

export type ChatRoomsStoreChatRoomAction = {
  addChatRoom: (chatRoom: ChatRoom) => void;
  setChatRooms: (chatRooms: ChatRoom[]) => void;
};

export type SqlDbSessionStoreType = {
  sqlDbSession?: SQLite.WebSQLDatabase;
  setSqlDbSession: (name?: string) => void;
};

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};
