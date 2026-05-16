import { db } from "@/lib/db";

export interface Deal {
  id: string;
  name: string;
  tagline: string | null;
  discount: string;
  original_price: string | null;
  deal_price: string;
  category: string | null;
  expiry: string | null;
  badge: string | null;
  badge_color: string | null;
  hot: boolean;
  africa: boolean;
  type: string;
  url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  return fn().catch((e) => {
    console.error("[deals]", e?.message ?? e);
    return fallback;
  });
}

export async function getDeals({
  type,
  category,
  limit = 100,
  offset = 0,
}: {
  type?: string;
  category?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Deal[]> {
  return safe(async () => {
    const conditions: string[] = ["status = 'active'"];
    const params: unknown[] = [];

    if (type && type !== "all") {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }
    if (category && category !== "All Tools") {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    params.push(limit);
    params.push(offset);

    const { rows } = await db.query(
      `SELECT * FROM deals
       WHERE ${conditions.join(" AND ")}
       ORDER BY hot DESC, created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return rows as Deal[];
  }, []);
}

export async function upsertDeal(data: Omit<Deal, "id" | "created_at" | "updated_at"> & { id?: string }) {
  const { id, name, tagline, discount, original_price, deal_price, category, expiry, badge, badge_color, hot, africa, type, url, status } = data;
  if (id) {
    const { rows } = await db.query(
      `UPDATE deals SET
        name=$1, tagline=$2, discount=$3, original_price=$4, deal_price=$5,
        category=$6, expiry=$7, badge=$8, badge_color=$9, hot=$10,
        africa=$11, type=$12, url=$13, status=$14
       WHERE id=$15 RETURNING *`,
      [name, tagline, discount, original_price, deal_price, category, expiry, badge, badge_color, hot ?? false, africa ?? true, type ?? "free", url, status ?? "active", id],
    );
    return rows[0] as Deal;
  }
  const { rows } = await db.query(
    `INSERT INTO deals (name, tagline, discount, original_price, deal_price, category, expiry, badge, badge_color, hot, africa, type, url, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [name, tagline, discount, original_price, deal_price, category, expiry ?? "Ongoing", badge, badge_color, hot ?? false, africa ?? true, type ?? "free", url, status ?? "active"],
  );
  return rows[0] as Deal;
}

export async function deleteDeal(id: string) {
  await db.query(`DELETE FROM deals WHERE id=$1`, [id]);
}
