import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodbClientPromise";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { userId, occasionData } = await req.json();

    if (!userId || !occasionData) {
      return NextResponse.json(
        { error: "Missing userId or occasion data" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("skybridge-cluster");
    const users = db.collection("users");

    const objectId = new ObjectId(userId);

    if (typeof occasionData !== "object" || Array.isArray(occasionData)) {
      return NextResponse.json(
        { error: "Invalid occasion data format" },
        { status: 400 },
      );
    }

    // Generate a new ObjectId for the occasion
    const occasionId = new ObjectId();
    // Add the ID and status to the occasionData
    const occasionWithIdAndStatus = {
      ...occasionData,
      id: occasionId,
      status: occasionData.status || "Searching",
    };

    const updatedUser = await users.updateOne(
      { _id: objectId },
      [
        {
          $set: {
            occasions: {
              $concatArrays: [{ $ifNull: ["$occasions", []] }, [occasionWithIdAndStatus]],
            },
          },
        },
      ],
      { upsert: true },
    );

    if (!updatedUser.matchedCount && !updatedUser.upsertedCount) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!updatedUser.modifiedCount) {
      return NextResponse.json(
        { error: "Failed to add occasion" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Occasion added successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error adding occasion:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}