import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } },
  pipeline: null as unknown[] | null,
}));

vi.mock("next-auth", () => ({ getServerSession: async () => state.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/mongodbClientPromise", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        aggregate: (pipeline: unknown[]) => {
          state.pipeline = pipeline;
          return { toArray: async () => [] };
        },
      }),
    }),
  }),
}));

import { GET } from "./route";

const SPONSOR_ID = "507f1f77bcf86cd799439011";

describe("GET /api/searchOccasion", () => {
  beforeEach(() => {
    state.session = null;
    state.pipeline = null;
  });

  it("requires an authenticated sponsorer", async () => {
    expect(
      (await GET(new Request("http://localhost/api/searchOccasion?typePreference=scholarships"))).status,
    ).toBe(401);
    state.session = { user: { id: SPONSOR_ID, role: "fundraiser" } };
    expect(
      (await GET(new Request("http://localhost/api/searchOccasion?typePreference=scholarships"))).status,
    ).toBe(403);
    expect(state.pipeline).toBeNull();
  });

  it("rejects unknown filters and another sponsor's match history", async () => {
    state.session = { user: { id: SPONSOR_ID, role: "sponsorer" } };
    expect(
      (await GET(new Request("http://localhost/api/searchOccasion?$where=true"))).status,
    ).toBe(400);
    expect(
      (
        await GET(
          new Request(
            "http://localhost/api/searchOccasion?sponsorerId=507f191e810c19729de860ea",
          ),
        )
      ).status,
    ).toBe(403);
  });

  it("searches only Searching occasions and sorts by each occasion's score", async () => {
    state.session = { user: { id: SPONSOR_ID, role: "sponsorer" } };
    const response = await GET(
      new Request(
        "http://localhost/api/searchOccasion?typePreference=scholarships&countryPreference=230",
      ),
    );

    expect(response.status).toBe(200);
    expect(state.pipeline).toContainEqual({
      $match: expect.objectContaining({
        "occasions.status": "Searching",
        "occasions.typePreference": "scholarships",
        "occasions.countryPreference": "230",
      }),
    });
    expect(state.pipeline).toContainEqual({ $sort: { "occasions.score": -1 } });
    expect(JSON.stringify(state.pipeline)).not.toContain("$scores");
  });
});
