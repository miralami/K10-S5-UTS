import { request, APIRequestContext } from "@playwright/test";
import type { LoginResponse, User } from "../../types";

const BASE = process.env.API_BASE_URL || "http://192.168.100.5:8000";

interface TestUser {
  name: string;
  email: string;
  password: string;
}

/**
 * Create a unique test user for each run, avoiding collisions.
 */
export function createTestUser(index = 1): TestUser {
  const ts = Date.now();
  return {
    name: `Test User ${ts}`,
    email: `test-${ts}-${index}@example.com`,
    password: "Password123!",
  };
}

/**
 * Build an unauthenticated request context.
 */
export async function api(): Promise<APIRequestContext> {
  return await request.newContext({ baseURL: BASE, extraHTTPHeaders: { Accept: "application/json" } });
}

/**
 * Register, login, and return authed request context + credentials + token.
 */
export async function registerAndLogin(user?: TestUser): Promise<{
  ctx: APIRequestContext;
  user: TestUser;
  token: string;
  authUser: User;
}> {
  const u = user ?? createTestUser();
  const ctx = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { Accept: "application/json" },
  });

  // Register
  const regRes = await ctx.post("/api/auth/register", {
    data: {
      name: u.name,
      email: u.email,
      password: u.password,
      password_confirmation: u.password,
    },
  });

  // Registration might return the user directly or need login
  let token: string;
  let authUser: User;

  if (regRes.ok()) {
    const regBody = await regRes.json();
    // Some APIs auto-login on register, others need separate login
    if (regBody.data?.access_token) {
      token = regBody.data.access_token;
      authUser = regBody.data.user;
    } else {
      // Need to login
      const loginRes = await ctx.post("/api/auth/login", {
        data: { email: u.email, password: u.password },
      });
      if (!loginRes.ok()) {
        throw new Error(`Login failed: ${await loginRes.text()}`);
      }
      const loginBody = await loginRes.json();
      token = loginBody.data?.access_token || loginBody.access_token;
      authUser = loginBody.data?.user || loginBody.user;
    }
  } else {
    // Already exists or error — try login
    const loginRes = await ctx.post("/api/auth/login", {
      data: { email: u.email, password: u.password },
    });
    if (!loginRes.ok()) {
      throw new Error(`Register+login failed: ${await regRes.text()} / ${await loginRes.text()}`);
    }
    const loginBody = await loginRes.json();
    token = loginBody.data?.access_token || loginBody.access_token;
    authUser = loginBody.data?.user || loginBody.user;
  }

  // Create authed context
  const authedCtx = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return { ctx: authedCtx, user: u, token, authUser };
}

/**
 * Cleanup: delete a test user's data. Override if your API supports user deletion.
 */
export async function cleanupTestUser(email: string, password: string): Promise<void> {
  // If there's no admin delete endpoint, this is a no-op.
  // Tests use unique emails, so stale data doesn't collide.
}
