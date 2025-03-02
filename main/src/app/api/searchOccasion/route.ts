import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodbClientPromise";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const agePreference = url.searchParams.get("agePreference");
    const countryPreference = url.searchParams.get("countryPreference");
    const statePreference = url.searchParams.get("statePreference");
    const typePreference = url.searchParams.get("typePreference");

    if (
      !agePreference ||
      !countryPreference ||
      !statePreference ||
      !typePreference
    ) {
      return NextResponse.json(
        { error: "Missing one or more search parameters" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("skybridge-cluster");
    const users = db.collection("users");

    const searchResults = await users
      .aggregate([
        { $unwind: "$occasions" },
        {
          $match: {
            "occasions.agePreference": agePreference,
            "occasions.countryPreference": countryPreference,
            "occasions.statePreference": statePreference,
            "occasions.typePreference": typePreference,
          },
        },
        {
          $addFields: {
            scoreVal: { $arrayElemAt: ["$scores", 0] },
          },
        },
        { $sort: { scoreVal: -1 } },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            occasion: {
              $mergeObjects: [
                "$occasions",
                { score: { $ifNull: ["$scoreVal", "N/A"] } },
              ],
            },
          },
        },
      ])
      .toArray();

    return NextResponse.json(searchResults, { status: 200 });
  } catch (error) {
    console.error("Error searching occasions:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
