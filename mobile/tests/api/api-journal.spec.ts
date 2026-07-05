import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Journal API", () => {
  const today = new Date().toISOString().split("T")[0];

  test("create a journal entry", async () => {
    const { ctx } = await registerAndLogin();
    const title = `Test Entry ${Date.now()}`;
    const body = "Test body";

    const res = await ctx.post("/api/journal/notes", {
      data: { title, body, note_date: today },
    });

    expect(res.ok()).toBeTruthy();
    // Accept 200 or 201
    expect([200, 201]).toContain(res.status());

    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.id).toBeDefined();
    expect(json.data.title).toBe(title);
    // Backend returns ISO datetime (e.g. "2026-07-05T00:00:00+07:00")
    expect(json.data.noteDate).toContain(today);
  });

  test("list notes returns created entry", async () => {
    const { ctx } = await registerAndLogin();
    const title = `List Test ${Date.now()}`;

    // Create a note
    const createRes = await ctx.post("/api/journal/notes", {
      data: { title, body: "list body", note_date: today },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()).data;
    const noteId = created.id;

    // List notes
    const listRes = await ctx.get("/api/journal/notes");
    expect(listRes.ok()).toBeTruthy();
    expect(listRes.status()).toBe(200);

    const listJson = await listRes.json();
    const notes: any[] = listJson.data ?? listJson;
    const found = notes.find((n: any) => n.id === noteId);
    expect(found).toBeDefined();
    expect(found.title).toBe(title);
  });

  test("get a single note by id", async () => {
    const { ctx } = await registerAndLogin();
    const title = `Get Test ${Date.now()}`;

    // Create a note
    const createRes = await ctx.post("/api/journal/notes", {
      data: { title, body: "get body", note_date: today },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()).data;
    const noteId = created.id;

    // Get by id
    const getRes = await ctx.get(`/api/journal/notes/${noteId}`);
    expect(getRes.ok()).toBeTruthy();
    expect(getRes.status()).toBe(200);

    const json = await getRes.json();
    expect(json.data).toBeDefined();
    expect(json.data.id).toBe(noteId);
    expect(json.data.title).toBe(title);
  });

  test("update a note", async () => {
    const { ctx } = await registerAndLogin();
    const title = `Update Test ${Date.now()}`;

    // Create a note
    const createRes = await ctx.post("/api/journal/notes", {
      data: { title, body: "update body", note_date: today },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()).data;
    const noteId = created.id;

    // Update
    const updatedTitle = "Updated Title";
    const updateRes = await ctx.patch(`/api/journal/notes/${noteId}`, {
      data: { title: updatedTitle },
    });
    expect(updateRes.ok()).toBeTruthy();
    expect(updateRes.status()).toBe(200);

    const json = await updateRes.json();
    expect(json.data).toBeDefined();
    expect(json.data.title).toBe(updatedTitle);
  });

  test("search notes by keyword", async () => {
    const { ctx } = await registerAndLogin();
    const keyword = `UniqueKeyword${Date.now()}`;
    const title = `${keyword} Entry`;

    // Create a note with unique keyword in title
    const createRes = await ctx.post("/api/journal/notes", {
      data: { title, body: "search body", note_date: today },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()).data;

    // Search
    const searchRes = await ctx.get("/api/journal/notes/search", {
      params: { q: keyword },
    });
    expect(searchRes.ok()).toBeTruthy();
    expect(searchRes.status()).toBe(200);

    const json = await searchRes.json();
    const results: any[] = json.data ?? json;
    expect(results.length).toBeGreaterThanOrEqual(1);

    const found = results.find((n: any) => n.id === created.id);
    expect(found).toBeDefined();
  });

  test("delete a note", async () => {
    const { ctx } = await registerAndLogin();
    const title = `Delete Test ${Date.now()}`;

    // Create a note
    const createRes = await ctx.post("/api/journal/notes", {
      data: { title, body: "delete body", note_date: today },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()).data;
    const noteId = created.id;

    // Delete
    const deleteRes = await ctx.delete(`/api/journal/notes/${noteId}`);
    // Accept 204 (No Content) or 200
    expect([200, 204]).toContain(deleteRes.status());

    // Verify deletion — GET should 404
    const getRes = await ctx.get(`/api/journal/notes/${noteId}`);
    expect(getRes.status()).toBe(404);
  });
});
