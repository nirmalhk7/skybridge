import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodbClientPromise";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const query: any = {};

    searchParams.forEach((value, key) => {
      query[`occasions.${key}`] = value;
    });

    if (Object.keys(query).length === 0) {
      return NextResponse.json(
        { error: "No search parameters provided" },
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
          $match: query,
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
