import { create } from "zustand";
import { ChatRoomsStoreChatRoomAction, ChatRoomsStoreChatRoomList } from "../Types";

export const useChatRoomsStore = create<ChatRoomsStoreChatRoomList & ChatRoomsStoreChatRoomAction>(
    (set) => ({
        chatRooms: [],
        addChatRoom: (value) => set((state) => ({ chatRooms: [...state.chatRooms, value] })),
        setChatRooms: (values) => set(() => ({ chatRooms: values })),
    }),
);
