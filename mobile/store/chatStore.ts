import { create } from "zustand";
import { chatService } from "../services/chat";

interface ChatUser {
  id: string;
  name: string;
  isOnline: boolean;
}

interface ChatMessage {
  id: string;
  type: "global" | "private";
  sender: { id: string; name: string };
  text: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  users: ChatUser[];
  typingUsers: string[];
  isConnected: boolean;
  connect: (token: string, userId: string, userName: string) => void;
  disconnect: () => void;
  send: (text: string, recipientId?: string) => void;
  sendTyping: (isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  typingUsers: [],
  isConnected: false,

  connect: (token, userId, userName) => {
    chatService.connect(token, userId, userName);

    chatService.on("auth_success", (msg) => {
      set({ isConnected: true, users: msg.users ?? [] });
    });

    chatService.on("global_message", (msg) => {
      set((s) => ({
        messages: [...s.messages, { type: "global", ...msg }],
      }));
    });

    chatService.on("private_message", (msg) => {
      set((s) => ({
        messages: [...s.messages, { type: "private", ...msg }],
      }));
    });

    chatService.on("presence", (msg) => {
      set((s) => ({
        users: s.users.map((u) =>
          u.id === msg.user.id ? { ...u, isOnline: msg.isOnline } : u
        ),
      }));
    });

    chatService.on("user_list", (msg) => {
      set({ users: msg.users ?? [] });
    });

    chatService.on("typing", (msg) => {
      const name = msg.user?.name;
      if (!name) return;
      set((s) => {
        const set_ = new Set(s.typingUsers);
        msg.isTyping ? set_.add(name) : set_.delete(name);
        return { typingUsers: [...set_] };
      });
    });
  },

  disconnect: () => {
    chatService.disconnect();
    set({ isConnected: false, messages: [], users: [], typingUsers: [] });
  },

  send: (text, recipientId) => {
    chatService.sendMessage(text, recipientId);
  },

  sendTyping: (isTyping) => {
    chatService.sendTyping(isTyping);
  },
}));
