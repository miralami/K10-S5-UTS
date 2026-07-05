import { useState, useEffect } from "react";
import { DailyAnalysis, WeeklyAnalysis } from "../types";
import * as analysisService from "../services/analysis";
import { todayISO } from "../utils/date";

function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  // Monday this week
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  return { start: fmt(mon), end: fmt(sun) };
}

export function useMoodAnalysis() {
  const [daily, setDaily] = useState<DailyAnalysis | null>(null);
  const [weekly, setWeekly] = useState<WeeklyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dailyRes, weeklyRes] = await Promise.allSettled([
        analysisService.dailySummary(todayISO()),
        analysisService.weeklySummary(
          getWeekBounds().start,
          getWeekBounds().end
        ),
      ]);
      if (dailyRes.status === "fulfilled") setDaily(dailyRes.value);
      if (weeklyRes.status === "fulfilled")
        setWeekly(weeklyRes.value as WeeklyAnalysis);
      if (dailyRes.status === "rejected" && weeklyRes.status === "rejected") {
        setError("Could not load mood data");
      }
    } catch {
      setError("Could not load mood data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return { daily, weekly, loading, error, refresh: fetch };
}
