import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } },
  atomic: null as any,
}));

vi.mock("next-auth", () => ({ getServerSession: async () => state.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/mongodbClientPromise", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        findOne: async () => ({
          accountAddress: "0x0000000000000000000000000000000000000001",
        }),
        findOneAndUpdate: async (filter: unknown, update: unknown, options: unknown) => {
          state.atomic = { filter, update, options };
          return {
            email: "fundraiser@example.com",
            accountAddress: "0x0000000000000000000000000000000000000002",
            occasions: [{ id: "occasion", status: "Approved" }],
          };
        },
      }),
    }),
  }),
}));

import { PUT } from "./route";

const SPONSOR_ID = "507f1f77bcf86cd799439011";
const OCCASION_ID = "507f191e810c19729de860ea";
const request = (body: unknown) =>
  new Request("http://localhost/api/updateOccasion", {
    method: "PUT",
    body: JSON.stringify(body),
  });

describe("PUT /api/updateOccasion", () => {
  beforeEach(() => {
    state.session = null;
    state.atomic = null;
  });

  it("requires an authenticated sponsorer", async () => {
    expect(
      (
        await PUT(
          request({ occasionId: OCCASION_ID, occasionData: { status: "Approved" } }),
        )
      ).status,
    ).toBe(401);
    state.session = { user: { id: SPONSOR_ID, role: "fundraiser" } };
    expect(
      (
        await PUT(
          request({ occasionId: OCCASION_ID, occasionData: { status: "Approved" } }),
        )
      ).status,
    ).toBe(403);
    expect(state.atomic).toBeNull();
  });

  it("rejects arbitrary occasion mutations", async () => {
    state.session = { user: { id: SPONSOR_ID, role: "sponsorer" } };
    const response = await PUT(
      request({
        occasionId: OCCASION_ID,
        occasionData: { status: "Approved", id: "replacement" },
      }),
    );
    expect(response.status).toBe(400);
    expect(state.atomic).toBeNull();
  });

  it("atomically claims only a Searching occasion and derives sponsor identity", async () => {
    state.session = { user: { id: SPONSOR_ID, role: "sponsorer" } };
    const response = await PUT(
      request({ occasionId: OCCASION_ID, occasionData: { status: "Approved" } }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      occasionId: OCCASION_ID,
      status: "Approved",
      fundraiser: {
        email: "fundraiser@example.com",
        accountAddress: "0x0000000000000000000000000000000000000002",
      },
      sponsor: { accountAddress: "0x0000000000000000000000000000000000000001" },
    });
    expect(state.atomic.filter.occasions.$elemMatch.status).toBe("Searching");
    expect(state.atomic.update.$set["occasions.$.status"]).toBe("Approved");
    expect(
      state.atomic.update.$set["occasions.$.sponsorerId"].toHexString(),
    ).toBe(SPONSOR_ID);
  });
});
