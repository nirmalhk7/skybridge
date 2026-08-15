import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } },
  update: null as any,
}));

vi.mock("next-auth", () => ({ getServerSession: async () => state.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/mongodbClientPromise", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        updateOne: async (filter: unknown, update: unknown, options: unknown) => {
          state.update = { filter, update, options };
          return { matchedCount: 1, modifiedCount: 1 };
        },
      }),
    }),
  }),
}));

import { POST } from "./route";

const USER_ID = "507f1f77bcf86cd799439011";
const OCCASION_ID = "507f191e810c19729de860ea";
const request = (body: unknown) =>
  new Request("http://localhost/api/addScore", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/addScore", () => {
  beforeEach(() => {
    state.session = null;
    state.update = null;
  });

  it("requires an authenticated fundraiser owner", async () => {
    expect(
      (await POST(request({ userId: USER_ID, occasionId: OCCASION_ID, score: 8 })))
        .status,
    ).toBe(401);
    state.session = { user: { id: USER_ID, role: "sponsorer" } };
    expect(
      (await POST(request({ userId: USER_ID, occasionId: OCCASION_ID, score: 8 })))
        .status,
    ).toBe(403);
    expect(state.update).toBeNull();
  });

  it("requires a valid occasion id and bounded numeric score", async () => {
    state.session = { user: { id: USER_ID, role: "fundraiser" } };
    expect((await POST(request({ userId: USER_ID, score: 8 }))).status).toBe(400);
    expect(
      (await POST(request({ userId: USER_ID, occasionId: OCCASION_ID, score: 11 })))
        .status,
    ).toBe(400);
    expect(state.update).toBeNull();
  });

  it("stores the score on the matching Searching occasion", async () => {
    state.session = { user: { id: USER_ID, role: "fundraiser" } };
    const response = await POST(
      request({ userId: USER_ID, occasionId: OCCASION_ID, score: 8.5 }),
    );

    expect(response.status).toBe(200);
    expect(state.update.filter).toMatchObject({
      "occasions.status": "Searching",
    });
    expect(state.update.filter._id.toHexString()).toBe(USER_ID);
    expect(state.update.filter["occasions.id"].toHexString()).toBe(OCCASION_ID);
    expect(state.update.update).toEqual({
      $set: {
        "occasions.$.score": 8.5,
        "occasions.$.scoringStatus": "Scored",
      },
    });
    expect(state.update.options).toEqual({ upsert: false });
  });
});
