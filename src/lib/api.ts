import { NextResponse } from "next/server";

export function apiError(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Unknown error";
  // Map auth errors thrown by requireRole/requireAuth to correct HTTP status
  if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 });
  if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 });
  return NextResponse.json({ error: message }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
