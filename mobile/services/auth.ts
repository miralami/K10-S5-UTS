import api from "./api";
import { LoginResponse, User } from "../types";

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/api/auth/login", {
    email,
    password,
  });
  return data;
};

export const logout = async (): Promise<void> => {
  await api.post("/api/auth/logout");
};

export const me = async (): Promise<User> => {
  const { data } = await api.post("/api/auth/me");
  return data.data ?? data;
};

export const refresh = async (): Promise<string> => {
  const { data } = await api.post("/api/auth/refresh");
  return data.data?.access_token;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string
): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/api/auth/register", {
    name,
    email,
    password,
    password_confirmation: passwordConfirmation,
  });
  return data;
};
