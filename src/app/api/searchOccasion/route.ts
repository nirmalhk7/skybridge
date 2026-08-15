import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodbClientPromise";
import {
  buildOccasionSearchPipeline,
  buildOccasionSearchQuery,
} from "@/lib/occasionSearch";
import { apiFailure } from "@/lib/apiFailure";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiFailure(req, 401, { error: "Authentication required" }, { phase: "auth" });
    }
    if (session.user.role !== "sponsorer") {
      return apiFailure(req, 403, { error: "Sponsorer role required" }, { phase: "auth", details: { requiredRole: "sponsorer" } });
    }

    const searchParams = new URL(req.url).searchParams;
    if (!searchParams.size) {
      return apiFailure(req, 400, { error: "No search parameters provided" }, { phase: "validation", details: { field: "searchParams" } });
    }

    let query;
    try {
      query = buildOccasionSearchQuery(searchParams, session.user.id);
    } catch (error) {
      const forbidden = (error as Error).message === "Forbidden sponsorerId";
      return apiFailure(req,
        forbidden ? 403 : 400,
        { error: forbidden ? "Cannot view another sponsor's matches" : "Invalid search parameters" },
        { phase: forbidden ? "authorization" : "validation", details: { field: "searchParams" }, error },
      );
    }

    const client = await clientPromise;
    const results = await client
      .db("skybridge-cluster")
      .collection("users")
      .aggregate(buildOccasionSearchPipeline(query))
      .toArray();
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return apiFailure(req, 500, { error: "Something went wrong" }, { phase: "search_occasions", error });
  }
}
