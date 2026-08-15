import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } },
  find: null as any,
  user: null as any,
}));

vi.mock("next-auth", () => ({ getServerSession: async () => state.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/mongodbClientPromise", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        findOne: async (filter: unknown, options: unknown) => {
          state.find = { filter, options };
          return state.user;
        },
      }),
    }),
  }),
}));

import { GET } from "./route";

const USER_ID = "507f1f77bcf86cd799439011";
const OCCASION_ID = "507f191e810c19729de860ea";

describe("GET /api/searchUserOccasion", () => {
  beforeEach(() => {
    state.session = null;
    state.find = null;
    state.user = { occasions: [{ id: new ObjectId(OCCASION_ID), status: "Searching" }] };
  });

  it("rejects unauthenticated and cross-user reads", async () => {
    const url = `http://localhost/api/searchUserOccasion?userId=${USER_ID}`;
    expect((await GET(new Request(url))).status).toBe(401);
    state.session = {
      user: { id: "507f191e810c19729de860ea", role: "fundraiser" },
    };
    expect((await GET(new Request(url))).status).toBe(403);
    expect(state.find).toBeNull();
  });

  it("returns 400 for malformed ids", async () => {
    state.session = { user: { id: "bad", role: "fundraiser" } };
    expect(
      (
        await GET(
          new Request("http://localhost/api/searchUserOccasion?userId=bad"),
        )
      ).status,
    ).toBe(400);
  });

  it("supports an authenticated owned occasion detail lookup", async () => {
    state.session = { user: { id: USER_ID, role: "fundraiser" } };
    const response = await GET(
      new Request(
        `http://localhost/api/searchUserOccasion?userId=${USER_ID}&occasionId=${OCCASION_ID}`,
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.occasion.status).toBe("Searching");
    expect(state.find.filter._id.toHexString()).toBe(USER_ID);
    expect(state.find.filter["occasions.id"].toHexString()).toBe(OCCASION_ID);
  });

  it("allows a sponsor to retrieve only the occasion they approved", async () => {
    const SPONSOR_ID = "507f1f77bcf86cd799439012";
    state.session = { user: { id: SPONSOR_ID, role: "sponsorer" } };
    state.user = {
      _id: new ObjectId(USER_ID),
      occasions: [{ id: new ObjectId(OCCASION_ID), sponsorerId: new ObjectId(SPONSOR_ID) }],
    };

    const response = await GET(
      new Request(`http://localhost/api/searchUserOccasion?occasionId=${OCCASION_ID}`),
    );

    expect(response.status).toBe(200);
    expect(state.find.filter["occasions.id"].toHexString()).toBe(OCCASION_ID);
  });
});
