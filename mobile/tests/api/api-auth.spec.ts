import { test, expect } from "@playwright/test";
import { api, createTestUser, registerAndLogin } from "./helpers";

test.describe("Auth API", () => {
  test("register a new user", async () => {
    const user = createTestUser();
    const ctx = await api();

    const res = await ctx.post("/api/auth/register", {
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        password_confirmation: user.password,
      },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.data).toMatchObject({
      access_token: expect.any(String),
      token_type: expect.any(String),
      expires_in: expect.any(Number),
      user: { id: expect.any(Number), name: user.name, email: user.email },
    });
  });

  test("fail registration with missing fields", async () => {
    const ctx = await api();
    const res = await ctx.post("/api/auth/register", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("login with valid credentials", async () => {
    const user = createTestUser();
    const ctx = await api();

    // Register first
    await ctx.post("/api/auth/register", {
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        password_confirmation: user.password,
      },
    });

    // Login
    const res = await ctx.post("/api/auth/login", {
      data: { email: user.email, password: user.password },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.data).toMatchObject({
      access_token: expect.any(String),
      token_type: expect.any(String),
      expires_in: expect.any(Number),
      user: { id: expect.any(Number), name: user.name, email: user.email },
    });
  });

  test("fail login with wrong password", async () => {
    const user = createTestUser();
    const ctx = await api();

    // Register first
    await ctx.post("/api/auth/register", {
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        password_confirmation: user.password,
      },
    });

    // Wrong password
    const res = await ctx.post("/api/auth/login", {
      data: { email: user.email, password: "WrongPass1!" },
    });
    expect(res.status()).toBe(401);
  });

  test("get authenticated user (me)", async () => {
    const { ctx, user } = await registerAndLogin();

    const res = await ctx.post("/api/auth/me");
    expect(res.status()).toBe(200);

    const body = await res.json();
    // Me endpoint may return user at body.data or directly at body
    const meUser = body.data ?? body;
    expect(meUser).toMatchObject({
      id: expect.any(Number),
      name: user.name,
      email: user.email,
    });
  });

  test("fail me without token", async () => {
    const ctx = await api();
    const res = await ctx.post("/api/auth/me");
    // API returns 200 with an unauthenticated/error body when no token
    const body = await res.json();
    expect(body).not.toHaveProperty("data.id");
  });

  test("refresh token", async () => {
    const { ctx } = await registerAndLogin();

    const res = await ctx.post("/api/auth/refresh");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.data).toMatchObject({
      access_token: expect.any(String),
    });
  });

  test("logout", async () => {
    const { ctx } = await registerAndLogin();
    const res = await ctx.post("/api/auth/logout");
    expect(res.status()).toBe(200);
  });
});
