import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodbClientPromise";
import { apiFailure } from "@/lib/apiFailure";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiFailure(req, 401, { error: "Authentication required" }, { phase: "auth" });
    }
    if (session.user.role !== "fundraiser") {
      return apiFailure(req, 403, { error: "Fundraiser role required" }, { phase: "auth", details: { requiredRole: "fundraiser" } });
    }

    const { userId, occasionId, score } = await req.json();
    if (userId !== session.user.id) {
      return apiFailure(req, 403, { error: "Cannot score another user's occasion" }, { phase: "authorization", details: { field: "userId" } });
    }
    if (
      typeof userId !== "string" ||
      typeof occasionId !== "string" ||
      !ObjectId.isValid(userId) ||
      !ObjectId.isValid(occasionId) ||
      typeof score !== "number" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 10
    ) {
      return apiFailure(req, 400, { error: "Invalid occasionId or score" }, { phase: "validation", details: { fields: ["occasionId", "score"] } });
    }

    const client = await clientPromise;
    const result = await client
      .db("skybridge-cluster")
      .collection("users")
      .updateOne(
        {
          _id: new ObjectId(userId),
          "occasions.id": new ObjectId(occasionId),
          "occasions.status": "Searching",
        },
        {
          $set: {
            "occasions.$.score": score,
            "occasions.$.scoringStatus": "Scored",
          },
        },
        { upsert: false },
      );

    if (!result.matchedCount) {
      return apiFailure(req, 404, { error: "Occasion not found" }, { phase: "database", details: { entity: "occasion" } });
    }
    return NextResponse.json({ success: true, occasionId, score }, { status: 200 });
  } catch (error) {
    return apiFailure(req, 500, { error: "Something went wrong" }, { phase: "add_score", error });
  }
}
