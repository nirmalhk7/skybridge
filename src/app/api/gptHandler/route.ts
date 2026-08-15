import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { apiFailure } from "@/lib/apiFailure";

const MAX_MESSAGE_LENGTH = 4_000;

function parseScore(content: unknown): number | null {
  if (typeof content !== "string" || !/^\s*(?:10(?:\.0+)?|\d(?:\.\d+)?)\s*$/.test(content)) {
    return null;
  }
  const score = Number(content.trim());
  return Number.isFinite(score) && score >= 0 && score <= 10 ? score : null;
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiFailure(req, 401, { error: "Authentication required" }, { phase: "auth" });
    }
    if (session.user.role !== "fundraiser") {
      return apiFailure(req, 403, { error: "Fundraiser role required" }, { phase: "auth", details: { requiredRole: "fundraiser" } });
    }

    const { message } = await req.json();
    if (typeof message !== "string" || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
      return apiFailure(req, 400, { error: "A valid opportunity message is required" }, { phase: "validation", details: { field: "message" } });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return apiFailure(req, 503, { error: "Scoring service is not configured" }, { phase: "configuration", details: { variable: "OPENAI_API_KEY" } });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Score this sponsorship request from 0 to 10. Return only the numeric score.\n\n${message.trim()}`,
        }],
        max_tokens: 8,
        temperature: 0,
      }),
    });
    if (!response.ok) {
      return apiFailure(req, 502, { error: "Scoring provider unavailable" }, { phase: "provider", details: { providerStatus: response.status } });
    }
    const data = await response.json();
    const score = parseScore(data.choices?.[0]?.message?.content);
    if (score === null) {
      return apiFailure(req, 502, { error: "Scoring provider returned an invalid score" }, { phase: "provider", details: { reason: "invalid_score" } });
    }
    return NextResponse.json({ score });
  } catch (error) {
    return apiFailure(req, 500, { error: "Unable to score opportunity" }, { phase: "scoring", error });
  }
}
