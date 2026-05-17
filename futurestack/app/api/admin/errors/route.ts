import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";

export async function GET(req: Request) {
  await checkAdminOrRedirect();
  const { searchParams } = new URL(req.url);
  const level    = searchParams.get("level")    ?? "";
  const resolved = searchParams.get("resolved") ?? "false";
  const limit    = Math.min(parseInt(searchParams.get("limit")  ?? "50"), 200);
  const offset   = parseInt(searchParams.get("offset") ?? "0");

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (level) {
    params.push(level);
    conditions.push(`level = $${params.length}`);
  }
  if (resolved !== "all") {
    params.push(resolved === "true");
    conditions.push(`resolved = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const dataParams  = [...params, limit, offset];
  const countParams = [...params];

  const [rows, countResult, stats] = await Promise.all([
    db.query(
      `SELECT id, level, message, stack, url, user_email, context, resolved, created_at
       FROM error_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    ),
    db.query(`SELECT COUNT(*) FROM error_logs ${where}`, countParams),
    db.query(`
      SELECT
        COUNT(*) FILTER (WHERE level = 'error')                                   AS total_errors,
        COUNT(*) FILTER (WHERE level = 'warn')                                    AS total_warns,
        COUNT(*) FILTER (WHERE level = 'info')                                    AS total_info,
        COUNT(*) FILTER (WHERE resolved = false AND level = 'error')              AS open_errors,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')          AS last_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour')            AS last_1h
      FROM error_logs
    `),
  ]);

  return NextResponse.json({
    rows: rows.rows,
    total: Number(countResult.rows[0].count),
    stats: stats.rows[0],
  });
}

export async function PATCH(req: Request) {
  await checkAdminOrRedirect();
  const { id, resolved } = await req.json();
  await db.query(`UPDATE error_logs SET resolved = $1 WHERE id = $2`, [resolved, id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  await checkAdminOrRedirect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    await db.query(`DELETE FROM error_logs WHERE id = $1`, [id]);
  } else {
    await db.query(`DELETE FROM error_logs WHERE resolved = true`);
  }
  return NextResponse.json({ ok: true });
}
