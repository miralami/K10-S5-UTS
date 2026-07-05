import { test, expect, request } from "@playwright/test";
import { api, createTestUser, registerAndLogin } from "./helpers";

const BASE = process.env.API_BASE_URL || "http://192.168.100.5:8000";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

test.describe("Full User Journey", () => {
  test("complete business flow", async () => {
    // ── Step 1: Register ──────────────────────────────────────────
    const unauth = await api();
    const user = createTestUser();

    const regRes = await unauth.post("/api/auth/register", {
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        password_confirmation: user.password,
      },
    });
    expect(regRes.ok()).toBeTruthy();
    expect([200, 201]).toContain(regRes.status());
    const regBody = await regRes.json();
    expect(regBody.data).toBeDefined();
    expect(regBody.data.access_token).toBeDefined();
    expect(regBody.data.user).toBeDefined();
    expect(regBody.data.user.email).toBe(user.email);

    // ── Step 2: Login with those credentials ──────────────────────
    const loginRes = await unauth.post("/api/auth/login", {
      data: { email: user.email, password: user.password },
    });
    expect(loginRes.ok()).toBeTruthy();
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.data).toBeDefined();
    expect(loginBody.data.access_token).toBeDefined();
    expect(loginBody.data.token_type).toBeDefined();
    expect(loginBody.data.user).toBeDefined();
    expect(loginBody.data.user.email).toBe(user.email);
    const token = loginBody.data.access_token;

    // ── Create authed context for remainder of flow ───────────────
    const authed = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // ── Step 3: Verify auth (me endpoint) ─────────────────────────
    const meRes = await authed.post("/api/auth/me");
    expect(meRes.ok()).toBeTruthy();
    expect(meRes.status()).toBe(200);
    const meBody = await meRes.json();
    // Response may wrap in data or be direct
    const meUser = meBody.data ?? meBody;
    expect(meUser.email).toBe(user.email);

    // ── Step 4: Create journal entries on 3 different days ────────
    const today = daysAgo(0);
    const yesterday = daysAgo(1);
    const twoDaysAgo = daysAgo(2);

    const note1Title = "Grateful for sunshine";
    const note1Res = await authed.post("/api/journal/notes", {
      data: { title: note1Title, body: "Beautiful sunny day outside", note_date: today },
    });
    expect(note1Res.ok()).toBeTruthy();
    expect([200, 201]).toContain(note1Res.status());
    const note1 = (await note1Res.json()).data;
    expect(note1.id).toBeDefined();
    expect(note1.title).toBe(note1Title);
    // Backend returns ISO datetime — compare via contains
    expect(note1.noteDate).toContain(today);
 
    const note2Title = "Productive workday";
    const note2Res = await authed.post("/api/journal/notes", {
      data: { title: note2Title, body: "Finished all tasks on time", note_date: yesterday },
    });
    expect(note2Res.ok()).toBeTruthy();
    expect([200, 201]).toContain(note2Res.status());
    const note2 = (await note2Res.json()).data;
    expect(note2.id).toBeDefined();
    expect(note2.title).toBe(note2Title);
    expect(note2.noteDate).toContain(yesterday);
 
    const note3Title = "Evening walk in park";
    const note3Res = await authed.post("/api/journal/notes", {
      data: { title: note3Title, body: "Saw a beautiful sunset", note_date: twoDaysAgo },
    });
    expect(note3Res.ok()).toBeTruthy();
    expect([200, 201]).toContain(note3Res.status());
    const note3 = (await note3Res.json()).data;
    expect(note3.id).toBeDefined();
    expect(note3.title).toBe(note3Title);
    expect(note3.noteDate).toContain(twoDaysAgo);

    // ── Step 5: List all notes ────────────────────────────────────
    const listRes = await authed.get("/api/journal/notes");
    expect(listRes.ok()).toBeTruthy();
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    const notes: any[] = listBody.data ?? listBody;
    expect(notes.length).toBeGreaterThanOrEqual(3);

    const allIds = notes.map((n: any) => n.id);
    expect(allIds).toContain(note1.id);
    expect(allIds).toContain(note2.id);
    expect(allIds).toContain(note3.id);

    // ── Step 6: Get daily summary for today ───────────────────────
    const summaryRes = await authed.get(`/api/journal/daily-summary?date=${today}`);
    expect(summaryRes.ok()).toBeTruthy();
    expect(summaryRes.status()).toBe(200);
    const summaryBody = await summaryRes.json();
    // Response may nest analysis under data or directly; can be null if AI unavailable
    const analysis = summaryBody.analysis ?? summaryBody.data?.analysis ?? summaryBody;
    expect(analysis).toBeDefined();
    if (analysis && typeof analysis === "object" && !Array.isArray(analysis)) {
      // Optional fields — AI may not be available
      if (analysis.summary) expect(typeof analysis.summary).toBe("string");
    }

    // ── Step 7: Search for a note ─────────────────────────────────
    const keyword = "sunshine";
    const searchRes = await authed.get("/api/journal/notes/search", {
      params: { q: keyword },
    });
    expect(searchRes.ok()).toBeTruthy();
    expect(searchRes.status()).toBe(200);
    const searchBody = await searchRes.json();
    const searchResults: any[] = searchBody.data ?? searchBody;
    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    const foundSearch = searchResults.find((n: any) => n.id === note1.id);
    expect(foundSearch).toBeDefined();

    // ── Step 8: Update one entry ──────────────────────────────────
    const updatedTitle = "Updated: Super productive day";
    const updateRes = await authed.patch(`/api/journal/notes/${note2.id}`, {
      data: { title: updatedTitle },
    });
    expect(updateRes.ok()).toBeTruthy();
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    const updatedNote = updateBody.data ?? updateBody;
    expect(updatedNote.title).toBe(updatedTitle);

    // ── Step 9: Delete one entry ──────────────────────────────────
    const deleteRes = await authed.delete(`/api/journal/notes/${note3.id}`);
    expect([200, 204]).toContain(deleteRes.status());

    // Verify deletion — GET returns 404
    const getDeletedRes = await authed.get(`/api/journal/notes/${note3.id}`);
    expect(getDeletedRes.status()).toBe(404);

    // ── Step 10: Get movie recommendations ────────────────────────
    const recRes = await authed.post("/api/recommendations", {
      data: { mood: "happy" },
    });
    expect(recRes.ok()).toBeTruthy();
    expect(recRes.status()).toBe(200);
    const recBody = await recRes.json();
    // Top-level `recommendations` array (not nested under data.items)
    expect(recBody).toHaveProperty("recommendations");
    expect(Array.isArray(recBody.recommendations)).toBeTruthy();
    expect(recBody.recommendations.length).toBeGreaterThan(0);
    for (const item of recBody.recommendations) {
      expect(item).toHaveProperty("title");
    }

    // ── Step 11: Logout ───────────────────────────────────────────
    const logoutRes = await authed.post("/api/auth/logout");
    expect(logoutRes.ok()).toBeTruthy();
    expect(logoutRes.status()).toBe(200);

    // Verify me endpoint no longer returns user data after logout
    const postLogoutMeRes = await authed.post("/api/auth/me");
    const postLogoutBody = await postLogoutMeRes.json();
    expect(postLogoutBody).not.toHaveProperty("data.id");
  });
});
