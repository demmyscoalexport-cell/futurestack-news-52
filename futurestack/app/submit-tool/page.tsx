"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  "Basic Info",
  "Category & Audience",
  "Pricing",
  "Integrations",
  "Submit",
];

interface PricingTier {
  name: string;
  price: string;
  features: string;
}

export default function SubmitToolPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    url: "",
    tagline: "",
    description: "",
    logo: "",
    category: "",
    tags: "",
    best_for: "",
    pricingTiers: [
      { name: "Free", price: "$0", features: "Basic features" },
    ] as PricingTier[],
    integrations: "",
    contactEmail: "",
    contactName: "",
    applyForFeatured: false,
  });

  const update = (field: string, val: any) =>
    setForm((f) => ({ ...f, [field]: val }));

  const addPricingTier = () =>
    setForm((f) => ({
      ...f,
      pricingTiers: [...f.pricingTiers, { name: "", price: "", features: "" }],
    }));

  const updateTier = (i: number, field: keyof PricingTier, val: string) => {
    const tiers = [...form.pricingTiers];
    tiers[i] = { ...tiers[i], [field]: val };
    setForm((f) => ({ ...f, pricingTiers: tiers }));
  };

  const removeTier = (i: number) =>
    setForm((f) => ({
      ...f,
      pricingTiers: f.pricingTiers.filter((_, idx) => idx !== i),
    }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      alert("Submission failed. Please try again.");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">
            Tool Submitted!
          </h2>
          <p className="text-slate-400 mb-6">
            Our AI is validating your submission. You'll receive a confirmation
            email within 24–48 hours.
          </p>
          <button
            onClick={() => router.push("/tools")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-3">Submit Your AI Tool</h1>
          <p className="text-slate-400">
            Get discovered by 15,000+ builders and founders.
          </p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all ${
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-500"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-all ${i < step ? "bg-emerald-500" : "bg-slate-800"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Label */}
        <p className="text-center text-slate-400 text-sm font-semibold mb-8">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>

        {/* Step Content */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="s0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-5"
              >
                <Field
                  label="Tool Name *"
                  value={form.name}
                  onChange={(v) => update("name", v)}
                  placeholder="e.g. Cursor"
                />
                <Field
                  label="Website URL *"
                  value={form.url}
                  onChange={(v) => update("url", v)}
                  placeholder="https://cursor.sh"
                />
                <Field
                  label="Tagline *"
                  value={form.tagline}
                  onChange={(v) => update("tagline", v)}
                  placeholder="The AI-first code editor"
                />
                <TextareaField
                  label="Description *"
                  value={form.description}
                  onChange={(v) => update("description", v)}
                  placeholder="What does your tool do and who is it for?"
                />
                <Field
                  label="Logo URL"
                  value={form.logo}
                  onChange={(v) => update("logo", v)}
                  placeholder="https://..."
                  hint="Direct image URL (PNG or SVG, square format)"
                />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a category…</option>
                    {[
                      "Code & Dev",
                      "Writing & Content",
                      "Design",
                      "Video & Audio",
                      "Marketing",
                      "Data & Analytics",
                      "Automation",
                      "Customer Support",
                      "HR & Recruiting",
                      "Finance",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Tags"
                  value={form.tags}
                  onChange={(v) => update("tags", v)}
                  placeholder="ai, coding, productivity (comma-separated)"
                />
                <TextareaField
                  label="Best For"
                  value={form.best_for}
                  onChange={(v) => update("best_for", v)}
                  placeholder="Who gets the most value from this tool? (e.g. solo developers, enterprise teams...)"
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-4"
              >
                <p className="text-slate-400 text-sm">
                  Add your pricing tiers so users can compare plans.
                </p>
                {form.pricingTiers.map((tier, i) => (
                  <div
                    key={i}
                    className="bg-slate-800 rounded-2xl p-5 space-y-3 relative"
                  >
                    <button
                      onClick={() => removeTier(i)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Field
                      label="Tier Name"
                      value={tier.name}
                      onChange={(v) => updateTier(i, "name", v)}
                      placeholder="Free / Pro / Enterprise"
                    />
                    <Field
                      label="Price"
                      value={tier.price}
                      onChange={(v) => updateTier(i, "price", v)}
                      placeholder="$0 / $19/mo / Custom"
                    />
                    <Field
                      label="Key Features"
                      value={tier.features}
                      onChange={(v) => updateTier(i, "features", v)}
                      placeholder="100 requests/day, API access..."
                    />
                  </div>
                ))}
                <button
                  onClick={addPricingTier}
                  className="flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Another Tier
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-5"
              >
                <TextareaField
                  label="Integrations"
                  value={form.integrations}
                  onChange={(v) => update("integrations", v)}
                  placeholder="GitHub, Slack, Notion, Zapier... (one per line or comma-separated)"
                />
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="s4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-5"
              >
                <Field
                  label="Your Name *"
                  value={form.contactName}
                  onChange={(v) => update("contactName", v)}
                  placeholder="Jane Smith"
                />
                <Field
                  label="Contact Email *"
                  value={form.contactEmail}
                  onChange={(v) => update("contactEmail", v)}
                  placeholder="jane@yourtool.com"
                />
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.applyForFeatured}
                    onChange={(e) =>
                      update("applyForFeatured", e.target.checked)
                    }
                    className="mt-0.5 accent-indigo-500 w-4 h-4"
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">
                      Apply for Featured Listing
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      Get prominently placed on the homepage and radar. Our team
                      will reach out.
                    </div>
                  </div>
                </label>

                <div className="bg-slate-800 rounded-2xl p-5 mt-4">
                  <div className="text-sm text-slate-400">
                    Review submission:{" "}
                    <span className="text-white font-bold">{form.name}</span> ·{" "}
                    {form.url}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Category: {form.category} · Pricing tiers:{" "}
                    {form.pricingTiers.length}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
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
              {submitting ? "Submitting…" : "Submit Tool"}{" "}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-300 mb-2">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-300 mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
      />
    </div>
  );
}
