import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodbClientPromise";
import { apiFailure } from "@/lib/apiFailure";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiFailure(req, 401, { error: "Authentication required" }, { phase: "auth" });
    }
    if (session.user.role !== "sponsorer") {
      return apiFailure(req, 403, { error: "Sponsorer role required" }, { phase: "auth", details: { requiredRole: "sponsorer" } });
    }

    const { occasionId, occasionData } = await req.json();
    if (
      typeof occasionId !== "string" ||
      !ObjectId.isValid(occasionId) ||
      !ObjectId.isValid(session.user.id)
    ) {
      return apiFailure(req, 400, { error: "Invalid occasionId" }, { phase: "validation", details: { field: "occasionId" } });
    }
    if (
      !occasionData ||
      typeof occasionData !== "object" ||
      Array.isArray(occasionData) ||
      Object.keys(occasionData).length !== 1 ||
      occasionData.status !== "Approved"
    ) {
      return apiFailure(req, 400,
        { error: "Only a Searching to Approved transition is allowed" },
        { phase: "validation", details: { field: "occasionData.status" } },
      );
    }

    const client = await clientPromise;
    const users = client.db("skybridge-cluster").collection("users");
    const sponsorId = new ObjectId(session.user.id);
    const sponsor = await users.findOne(
      { _id: sponsorId },
      { projection: { accountAddress: 1 } },
    );
    if (!sponsor?.accountAddress) {
      return apiFailure(req, 409, { error: "Sponsor wallet not configured" }, { phase: "validation", details: { field: "sponsor.accountAddress" } });
    }

    const occasionObjectId = new ObjectId(occasionId);
    const fundraiser = await users.findOneAndUpdate(
      {
        occasions: {
          $elemMatch: { id: occasionObjectId, status: "Searching" },
        },
      },
      {
        $set: {
          "occasions.$.status": "Approved",
          "occasions.$.sponsorerId": sponsorId,
          "occasions.$.approvedDate": new Date(),
        },
      },
      {
        returnDocument: "after",
        projection: {
          email: 1,
          accountAddress: 1,
          occasions: { $elemMatch: { id: occasionObjectId } },
        },
      },
    );
    if (!fundraiser) {
      return apiFailure(req, 409,
        { error: "Occasion is no longer available" },
        { phase: "database", details: { entity: "occasion", reason: "already_updated_or_missing" } },
      );
    }
    if (!fundraiser.accountAddress) {
      return apiFailure(req, 409,
        { error: "Fundraiser wallet not configured" },
        { phase: "validation", details: { field: "fundraiser.accountAddress" } },
      );
    }

    return NextResponse.json({
      success: true,
      occasionId,
      status: "Approved",
      fundraiser: {
        email: fundraiser.email,
        accountAddress: fundraiser.accountAddress,
      },
      sponsor: { accountAddress: sponsor.accountAddress },
    });
  } catch (error) {
    return apiFailure(req, 500, { error: "Something went wrong" }, { phase: "update_occasion", error });
  }
}
