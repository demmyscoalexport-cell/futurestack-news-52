import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const steps: Record<string, { file: string; label: string }> = {
  "1": { file: "deploy_schema.sql", label: "STEP 1 of 4 — Schema (run first)" },
  "2": { file: "step2_categories_tools_1.sql", label: "STEP 2 of 4 — Categories + Authors + Tools (1–200)" },
  "3": { file: "step3_tools_2_scores_1.sql", label: "STEP 3 of 4 — Tools (201–409) + Scores (1–200)" },
  "4": { file: "step4_scores_2_articles_stacks.sql", label: "STEP 4 of 4 — Scores (201–405) + Articles + Stacks" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get("step");

  if (!step || !steps[step]) {
    const links = Object.entries(steps)
      .map(([s, { label }]) => `<a href="?step=${s}" style="display:block;margin:12px 0;font-size:18px;color:#3b82f6">${label}</a>`)
      .join("");

    return new Response(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;background:#0f172a;color:#f1f5f9;max-width:600px;margin:0 auto">
      <h2 style="color:#fbbf24">DISCOVA — Supabase Migration</h2>
      <p style="color:#94a3b8">Run each step in order in your new Supabase project:<br>SQL Editor → New Query → paste → Run</p>
      ${links}
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    const { file, label } = steps[step];
    const sql = readFileSync(join(process.cwd(), "supabase", file), "utf-8");
    return new Response(`-- ${label}\n\n${sql}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new Response("File not found.", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
}
