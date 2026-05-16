/**
 * Server-side error logging — writes to the error_logs table.
 * Never throws; logging must never break the app.
 */
import { db } from "@/lib/db";

export type ErrorLevel = "error" | "warn" | "info";

export interface ErrorLogEntry {
  level?: ErrorLevel;
  message: string;
  stack?: string;
  url?: string;
  userId?: string;
  userEmail?: string;
  context?: Record<string, unknown>;
}

export async function logError(entry: ErrorLogEntry): Promise<void> {
  try {
    await db.query(
      `INSERT INTO error_logs (level, message, stack, url, user_id, user_email, context)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.level ?? "error",
        String(entry.message).slice(0, 2000),
        entry.stack ? String(entry.stack).slice(0, 5000) : null,
        entry.url ? String(entry.url).slice(0, 500) : null,
        entry.userId ?? null,
        entry.userEmail ?? null,
        JSON.stringify(entry.context ?? {}),
      ],
    );
  } catch {
    // Intentionally swallow — logging must never crash the app
  }
}

/** Convenience wrappers */
export const logger = {
  error: (message: string, ctx?: Omit<ErrorLogEntry, "level" | "message">) =>
    logError({ level: "error", message, ...ctx }),
  warn: (message: string, ctx?: Omit<ErrorLogEntry, "level" | "message">) =>
    logError({ level: "warn", message, ...ctx }),
  info: (message: string, ctx?: Omit<ErrorLogEntry, "level" | "message">) =>
    logError({ level: "info", message, ...ctx }),

  /** Log a caught Error object */
  fromError: (err: unknown, ctx?: Omit<ErrorLogEntry, "level" | "message">) => {
    const e = err instanceof Error ? err : new Error(String(err));
    return logError({ level: "error", message: e.message, stack: e.stack, ...ctx });
  },
};
