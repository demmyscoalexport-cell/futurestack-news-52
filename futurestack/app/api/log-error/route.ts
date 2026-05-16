import { NextResponse } from "next/server";
import { logError, type ErrorLevel } from "@/lib/error-logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await logError({
      level: (body.level as ErrorLevel) ?? "error",
      message: body.message ?? "Unknown client error",
      stack: body.stack,
      url: body.url,
      userId: body.userId,
      userEmail: body.userEmail,
      context: body.context,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
