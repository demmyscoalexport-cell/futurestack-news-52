"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, Check, Plus, Trash2, AlertCircle,
  Github, Twitter, Rocket, Star, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = ["Basic Info", "Developer Details", "Category & Audience", "Pricing", "Submit"];
const CATEGORIES: { label: string; value: string }[] = [
  { label: "Analytics",        value: "analytics" },
  { label: "Audio",            value: "audio" },
  { label: "Automation",       value: "automation" },
  { label: "Code & Dev",       value: "code" },
  { label: "Data & Research",  value: "data" },
  { label: "Design",           value: "design" },
  { label: "Marketing",        value: "marketing" },
  { label: "Productivity",     value: "productivity" },
  { label: "Video",            value: "video" },
  { label: "Writing & Content",value: "writing" },
];

interface PricingTier { name: string; price: string; features: string }

function stepValid(step: number, form: ReturnType<typeof defaultForm>): string | null {
  if (step === 0) {
    if (!form.name.trim()) return "Tool name is required";
    if (!form.url.trim() || !form.url.startsWith("http")) return "A valid website URL is required (start with https://)";
    if (!form.tagline.trim()) return "A tagline is required";
    if (form.tagline.length < 10) return "Tagline must be at least 10 characters";
    if (!form.description.trim()) return "Description is required";
    if (form.description.length < 50) return "Description must be at least 50 characters";
  }
  if (step === 1) {
    if (!form.contactName.trim()) return "Your name is required";
    if (!form.contactEmail.trim() || !form.contactEmail.includes("@")) return "A valid email address is required";
  }
  if (step === 2) {
    if (!form.category) return "Please select a category";
  }
  if (step === 3) {
    if (form.pricingTiers.length === 0) return "Add at least one pricing tier";
    if (form.pricingTiers.some(t => !t.name.trim() || !t.price.trim())) return "All pricing tiers must have a name and price";
  }
  return null;
}

function defaultForm() {
  return {
    name: "", url: "", tagline: "", description: "", logo: "", screenshot: "",
    category: "", tags: "", best_for: "",
    pricingTiers: [{ name: "Free", price: "$0", features: "Core features included" }] as PricingTier[],
    integrations: "",
    contactEmail: "", contactName: "", githubUrl: "", twitterHandle: "",
    africaFriendly: false, isOpenSource: false, applyForFeatured: false,
  };
}

