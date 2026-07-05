import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "token";

export const saveToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(TOKEN_KEY, token);

export const getToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(TOKEN_KEY);

export const deleteToken = (): Promise<void> =>
  SecureStore.deleteItemAsync(TOKEN_KEY);
