import api from "./api";
import { DailyAnalysis, WeeklyAnalysis } from "../types";

export const dailySummary = async (
  date: string
): Promise<DailyAnalysis | null> => {
  const { data } = await api.get("/api/journal/daily-summary", {
    params: { date },
  });
  return data.analysis ?? null;
};

export const weeklySummary = async (
  startDate: string,
  endDate: string
): Promise<WeeklyAnalysis | null> => {
  const { data } = await api.get("/api/journal/weekly-summary", {
    params: { start_date: startDate, end_date: endDate },
  });
  return data.analysis ?? null;
};
