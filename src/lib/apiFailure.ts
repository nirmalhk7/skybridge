import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

type FailureBody = { error?: string } & Record<string, unknown>;

type FailureContext = {
  phase: string;
  details?: Record<string, unknown>;
  error?: unknown;
};

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
      ...((error as Error & { code?: unknown }).code !== undefined
        ? { code: (error as Error & { code?: unknown }).code }
        : {}),
    };
  }
  if (error === undefined) return undefined;
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}

export function apiFailure(
  req: Request,
  status: number,
  body: FailureBody,
  context: FailureContext,
) {
  const requestId = req.headers.get("x-request-id") || randomUUID();
  const payload = {
    event: "api_failure",
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    route: new URL(req.url).pathname,
    status,
    phase: context.phase,
    publicError: body.error,
    ...(context.details ? { details: context.details } : {}),
    ...(context.error !== undefined ? { cause: serializeError(context.error) } : {}),
  };

  console.error("[api_failure]", JSON.stringify(payload));
  return NextResponse.json(body, {
    status,
    headers: { "x-request-id": requestId },
  });
}
