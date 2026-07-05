import api from "./api";
import { JournalNote, CreateJournalPayload } from "../types";

interface ListParams {
  start_date?: string;
  end_date?: string;
}

export const list = async (params?: ListParams): Promise<JournalNote[]> => {
  const { data } = await api.get("/api/journal/notes", { params });
  return data.data ?? data;
};

export const get = async (id: number): Promise<JournalNote> => {
  const { data } = await api.get(`/api/journal/notes/${id}`);
  return data.data ?? data;
};

export const create = async (
  payload: CreateJournalPayload | FormData
): Promise<JournalNote> => {
  const { data } = await api.post("/api/journal/notes", payload);
  return data.data ?? data;
};

export const update = async (
  id: number,
  payload: Partial<CreateJournalPayload>
): Promise<JournalNote> => {
  // If image is included, use POST with _method=PATCH (FormData)
  // Otherwise standard PATCH works
  const { data } = await api.patch(`/api/journal/notes/${id}`, payload);
  return data.data ?? data;
};

export const updateWithImage = async (
  id: number,
  formData: FormData
): Promise<JournalNote> => {
  formData.append("_method", "PATCH");
  const { data } = await api.post(`/api/journal/notes/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data ?? data;
};

export const remove = async (id: number): Promise<void> => {
  await api.delete(`/api/journal/notes/${id}`);
};

export const search = async (
  q: string,
  dateFrom?: string,
  dateTo?: string,
  limit?: number
): Promise<JournalNote[]> => {
  const { data } = await api.get("/api/journal/notes/search", {
    params: { q, dateFrom, dateTo, limit },
  });
  return data.data ?? data;
};
