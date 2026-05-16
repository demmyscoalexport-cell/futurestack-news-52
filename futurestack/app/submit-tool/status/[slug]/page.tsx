import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { CheckCircle2, Clock, XCircle, ArrowLeft, ExternalLink, Rocket } from "lucide-react";

interface PageProps { params: Promise<{ slug: string }> }

async function getSubmission(slug: string) {
  try {
    const { rows } = await db.query(
      `SELECT id, name, slug, tagline, logo, status, website, website_url, source, pricing_details, created_at
       FROM tools WHERE slug = $1 AND source = 'developer' LIMIT 1`,
      [slug],
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

const STATUS_CONFIG = {
  pending_review: {
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    label: "Under Review",
    message: "Your submission is in the queue. Our team typically reviews within 24–48 hours.",
  },
  active: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Live on DISCOVA! 🎉",
    message: "Congratulations — your tool is approved and visible to thousands of builders.",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    label: "Not Approved",
    message: "Your submission didn't meet our quality guidelines this time. You're welcome to resubmit with more detail.",
  },
  pending: {
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    label: "Under Review",
    message: "Your submission is in the queue. Our team typically reviews within 24–48 hours.",
  },
};

export default async function SubmissionStatusPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await getSubmission(slug);

  if (!tool) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Submission Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">
            No submission found for reference ID <code className="text-indigo-400 font-mono">{slug}</code>.
            Double-check the ID from your confirmation.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/submit-tool" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl text-sm text-center transition-colors">
              Submit a New Tool
            </Link>
            <Link href="/submit-tool/status" className="text-slate-400 hover:text-white text-sm text-center transition-colors">
              Try Another ID
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = tool.status as keyof typeof STATUS_CONFIG;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending_review;
  const Icon = cfg.icon;
  const meta = tool.pricing_details as {
    submitted_by?: { name?: string; email?: string; github?: string; twitter?: string };
    apply_for_featured?: boolean;
    submitted_at?: string;
  } | null;
  const submittedBy = meta?.submitted_by;
  const submittedAt = meta?.submitted_at
    ? new Date(meta.submitted_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
    : new Date(tool.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-lg mx-auto">

        <Link href="/submit-tool" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Submit another tool
        </Link>

        {/* Status Card */}
        <div className={`rounded-2xl border p-6 mb-5 ${cfg.bg}`}>
          <div className="flex items-center gap-3 mb-2">
            <Icon className={`w-6 h-6 ${cfg.color}`} />
            <h2 className={`text-lg font-black ${cfg.color}`}>{cfg.label}</h2>
          </div>
          <p className="text-slate-300 text-sm">{cfg.message}</p>
        </div>

        {/* Tool Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-5">
          <div className="flex items-start gap-4 mb-5">
            {tool.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tool.logo} alt="" className="w-14 h-14 rounded-xl object-contain bg-white p-1.5 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-black text-2xl shrink-0">
                {tool.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-white">{tool.name}</h1>
              {tool.tagline && <p className="text-slate-400 text-sm mt-0.5">{tool.tagline}</p>}
            </div>
          </div>

          <div className="space-y-2.5 text-sm">
            <InfoRow label="Reference ID" value={<code className="font-mono text-indigo-400 text-xs">{slug}</code>} />
            <InfoRow label="Submitted" value={submittedAt} />
            {submittedBy?.name && <InfoRow label="Submitted by" value={submittedBy.name} />}
            {submittedBy?.email && <InfoRow label="Email" value={submittedBy.email} />}
            {meta?.apply_for_featured && (
              <InfoRow label="Featured listing" value={<span className="text-amber-400 font-semibold">✓ Applied</span>} />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {status === "active" && (tool.website || tool.website_url) && (
            <a
              href={`/tools/${slug}`}
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" /> View Your Tool on DISCOVA
            </a>
          )}
          {(status === "rejected" || status === "pending_review") && (
            <Link
              href="/submit-tool"
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm"
            >
              <Rocket className="w-4 h-4" />
              {status === "rejected" ? "Resubmit with More Detail" : "Submit Another Tool"}
            </Link>
          )}
          <Link
            href="/tools"
            className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            Browse All Tools
          </Link>
        </div>

        {status === "pending_review" && (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">While you wait...</p>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>Make sure your landing page is live and clear</li>
              <li>Prepare a short demo video or GIF</li>
              <li>Set up your pricing page with clear plans</li>
              <li>Share your submission ID: <code className="text-indigo-400">{slug}</code></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
