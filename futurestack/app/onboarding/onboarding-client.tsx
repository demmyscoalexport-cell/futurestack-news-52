"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, ArrowLeft, Sparkles, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ROLE_OPTIONS,
  INDUSTRY_OPTIONS,
  GOAL_OPTIONS,
  INTEREST_OPTIONS,
  savePreferences,
  type UserRole,
  type ExperienceLevel,
  type UserPreferences,
} from "@/lib/personalization";

const TOTAL_STEPS = 5;

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [role, setRole] = useState<UserRole | "">("");
  const [industry, setIndustry] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [goals, setGoals] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [africaFocus, setAfricaFocus] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(50);
  const [saving, setSaving] = useState(false);

  const paginate = (d: number) => {
    setDirection(d);
    setStep((s) => s + d);
  };

  const toggle = (list: string[], item: string, max: number, setter: (v: string[]) => void) => {
    if (list.includes(item)) setter(list.filter((x) => x !== item));
    else if (list.length < max) setter([...list, item]);
  };

  const handleFinish = async () => {
    setSaving(true);
    const prefs: UserPreferences = {
      role,
      industry,
      goals,
      interests,
      experience,
      existingTools: [],
      monthlyBudget,
      africaFocus,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };
    savePreferences(prefs);
    try {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
    } catch { /* localStorage is source of truth for guests */ }
    router.push("/discover");
    setSaving(false);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 80 : -80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background hero-glow">
      <header className="border-b border-neutral-stroke/40 px-4 py-4">
        <div className="container mx-auto flex items-center justify-between max-w-xl">
          <Link href="/" className="text-sm font-bold text-foreground">
            DIS<span className="text-brand-lilac">COVA</span>
          </Link>
          <span className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-xl">
          <div className="flex gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all",
                  step > i ? "bg-brand-primary" : "bg-neutral-stroke/60",
                )}
              />
            ))}
          </div>

          <div className="relative min-h-[420px]">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div key="s1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">What describes you best?</h1>
                  <p className="text-muted-foreground mb-6 text-sm">We&apos;ll personalize tools, stacks, and discovery for your role.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ROLE_OPTIONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => { setRole(r.id); paginate(1); }}
                        className={cn(
                          "p-4 rounded-discova-lg border text-left transition-all card-lift",
                          role === r.id
                            ? "border-brand-primary/50 bg-brand-primary/10"
                            : "border-neutral-stroke/60 glass-panel hover:border-brand-primary/30",
                        )}
                      >
                        <p className="font-bold text-sm text-foreground">{r.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">Your industry & experience</h1>
                  <p className="text-muted-foreground mb-6 text-sm">Helps us surface relevant tools and workflows.</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Industry</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setIndustry(ind)}
                        className={cn(
                          "px-3 py-1.5 rounded-pill border text-xs font-medium transition-all",
                          industry === ind
                            ? "border-brand-primary bg-brand-primary/15 text-brand-lilac"
                            : "border-neutral-stroke/60 text-muted-foreground hover:border-brand-primary/30",
                        )}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Experience with AI tools</p>
                  <div className="grid grid-cols-3 gap-2 mb-8">
                    {(["beginner", "intermediate", "advanced"] as ExperienceLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setExperience(lvl)}
                        className={cn(
                          "py-3 rounded-input border text-xs font-semibold capitalize transition-all",
                          experience === lvl
                            ? "border-brand-gold/50 bg-brand-gold/10 text-brand-gold"
                            : "border-neutral-stroke/60 text-muted-foreground",
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <NavButtons onBack={() => paginate(-1)} onNext={() => paginate(1)} nextDisabled={!industry || !experience} />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">What are your goals?</h1>
                  <p className="text-muted-foreground mb-6 text-sm">Pick up to 3 — we&apos;ll rank tools that match.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                    {GOAL_OPTIONS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggle(goals, g, 3, setGoals)}
                        className={cn(
                          "p-3.5 rounded-discova-lg border text-sm font-medium flex items-center justify-between transition-all",
                          goals.includes(g)
                            ? "border-brand-primary bg-brand-primary/10 text-brand-lilac"
                            : "border-neutral-stroke/60 text-foreground",
                        )}
                      >
                        {g}
                        {goals.includes(g) && <Check className="h-4 w-4 text-brand-primary" />}
                      </button>
                    ))}
                  </div>
                  <NavButtons onBack={() => paginate(-1)} onNext={() => paginate(1)} nextDisabled={goals.length === 0} />
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">Interests & focus</h1>
                  <p className="text-muted-foreground mb-6 text-sm">Fine-tune your discovery feed.</p>
                  <div className="grid grid-cols-2 gap-2.5 mb-6">
                    {INTEREST_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggle(interests, item, 4, setInterests)}
                        className={cn(
                          "p-3 rounded-input border text-xs font-medium flex items-center justify-between",
                          interests.includes(item)
                            ? "border-brand-primary bg-brand-primary/10 text-brand-lilac"
                            : "border-neutral-stroke/60 text-muted-foreground",
                        )}
                      >
                        {item}
                        {interests.includes(item) && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAfricaFocus(!africaFocus)}
                    className={cn(
                      "w-full p-4 rounded-discova-lg border flex items-center gap-3 mb-8 transition-all",
                      africaFocus
                        ? "border-brand-gold/50 bg-brand-gold/10"
                        : "border-neutral-stroke/60 glass-panel",
                    )}
                  >
                    <Globe className={cn("h-5 w-5", africaFocus ? "text-brand-gold" : "text-muted-foreground")} />
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">Africa-first discovery</p>
                      <p className="text-xs text-muted-foreground">Prioritize tools rated for African markets</p>
                    </div>
                    {africaFocus && <Check className="h-4 w-4 text-brand-gold ml-auto" />}
                  </button>
                  <NavButtons onBack={() => paginate(-1)} onNext={() => paginate(1)} nextDisabled={interests.length === 0} />
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="s5" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">Monthly tool budget</h1>
                  <p className="text-muted-foreground mb-8 text-sm">We&apos;ll avoid recommending tools beyond your limits.</p>
                  <div className="glass-panel border border-neutral-stroke/60 rounded-discova-lg p-6 sm:p-8 mb-8">
                    <div className="text-center font-black text-4xl sm:text-5xl text-brand-primary mb-6">
                      ${monthlyBudget}
                      <span className="text-lg text-muted-foreground font-medium">/mo</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={500}
                      step={10}
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                      className="w-full accent-brand-primary h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-3 font-semibold">
                      <span>$0 — Free only</span>
                      <span>$500+</span>
                    </div>
                  </div>
                  <div className="flex justify-between gap-3">
                    <button type="button" onClick={() => paginate(-1)} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-input bg-brand-primary text-neutral-white font-bold text-sm hover:bg-brand-primary/90 disabled:opacity-60"
                    >
                      <Sparkles className="h-4 w-4" />
                      {saving ? "Saving…" : "Start discovering"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="flex items-center gap-2 px-5 py-2.5 rounded-input bg-brand-primary text-neutral-white font-bold text-sm disabled:opacity-40"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
