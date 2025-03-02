import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodbClientPromise";
import { ObjectId } from "mongodb";

export async function PUT(req: Request) {
  try {
    const { occasionId, occasionData } = await req.json();

    if (!occasionId || !occasionData) {
      return NextResponse.json(
        { error: "Missing occasionId or occasion data" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("skybridge-cluster");
    const users = db.collection("users");

    const occasionObjectId = new ObjectId(occasionId);

    if (typeof occasionData !== "object" || Array.isArray(occasionData)) {
      return NextResponse.json(
        { error: "Invalid occasion data format" },
        { status: 400 },
      );
    }

    // Find the user with the given occasionId
    const user = await users.findOne({ "occasions.id": occasionObjectId });

    if (!user) {
      return NextResponse.json({ error: "Occasion not found" }, { status: 404 });
    }

    const userObjectId = user._id;

    // Find the existing occasion data
    const existingOccasion = user.occasions.find((occasion: any) => occasion.id && occasion.id.equals(occasionObjectId));

    if (!existingOccasion) {
      return NextResponse.json({ error: "Occasion not found" }, { status: 404 });
    }

    // Merge the existing occasion data with the new data
    const updatedOccasion = { ...existingOccasion, ...occasionData };

    const updatedUser = await users.updateOne(
      { _id: userObjectId, "occasions.id": occasionObjectId },
      { $set: { "occasions.$": updatedOccasion } },
      { upsert: false },
    );

    if (!updatedUser.matchedCount) {
      return NextResponse.json({ error: "Occasion not found" }, { status: 404 });
    }

    if (!updatedUser.modifiedCount) {
      return NextResponse.json(
        { error: "Failed to update occasion" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Occasion updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating occasion:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}