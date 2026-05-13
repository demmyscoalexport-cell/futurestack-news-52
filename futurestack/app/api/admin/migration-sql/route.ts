import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "supabase", "complete_migration.sql");
    const sql = readFileSync(filePath, "utf-8");

    return new Response(sql, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "inline; filename=discova_migration.sql",
      },
    });
  } catch {
    return new Response("Migration file not found. Run: npm run migrate:supabase", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
