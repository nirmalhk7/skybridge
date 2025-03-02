import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodbClientPromise";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.name || !data.email || !data.password || !data.role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("skybridge-cluster");
    const users = db.collection("users");

    const existingUser = await users.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    data.password = await bcrypt.hash(data.password, 10);

    const result = await users.insertOne({
      ...data,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { success: true, userId: result.insertedId.toString() },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
