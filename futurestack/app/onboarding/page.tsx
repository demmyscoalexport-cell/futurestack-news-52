"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const [direction, setDirection] = useState(0);
  const [role, setRole] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [budget, setBudget] = useState(50);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep(step + newDirection);
  };

  const handleFinish = async () => {
    // In production, sync with Supabase profiles table
    // await fetch('/api/user/profile', { method: 'POST', body: JSON.stringify({ role, goals, budget }) })
    router.push("/dashboard");
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl relative h-[500px]">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full flex justify-between gap-2 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all duration-500 \${step >= i ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            />
          ))}
        </div>

        <div className="mt-12 h-full relative">
          <AnimatePresence initial={false} custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0"
              >
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  Welcome! What describes you best?
                </h1>
                <p className="text-slate-500 mb-8">
                  We'll pair you with the best AI tools for your stack.
                </p>
                <div className="space-y-3">
                  {[
                    "Software Engineer",
                    "Founder / Indie Hacker",
                    "Creative Designer",
                    "Marketer",
                    "Agency Owner",
                  ].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r);
                        paginate(1);
                      }}
                      className={`w-full p-4 rounded-xl border text-left font-semibold transition-all \${role === r ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0"
              >
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  What are your primary goals?
                </h1>
                <p className="text-slate-500 mb-8">
                  Select 1-3 goals to personalize your radar.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    "Code Faster",
                    "Automate Tasks",
                    "Write Content",
                    "Generate UI",
                    "Analyze Data",
                    "Build Apps",
                    "Edit Video",
                    "Boost Sales",
                  ].map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        if (goals.includes(g))
                          setGoals(goals.filter((x) => x !== g));
                        else if (goals.length < 3) setGoals([...goals, g]);
                      }}
                      className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between transition-all \${goals.includes(g) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
                    >
                      {g}
                      {goals.includes(g) && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => paginate(-1)}
                    className="px-6 py-3 font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => paginate(1)}
                    disabled={goals.length === 0}
                    className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 flex items-center gap-2"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0"
              >
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  What is your monthly tool budget?
                </h1>
                <p className="text-slate-500 mb-12">
                  We'll avoid recommending tools beyond your limits.
                </p>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8">
                  <div className="text-center font-black text-5xl text-indigo-600 dark:text-indigo-400 mb-8">
                    ${budget}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={budget}
                    onChange={(e) => setBudget(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-4 font-bold">
                    <span>$0 (Free Only)</span>
                    <span>$500+</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => paginate(-1)}
                    className="px-6 py-3 font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => paginate(1)}
                    className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0"
              >
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  Which tools do you currently use?
                </h1>
                <p className="text-slate-500 mb-8">
                  Select tools to skip recommending what you already know.
                </p>

                {/* Simplified multi-select mockup */}
                <div className="flex flex-wrap gap-2 mb-12">
                  {[
                    "ChatGPT",
                    "Claude",
                    "Cursor",
                    "GitHub Copilot",
                    "Vercel v0",
                    "Midjourney",
                  ].map((t) => (
                    <button
                      key={t}
                      className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold hover:border-indigo-500 transition-colors"
                    >
                      + {t}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-16">
                  <button
                    onClick={() => paginate(-1)}
                    className="px-6 py-3 font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinish}
                    className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2"
                  >
                    Finish Setup <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
