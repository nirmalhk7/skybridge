import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodbClientPromise";
import { ObjectId } from "mongodb";

interface User {
  _id: ObjectId;
  scores: number[];
}

export async function POST(req: Request) {
  try {
    const { userId, score } = await req.json();

    if (!userId || score === undefined) {
      return NextResponse.json(
        { error: "Missing userId or score" },
        { status: 400 },
      );
    }

    if (typeof score !== "number") {
      return NextResponse.json(
        { error: "Score must be a number" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("skybridge-cluster");
    const users = db.collection<User>("users");
    const objectId = new ObjectId(userId);

    const updatedUser = await users.updateOne(
      { _id: objectId },
      {
        $push: { scores: score },
      },
      { upsert: true },
    );

    if (!updatedUser.matchedCount && !updatedUser.upsertedCount) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!updatedUser.modifiedCount) {
      return NextResponse.json(
        { error: "Failed to add score" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Score added successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error adding score:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
