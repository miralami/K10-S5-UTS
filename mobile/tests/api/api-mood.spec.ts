import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

// ── Date helpers ────────────────────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekMonday(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().split("T")[0];
}

function getWeekSunday(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 6);
  return d.toISOString().split("T")[0];
}

// ── Tests ───────────────────────────────────────────────────────
test.describe("Mood & Recommendations", () => {
  test("get daily mood summary", async () => {
    const { ctx } = await registerAndLogin();

    // Create at least one journal note for today
    const noteDate = todayISO();
    const noteRes = await ctx.post("/api/journal/notes", {
      data: { title: "Morning reflection", body: "Feeling great today", note_date: noteDate },
    });
    expect(noteRes.ok()).toBeTruthy();

    // Get daily summary
    const res = await ctx.get(`/api/journal/daily-summary?date=${noteDate}`);
    expect(res.ok()).toBeTruthy();
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("analysis");

    // Analysis may be null if AI service is unavailable; still pass if structure valid
    if (body.analysis) {
      expect(body.analysis).toHaveProperty("summary");
      expect(body.analysis).toHaveProperty("dominantMood");
      expect(body.analysis).toHaveProperty("moodScore");
    }
  });

  test("get weekly mood summary", async () => {
    const { ctx } = await registerAndLogin();

    // No notes needed — endpoint handles empty weeks gracefully
    const monday = getWeekMonday();
    const sunday = getWeekSunday();

    const res = await ctx.get(
      `/api/journal/weekly-summary?start_date=${monday}&end_date=${sunday}`,
    );
    await expect(res.ok()).toBeTruthy();
    await expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("analysis");
  });

  test("get movie recommendations", async () => {
    const { ctx } = await registerAndLogin();

    const res = await ctx.post("/api/recommendations", {
      data: { mood: "happy" },
    });
    expect(res.ok()).toBeTruthy();
    expect(res.status()).toBe(200);

    const body = await res.json();
    // Response has top-level `recommendations` array (not nested under data.items)
    expect(body).toHaveProperty("recommendations");
    expect(Array.isArray(body.recommendations)).toBeTruthy();

    for (const item of body.recommendations) {
      expect(item).toHaveProperty("title");
    }
  });

  test("recommendations returns results for different moods", async () => {
    const { ctx } = await registerAndLogin();

    const resSad = await ctx.post("/api/recommendations", {
      data: { mood: "sad" },
    });
    expect(resSad.ok()).toBeTruthy();
    expect(resSad.status()).toBe(200);
    const sadBody = await resSad.json();
    expect(Array.isArray(sadBody.recommendations)).toBeTruthy();

    const resHappy = await ctx.post("/api/recommendations", {
      data: { mood: "happy" },
    });
    expect(resHappy.ok()).toBeTruthy();
    expect(resHappy.status()).toBe(200);
    const happyBody = await resHappy.json();
    expect(Array.isArray(happyBody.recommendations)).toBeTruthy();
  });
});
