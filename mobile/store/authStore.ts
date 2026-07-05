import { create } from "zustand";
import { User } from "../types";
import { saveToken, getToken, deleteToken } from "../utils/storage";
import * as authService from "../services/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const user = await authService.me();
      set({
        user,
        token: storedToken,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      await deleteToken();
      set({ isLoading: false, isAuthenticated: false, user: null, token: null });
    }
  },

  login: async (email: string, password: string) => {
    const res = await authService.login(email, password);
    const { access_token, user } = res.data;
    await saveToken(access_token);
    set({ token: access_token, user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // proceed regardless
    }
    await deleteToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  setToken: (token: string) => set({ token }),
}));

export const syncToken = (token: string) =>
  useAuthStore.getState().setToken(token);
