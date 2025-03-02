import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodbClientPromise";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("skybridge-cluster");
    const users = db.collection("users");

    const objectId = new ObjectId(userId);

    const user = await users.findOne({ _id: objectId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const occasions = user.occasions || [];

    return NextResponse.json(
      { success: true, occasions },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching occasions:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}