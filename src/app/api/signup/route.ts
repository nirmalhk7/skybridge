import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodbClientPromise";
import bcrypt from "bcryptjs";
import { getAddress, isAddress, ZeroAddress } from "ethers";
import { apiFailure } from "@/lib/apiFailure";

const VALID_ROLES = new Set(["fundraiser", "sponsorer"]);

function normalizeRole(role: unknown) {
  if (typeof role !== "string") return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === "sponsor") return "sponsorer";
  return VALID_ROLES.has(normalized) ? normalized : null;
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const password = typeof data.password === "string" ? data.password : "";
    const role = normalizeRole(data.role);

    if (!name || !email || password.length < 8 || !role) {
      return apiFailure(req, 400,
        { error: "Invalid signup fields" },
        { phase: "validation", details: {
          missingOrInvalid: [
            ...(name ? [] : ["name"]),
            ...(email ? [] : ["email"]),
            ...(password.length >= 8 ? [] : ["password"]),
            ...(role ? [] : ["role"]),
          ],
        } },
      );
    }
    if (
      typeof data.accountAddress !== "string" ||
      !isAddress(data.accountAddress) ||
      getAddress(data.accountAddress) === ZeroAddress
    ) {
      return apiFailure(req, 400,
        { error: "Invalid accountAddress" },
        { phase: "validation", details: { field: "accountAddress" } },
      );
    }
    const accountAddress = getAddress(data.accountAddress);

    const client = await clientPromise;
    const db = client.db("skybridge-cluster");
    const users = db.collection("users");

    const existingUser = await users.findOne(
      { email },
      { projection: { _id: 1 } },
    );
    if (existingUser) {
      return apiFailure(req, 409,
        { error: "User with this email already exists" },
        { phase: "duplicate_check", details: { field: "email" } },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
      name,
      email,
      password: passwordHash,
      role,
      accountAddress,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { success: true, userId: result.insertedId.toString() },
      { status: 201 },
    );
  } catch (error: any) {
    if (error?.code === 11000) {
      return apiFailure(req, 409,
        { error: "User with this email already exists" },
        { phase: "insert", details: { field: "email" }, error },
      );
    }
    return apiFailure(req, 500,
      { error: "Something went wrong" },
      { phase: "signup", error },
    );
  }
}
