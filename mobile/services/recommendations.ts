import api from "./api";

export const getRecommendations = async (mood: string) => {
  const { data } = await api.post("/api/recommendations", { mood });
  return data.data ?? data;
};