export default function SubmitToolPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ slug: string } | null>(null);
  const [error, setError] = useState("");
  const [stepError, setStepError] = useState("");
  const [form, setForm] = useState(defaultForm());

  const update = (field: string, val: unknown) =>
    setForm(f => ({ ...f, [field]: val }));

  const addTier = () =>
    setForm(f => ({ ...f, pricingTiers: [...f.pricingTiers, { name: "", price: "", features: "" }] }));

  const updateTier = (i: number, field: keyof PricingTier, val: string) => {
    const tiers = [...form.pricingTiers];
    tiers[i] = { ...tiers[i], [field]: val };
    setForm(f => ({ ...f, pricingTiers: tiers }));
  };

  const removeTier = (i: number) =>
    setForm(f => ({ ...f, pricingTiers: f.pricingTiers.filter((_, idx) => idx !== i) }));

  function tryAdvance() {
    const err = stepValid(step, form);
    if (err) { setStepError(err); return; }
    setStepError("");
    setStep(s => s + 1);
  }

  async function handleSubmit() {
    const err = stepValid(step, form);
    if (err) { setStepError(err); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/submit-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted({ slug: data.slug });
      } else {
        setError(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center max-w-lg w-full">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">You&apos;re in the queue!</h2>
          <p className="text-slate-400 mb-2">
            <span className="text-white font-semibold">{form.name}</span> has been submitted for review.
            Our team will evaluate it within <span className="text-indigo-400 font-semibold">24–48 hours</span>.
          </p>
          <div className="bg-slate-800 rounded-xl px-4 py-3 mb-6 text-left">
            <p className="text-xs text-slate-500 mb-1">Your submission reference ID</p>
            <p className="font-mono text-indigo-400 font-bold text-sm">{submitted.slug}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 mb-6">
            <div className="flex items-start gap-3 bg-slate-800/60 rounded-xl p-3 text-left">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">What happens next?</p>
                <p className="text-xs text-slate-400 mt-0.5">Our team reviews your submission, checks the tool quality, and if approved — it goes live on DISCOVA instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-800/60 rounded-xl p-3 text-left">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0 mt-0.5">
                <Star className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Check your status anytime</p>
                <p className="text-xs text-slate-400 mt-0.5">Use your reference ID to track approval status.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/submit-tool/status/${submitted.slug}`}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm text-center"
            >
              Track Status
            </Link>
            <Link
              href="/tools"
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm text-center"
            >
              Browse Tools
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-700/40 text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Rocket className="w-3 h-3" /> Get discovered by 15,000+ builders
          </div>
          <h1 className="text-4xl font-black mb-2">Submit Your Tool</h1>
          <p className="text-slate-400 text-sm">
            List your SaaS, API, or dev tool on DISCOVA — Africa&apos;s #1 tool discovery platform.
          </p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all shrink-0 ${
                  i < step ? "bg-emerald-500 text-white" : i === step ? "bg-indigo-600 text-white ring-4 ring-indigo-600/20" : "bg-slate-800 text-slate-500"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1.5 transition-all ${i < step ? "bg-emerald-500" : "bg-slate-800"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-xs font-semibold mb-6 uppercase tracking-wider">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>

        {/* Step Content */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7">
          <AnimatePresence mode="wait">

            {/* STEP 0: Basic Info */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <Field label="Tool / App Name *" value={form.name} onChange={v => update("name", v)} placeholder="e.g. Supabase, Paystack, Cursor" />
                <Field label="Website URL *" value={form.url} onChange={v => update("url", v)} placeholder="https://yourtool.com" hint="The URL users visit to use or sign up for your tool" />
                <Field
                  label="Tagline *"
                  value={form.tagline}
                  onChange={v => update("tagline", v)}
                  placeholder="The open-source Firebase alternative"
                  hint={`${form.tagline.length}/80 chars — keep it punchy and clear`}
                  maxLength={80}
                />
                <TextareaField
                  label="Description *"
                  value={form.description}
                  onChange={v => update("description", v)}
                  placeholder="What does your tool do? Who is it for? What problem does it solve? Be specific..."
                  hint={`${form.description.length} chars — minimum 50, aim for 100–300`}
                  rows={4}
                />
                <Field label="Logo URL" value={form.logo} onChange={v => update("logo", v)} placeholder="https://yourtool.com/logo.png" hint="Square PNG or SVG, at least 128×128px. Or paste a Clearbit/favicon URL." />
                <Field label="Screenshot / Preview Image URL" value={form.screenshot} onChange={v => update("screenshot", v)} placeholder="https://yourtool.com/preview.png" hint="Optional — a screenshot or hero image of your tool in action" />
              </motion.div>
            )}

            {/* STEP 1: Developer Details */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <Field label="Your Full Name *" value={form.contactName} onChange={v => update("contactName", v)} placeholder="e.g. Amara Osei" />
                <Field label="Contact Email *" value={form.contactEmail} onChange={v => update("contactEmail", v)} placeholder="you@yourtool.com" hint="We'll use this to notify you of approval or ask follow-up questions" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-300 mb-2">
                      <Github className="w-3.5 h-3.5" /> GitHub URL
                    </label>
                    <input
                      value={form.githubUrl}
                      onChange={e => update("githubUrl", e.target.value)}
                      placeholder="https://github.com/yourorg"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-300 mb-2">
                      <Twitter className="w-3.5 h-3.5" /> Twitter / X
                    </label>
                    <input
                      value={form.twitterHandle}
                      onChange={e => update("twitterHandle", e.target.value)}
                      placeholder="@yourtool"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-1">
                  <Toggle
                    checked={form.africaFriendly}
                    onChange={v => update("africaFriendly", v)}
                    label="🌍 Africa-Friendly"
                    desc="Works well with African payment methods, languages, or is specifically built for African users"
                  />
                  <Toggle
                    checked={form.isOpenSource}
                    onChange={v => update("isOpenSource", v)}
                    label="Open Source"
                    desc="Source code is publicly available (provide GitHub URL above)"
                  />
                  <Toggle
                    checked={form.applyForFeatured}
                    onChange={v => update("applyForFeatured", v)}
                    label="⭐ Apply for Featured Listing"
                    desc="Get placed prominently on the homepage. Our team will reach out to discuss."
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: Category & Audience */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Category *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => update("category", c.value)}
                        className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                          form.category === c.value
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Tags" value={form.tags} onChange={v => update("tags", v)} placeholder="ai, automation, no-code, africa (comma-separated)" hint="Help users discover you — add up to 8 relevant tags" />
                <TextareaField
                  label="Who Is This Best For?"
                  value={form.best_for}
                  onChange={v => update("best_for", v)}
                  placeholder="e.g. Solo developers, African startups, Marketing teams building on a budget..."
                  rows={3}
                />
                <TextareaField
                  label="Key Integrations"
                  value={form.integrations}
                  onChange={v => update("integrations", v)}
                  placeholder="Slack, GitHub, Zapier, Stripe, Paystack... (comma-separated)"
                  rows={2}
                />
              </motion.div>
            )}

            {/* STEP 3: Pricing */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-slate-400 text-sm">Add your pricing tiers so users can compare plans.</p>
                {form.pricingTiers.map((tier, i) => (
                  <div key={i} className="bg-slate-800 rounded-2xl p-5 space-y-3 relative border border-slate-700">
                    {form.pricingTiers.length > 1 && (
                      <button onClick={() => removeTier(i)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tier Name" value={tier.name} onChange={v => updateTier(i, "name", v)} placeholder="Free / Pro / Enterprise" />
                      <Field label="Price" value={tier.price} onChange={v => updateTier(i, "price", v)} placeholder="$0 / $19/mo / Contact us" />
                    </div>
                    <Field label="Key Features (comma-separated)" value={tier.features} onChange={v => updateTier(i, "features", v)} placeholder="5 projects, 1GB storage, API access..." />
                  </div>
                ))}
                {form.pricingTiers.length < 5 && (
                  <button onClick={addTier} className="flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                    <Plus className="w-4 h-4" /> Add Another Tier
                  </button>
                )}
              </motion.div>
            )}

            {/* STEP 4: Review & Submit */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-white text-sm">Review Your Submission</h3>
                  <Row label="Tool" value={form.name} />
                  <Row label="URL" value={form.url} />
                  <Row label="Category" value={CATEGORIES.find(c => c.value === form.category)?.label ?? form.category} />
                  <Row label="Pricing Tiers" value={`${form.pricingTiers.length} tier${form.pricingTiers.length > 1 ? "s" : ""}`} />
                  <Row label="Contact" value={`${form.contactName} <${form.contactEmail}>`} />
                  {form.githubUrl && <Row label="GitHub" value={form.githubUrl} />}
                  {form.twitterHandle && <Row label="Twitter" value={form.twitterHandle} />}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.africaFriendly && <Badge>🌍 Africa-Friendly</Badge>}
                    {form.isOpenSource && <Badge>Open Source</Badge>}
                    {form.applyForFeatured && <Badge highlight>⭐ Featured Listing</Badge>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  By submitting, you confirm this is your tool and the information is accurate.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step Error */}
        {stepError && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/40 text-red-400 text-sm px-4 py-3 rounded-xl mt-4">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {stepError}
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/40 text-red-400 text-sm px-4 py-3 rounded-xl mt-4">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-5">
          <button
            onClick={() => { setStepError(""); setStep(s => s - 1); }}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={tryAdvance}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" /> Submit Tool
                </>
              )}
            </button>
          )}
        </div>

        {/* Already submitted? */}
        <p className="text-center text-slate-600 text-xs mt-5">
          Already submitted?{" "}
          <Link href="/submit-tool/status" className="text-indigo-400 hover:text-indigo-300 underline">
            Check your submission status
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, maxLength }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-300 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, hint, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-300 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? "bg-indigo-600" : "bg-slate-700"}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-slate-500 shrink-0 w-20">{label}</span>
      <span className="text-white font-medium truncate">{value}</span>
    </div>
  );
}

function Badge({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${highlight ? "bg-amber-900/40 text-amber-400 border border-amber-700/40" : "bg-slate-700 text-slate-300"}`}>
      {children}
    </span>
  );
}

// Star is referenced by lucide-react tree-shaking; keep to avoid dead-code removal
void Star;
