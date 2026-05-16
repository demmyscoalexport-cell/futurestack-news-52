import { db } from "@/lib/db";

export interface Opportunity {
  id: string;
  type: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  skills: string[];
  deadline: string | null;
  url: string;
  featured: boolean;
  africa: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  return fn().catch((e) => {
    console.error("[opportunities]", e?.message ?? e);
    return fallback;
  });
}

export async function getOpportunities({
  type,
  limit = 100,
  offset = 0,
}: {
  type?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Opportunity[]> {
  return safe(async () => {
    const conditions: string[] = ["status = 'active'"];
    const params: unknown[] = [];

    if (type && type !== "all") {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    params.push(limit);
    params.push(offset);

    const { rows } = await db.query(
      `SELECT * FROM opportunities
       WHERE ${conditions.join(" AND ")}
       ORDER BY featured DESC, created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return rows as Opportunity[];
  }, []);
}

export async function countOpportunitiesByType(): Promise<Record<string, number>> {
  return safe(async () => {
    const { rows } = await db.query(
      `SELECT type, COUNT(*)::int AS n FROM opportunities WHERE status = 'active' GROUP BY type`,
    );
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.type] = r.n;
    return counts;
  }, {});
}

export async function upsertOpportunity(data: Omit<Opportunity, "id" | "created_at" | "updated_at"> & { id?: string }) {
  const { id, type, title, company, location, salary, skills, deadline, url, featured, africa, status } = data;
  if (id) {
    const { rows } = await db.query(
      `UPDATE opportunities SET
        type=$1, title=$2, company=$3, location=$4, salary=$5,
        skills=$6, deadline=$7, url=$8, featured=$9, africa=$10, status=$11
       WHERE id=$12 RETURNING *`,
      [type, title, company, location, salary, skills ?? [], deadline, url, featured ?? false, africa ?? true, status ?? "active", id],
    );
    return rows[0] as Opportunity;
  }
  const { rows } = await db.query(
    `INSERT INTO opportunities (type, title, company, location, salary, skills, deadline, url, featured, africa, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [type, title, company, location, salary, skills ?? [], deadline, url, featured ?? false, africa ?? true, status ?? "active"],
  );
  return rows[0] as Opportunity;
}

export async function deleteOpportunity(id: string) {
  await db.query(`DELETE FROM opportunities WHERE id=$1`, [id]);
}
