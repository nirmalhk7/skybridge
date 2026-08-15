import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodbClientPromise";
import { apiFailure } from "@/lib/apiFailure";

const OCCASION_FIELDS = [
  "name",
  "email",
  "typePreference",
  "countryPreference",
  "statePreference",
  "agePreference",
  "message",
] as const;

function parseOccasion(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const occasion: Record<string, string> = {};
  for (const field of OCCASION_FIELDS) {
    const fieldValue = input[field];
    if (typeof fieldValue !== "string" || !fieldValue.trim()) return null;
    occasion[field] = fieldValue.trim();
  }
  if (occasion.message.length > 4000) return null;
  return occasion;
}

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

    const { userId, occasionData } = await req.json();
    if (userId !== session.user.id) {
      return apiFailure(req, 403, { error: "Cannot create for another user" }, { phase: "authorization", details: { field: "userId" } });
    }
    if (typeof userId !== "string" || !ObjectId.isValid(userId)) {
      return apiFailure(req, 400, { error: "Invalid userId" }, { phase: "validation", details: { field: "userId" } });
    }
    const parsedOccasion = parseOccasion(occasionData);
    if (!parsedOccasion) {
      return apiFailure(req, 400, { error: "Invalid occasion data" }, { phase: "validation", details: { field: "occasionData" } });
    }

    const occasionId = new ObjectId();
    const occasion = {
      ...parsedOccasion,
      id: occasionId,
      createdDate: new Date(),
      status: "Searching",
      score: null,
      scoringStatus: "Pending",
    };
    const client = await clientPromise;
    const result = await client
      .db("skybridge-cluster")
      .collection<{ _id: ObjectId; occasions: typeof occasion[] }>("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $push: { occasions: occasion } },
        { upsert: false },
      );

    if (!result.matchedCount) {
      return apiFailure(req, 404, { error: "User not found" }, { phase: "database", details: { entity: "user" } });
    }
    if (!result.modifiedCount) {
      return apiFailure(req, 409, { error: "Occasion was not stored" }, { phase: "database", details: { operation: "updateOne" } });
    }
    return NextResponse.json(
      { success: true, occasionId: occasionId.toHexString(), occasion },
      { status: 201 },
    );
  } catch (error) {
    return apiFailure(req, 500, { error: "Something went wrong" }, { phase: "add_occasion", error });
  }
}
