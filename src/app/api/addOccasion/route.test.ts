import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } },
  update: null as null | {
    filter: Record<string, unknown>;
    update: unknown;
    options: unknown;
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: async () => state.session,
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/mongodbClientPromise", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        updateOne: async (
          filter: Record<string, unknown>,
          update: unknown,
          options: unknown,
        ) => {
          state.update = { filter, update, options };
          return { matchedCount: 1, modifiedCount: 1 };
        },
      }),
    }),
  }),
}));

import { POST } from "./route";

const USER_ID = "507f1f77bcf86cd799439011";
const OTHER_ID = "507f191e810c19729de860ea";
const occasionData = {
  name: "Ada Foundation",
  email: "ada@example.com",
  typePreference: "scholarships",
  countryPreference: "230",
  statePreference: "1450",
  agePreference: "10-20",
  message: "Seeking support for a computing scholarship.",
};

function request(body: unknown) {
  return new Request("http://localhost/api/addOccasion", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/addOccasion", () => {
  beforeEach(() => {
    state.session = null;
    state.update = null;
  });

  it("rejects unauthenticated writes", async () => {
    const response = await POST(request({ userId: USER_ID, occasionData }));
    expect(response.status).toBe(401);
    expect(state.update).toBeNull();
  });

  it("rejects the wrong role and cross-user writes", async () => {
    state.session = { user: { id: USER_ID, role: "sponsorer" } };
    expect(
      (await POST(request({ userId: USER_ID, occasionData }))).status,
    ).toBe(403);

    state.session = { user: { id: USER_ID, role: "fundraiser" } };
    expect(
      (await POST(request({ userId: OTHER_ID, occasionData }))).status,
    ).toBe(403);
    expect(state.update).toBeNull();
  });

  it("returns 400 for a malformed ObjectId", async () => {
    state.session = { user: { id: "not-an-id", role: "fundraiser" } };
    const response = await POST(
      request({ userId: "not-an-id", occasionData }),
    );
    expect(response.status).toBe(400);
    expect(state.update).toBeNull();
  });

  it("stores a Searching occasion for the authenticated owner without upsert", async () => {
    state.session = { user: { id: USER_ID, role: "fundraiser" } };
    const response = await POST(request({ userId: USER_ID, occasionData }));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.occasionId).toMatch(/^[a-f\d]{24}$/);
    expect(state.update?.options).toEqual({ upsert: false });
    expect((state.update?.filter._id as { toHexString(): string }).toHexString()).toBe(
      USER_ID,
    );
    expect(state.update?.update).toMatchObject({
      $push: {
        occasions: {
          id: expect.anything(),
          status: "Searching",
          score: null,
          scoringStatus: "Pending",
        },
      },
    });
  });
});
