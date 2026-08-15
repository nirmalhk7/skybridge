import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } },
  fetch: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: async () => state.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { POST } from "./route";

const request = (body: unknown) => new Request("http://localhost/api/gptHandler", {
  method: "POST",
  body: JSON.stringify(body),
});

describe("POST /api/gptHandler", () => {
  beforeEach(() => {
    state.session = null;
    state.fetch.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", state.fetch);
  });

  it("rejects unauthenticated scoring before calling OpenAI", async () => {
    const response = await POST(request({ message: "I want to study engineering." }));
    expect(response.status).toBe(401);
    expect(state.fetch).not.toHaveBeenCalled();
  });

  it("uses the server-only key and returns a bounded numeric score", async () => {
    state.session = { user: { id: "507f1f77bcf86cd799439011", role: "fundraiser" } };
    state.fetch.mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "8.5" } }],
    }), { status: 200 }));

    const response = await POST(request({ message: "I want to study engineering." }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ score: 8.5 });
    expect(state.fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      }),
    );
  });

  it("does not fabricate a score when the provider fails", async () => {
    state.session = { user: { id: "507f1f77bcf86cd799439011", role: "fundraiser" } };
    state.fetch.mockResolvedValue(new Response("unavailable", { status: 503 }));

    const response = await POST(request({ message: "I want to study engineering." }));

    expect(response.status).toBe(502);
  });
});
