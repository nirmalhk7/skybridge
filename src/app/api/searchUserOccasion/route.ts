import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodbClientPromise";
import { apiFailure } from "@/lib/apiFailure";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiFailure(req, 401, { error: "Authentication required" }, { phase: "auth" });
    }
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const occasionId = searchParams.get("occasionId");
    if (userId && userId !== session.user.id) {
      return apiFailure(req, 403, { error: "Cannot view another user's occasions" }, { phase: "authorization", details: { field: "userId" } });
    }
    if (userId && !ObjectId.isValid(userId)) {
      return apiFailure(req, 400, { error: "Invalid userId" }, { phase: "validation", details: { field: "userId" } });
    }
    if (occasionId && !ObjectId.isValid(occasionId)) {
      return apiFailure(req, 400, { error: "Invalid occasionId" }, { phase: "validation", details: { field: "occasionId" } });
    }
    if (!userId && !occasionId) {
      return apiFailure(req, 400, { error: "Missing userId or occasionId" }, { phase: "validation", details: { fields: ["userId", "occasionId"] } });
    }

    const filter: Record<string, unknown> = userId ? { _id: new ObjectId(userId) } : {};
    const options: Record<string, unknown> = { projection: { _id: 1, occasions: 1 } };
    if (occasionId) {
      filter["occasions.id"] = new ObjectId(occasionId);
      options.projection = { occasions: { $elemMatch: { id: new ObjectId(occasionId) } } };
    }
    const client = await clientPromise;
    const user = await client
      .db("skybridge-cluster")
      .collection("users")
      .findOne(filter, options);
    if (!user) {
      return apiFailure(req,
        404,
        { error: occasionId ? "Occasion not found" : "User not found" },
        { phase: "database", details: { entity: occasionId ? "occasion" : "user" } },
      );
    }
    const occasions = user.occasions ?? [];
    if (occasionId) {
      if (!occasions[0]) {
        return apiFailure(req, 404, { error: "Occasion not found" }, { phase: "database", details: { entity: "occasion" } });
      }
      if (!userId) {
        const occasion = occasions[0];
        const isOwner = user._id?.toString() === session.user.id;
        const isApprovedSponsor = occasion.sponsorerId?.toString() === session.user.id;
        if (!isOwner && !isApprovedSponsor) {
          return apiFailure(req, 403, { error: "Cannot view this opportunity" }, { phase: "authorization", details: { entity: "occasion" } });
        }
      }
      return NextResponse.json({ success: true, occasion: occasions[0] });
    }
    return NextResponse.json({ success: true, occasions });
  } catch (error) {
    return apiFailure(req, 500, { error: "Something went wrong" }, { phase: "search_user_occasions", error });
  }
}
