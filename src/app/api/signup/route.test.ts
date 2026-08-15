import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  existingUser: null as Record<string, unknown> | null,
  inserted: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/mongodbClientPromise", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        findOne: async () => state.existingUser,
        insertOne: async (document: Record<string, unknown>) => {
          state.inserted = document;
          return { insertedId: { toString: () => "507f1f77bcf86cd799439011" } };
        },
      }),
    }),
  }),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: async () => "hashed-password" },
}));

import { POST } from "./route";

const validSignup = {
  name: " Ada Lovelace ",
  email: "ADA@Example.com ",
  password: "correct horse battery staple",
  role: "Fundraiser",
  accountAddress: "0x0000000000000000000000000000000000000001",
};

describe("POST /api/signup", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    state.existingUser = null;
    state.inserted = null;
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("rejects signup without a wallet address", async () => {
    const { accountAddress: _omitted, ...body } = validSignup;
    const response = await POST(
      new Request("http://localhost/api/signup", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "x-request-id": "signup-test-request" },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid accountAddress" });
    expect(response.headers.get("x-request-id")).toBe("signup-test-request");
    const diagnostic = errorSpy.mock.calls.find(([prefix]) => prefix === "[api_failure]");
    expect(diagnostic?.[1]).toContain('"requestId":"signup-test-request"');
    expect(diagnostic?.[1]).toContain('"route":"/api/signup"');
    expect(diagnostic?.[1]).toContain('"phase":"validation"');
    expect(diagnostic?.[1]).toContain('"field":"accountAddress"');
    expect(state.inserted).toBeNull();
  });

  it("persists only normalized signup fields and a password hash", async () => {
    const response = await POST(
      new Request("http://localhost/api/signup", {
        method: "POST",
        body: JSON.stringify({
          ...validSignup,
          occasions: [{ status: "Approved" }],
          scores: [10],
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(state.inserted).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "hashed-password",
      role: "fundraiser",
      accountAddress: "0x0000000000000000000000000000000000000001",
    });
    expect(state.inserted).not.toHaveProperty("occasions");
    expect(state.inserted).not.toHaveProperty("scores");
  });

  it("rejects unsupported roles", async () => {
    const response = await POST(
      new Request("http://localhost/api/signup", {
        method: "POST",
        body: JSON.stringify({ ...validSignup, role: "admin" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(state.inserted).toBeNull();
  });
});
