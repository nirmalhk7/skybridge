import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodbClientPromise";
import { ObjectId } from "mongodb";

interface Occasion {
  title: string;
  date: string;
  description?: string;
}

interface User {
  _id: ObjectId;
  occasions?: Occasion[];
  scores?: number[];
}

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
    const users = db.collection<User>("users");

    const objectId = new ObjectId(userId);

    const updatedUser = await users.updateOne(
      { _id: objectId },
      { $push: { occasions: occasionData as Occasion } },
      { upsert: true },
    );
    

    if (!updatedUser.matchedCount) {
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
