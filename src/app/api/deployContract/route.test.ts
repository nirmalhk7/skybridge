import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } },
  operations: [] as Array<{ collection: string; filter: any; update?: any; options?: any }>,
  agreement: null as any,
}));

vi.mock("next-auth", () => ({ getServerSession: async () => state.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/mongodbClientPromise", async () => {
  const { ObjectId } = await import("mongodb");
  const sponsor = {
    _id: new ObjectId("507f1f77bcf86cd799439011"),
    accountAddress: "0x0000000000000000000000000000000000000001",
  };
  const fundraiser = {
    _id: new ObjectId("507f191e810c19729de860ea"),
    accountAddress: "0x0000000000000000000000000000000000000002",
  };
  return {
    default: Promise.resolve({
      db: () => ({
        collection: (name: string) => ({
          createIndex: async () => undefined,
          findOne: async (filter: any) => {
            state.operations.push({ collection: name, filter });
            if (name === "users") {
              return filter._id?.toHexString?.() === sponsor._id.toHexString()
                ? sponsor
                : fundraiser;
            }
            return state.agreement;
          },
          findOneAndUpdate: async (filter: any, update: any, options: any) => {
            state.operations.push({ collection: name, filter, update, options });
            if (filter.occasionId) {
              state.agreement = {
                _id: new ObjectId("64b64c7f2f3e4a0012345678"),
                ...update.$setOnInsert,
              };
            } else {
              state.agreement = { ...state.agreement, ...update.$set };
            }
            return state.agreement;
          },
          updateOne: async (filter: any, update: any, options: any) => {
            state.operations.push({ collection: name, filter, update, options });
            state.agreement = { ...state.agreement, ...update.$set };
            return { matchedCount: 1, modifiedCount: 1 };
          },
        }),
      }),
    }),
  };
});

import { POST } from "./route";

const SPONSOR_ID = "507f1f77bcf86cd799439011";
const FUNDRAISER_ID = "507f191e810c19729de860ea";
const OCCASION_ID = "64b64c7f2f3e4a0012345670";
const AGREEMENT_ID = "64b64c7f2f3e4a0012345678";
const TX_HASH = `0x${"a".repeat(64)}`;
const request = (body: unknown) =>
  new Request("http://localhost/api/deployContract", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/deployContract", () => {
  beforeEach(() => {
    state.session = null;
    state.operations = [];
    state.agreement = null;
  });

  it("never prepares or spends funds for an unauthenticated caller", async () => {
    const response = await POST(
      request({
        action: "prepare",
        occasionId: OCCASION_ID,
        amountInWei: "1000000000000000000",
        durationSeconds: 86400,
      }),
    );
    expect(response.status).toBe(401);
    expect(state.operations).toEqual([]);
  });

  it("persists an authorized agreement and returns browser deployment data", async () => {
    state.session = { user: { id: SPONSOR_ID, role: "sponsorer" } };
    const response = await POST(
      request({
        action: "prepare",
        occasionId: OCCASION_ID,
        amountInWei: "1000000000000000000",
        durationSeconds: 86400,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      agreementId: AGREEMENT_ID,
      status: "AwaitingDeployment",
      deployment: {
        constructorArgs: [
          "0x0000000000000000000000000000000000000001",
          "0x0000000000000000000000000000000000000002",
          86400,
        ],
        from: "0x0000000000000000000000000000000000000001",
        value: "1000000000000000000",
      },
    });
    expect(body.deployment.abi).toEqual(expect.any(Array));
    expect(body.deployment.bytecode).toMatch(/^0x[0-9a-f]+$/i);
    const persisted = state.operations.find(
      (operation) => operation.collection === "escrowAgreements" && operation.update?.$setOnInsert,
    );
    expect(persisted?.update.$setOnInsert).toMatchObject({
      sponsorerId: expect.any(ObjectId),
      fundraiserId: expect.any(ObjectId),
      status: "AwaitingDeployment",
    });
  });

  it("records sponsor-signed deployment metadata without a server signer", async () => {
    state.session = { user: { id: SPONSOR_ID, role: "sponsorer" } };
    state.agreement = {
      _id: new ObjectId(AGREEMENT_ID),
      sponsorerId: new ObjectId(SPONSOR_ID),
      fundraiserId: new ObjectId(FUNDRAISER_ID),
      status: "AwaitingDeployment",
    };
    const response = await POST(
      request({
        action: "recordDeployment",
        agreementId: AGREEMENT_ID,
        contractAddress: "0x0000000000000000000000000000000000000003",
        transactionHash: TX_HASH,
        chainId: 1337,
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      agreementId: AGREEMENT_ID,
      status: "AwaitingAcceptance",
      contractAddress: "0x0000000000000000000000000000000000000003",
    });
    expect(JSON.stringify(state.operations)).not.toContain("privateKey");
  });

  it("records acceptance only for an agreement participant", async () => {
    state.session = { user: { id: FUNDRAISER_ID, role: "fundraiser" } };
    state.agreement = {
      _id: new ObjectId(AGREEMENT_ID),
      sponsorerId: new ObjectId(SPONSOR_ID),
      fundraiserId: new ObjectId(FUNDRAISER_ID),
      status: "AwaitingAcceptance",
      acceptances: {},
    };
    const response = await POST(
      request({ action: "recordAcceptance", agreementId: AGREEMENT_ID, transactionHash: TX_HASH }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      agreementId: AGREEMENT_ID,
      status: "ReceiverAccepted",
    });
  });

  it("returns agreement metadata only to an agreement participant", async () => {
    state.session = { user: { id: FUNDRAISER_ID, role: "fundraiser" } };
    state.agreement = {
      _id: new ObjectId(AGREEMENT_ID),
      occasionId: new ObjectId(OCCASION_ID),
      sponsorerId: new ObjectId(SPONSOR_ID),
      fundraiserId: new ObjectId(FUNDRAISER_ID),
      status: "AwaitingAcceptance",
      contractAddress: "0x0000000000000000000000000000000000000003",
      chainId: "1337",
    };
    const response = await POST(request({ action: "getAgreement", occasionId: OCCASION_ID }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      agreementId: AGREEMENT_ID,
      status: "AwaitingAcceptance",
      contractAddress: "0x0000000000000000000000000000000000000003",
      chainId: "1337",
    });
  });
});

describe("POST /api/deployContract getAgreement", () => {
  beforeEach(() => {
    state.session = null;
    state.operations = [];
    state.agreement = null;
  });

  it("returns agreement metadata only to an agreement participant", async () => {
    state.session = { user: { id: FUNDRAISER_ID, role: "fundraiser" } };
    state.agreement = {
      _id: new ObjectId(AGREEMENT_ID),
      occasionId: new ObjectId(OCCASION_ID),
      sponsorerId: new ObjectId(SPONSOR_ID),
      fundraiserId: new ObjectId(FUNDRAISER_ID),
      status: "AwaitingAcceptance",
      contractAddress: "0x0000000000000000000000000000000000000003",
      chainId: "1337",
    };

    const response = await POST(request({ action: "getAgreement", occasionId: OCCASION_ID }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      agreementId: AGREEMENT_ID,
      occasionId: OCCASION_ID,
      status: "AwaitingAcceptance",
      contractAddress: "0x0000000000000000000000000000000000000003",
    });
  });

  it("rejects agreement metadata lookup for non-participants", async () => {
    state.session = { user: { id: "507f191e810c19729de860ae", role: "fundraiser" } };
    state.agreement = {
      _id: new ObjectId(AGREEMENT_ID),
      occasionId: new ObjectId(OCCASION_ID),
      sponsorerId: new ObjectId(SPONSOR_ID),
      fundraiserId: new ObjectId(FUNDRAISER_ID),
      status: "AwaitingAcceptance",
    };

    const response = await POST(request({ action: "getAgreement", occasionId: OCCASION_ID }));

    expect(response.status).toBe(403);
  });
});
