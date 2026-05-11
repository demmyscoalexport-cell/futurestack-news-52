import { ShieldCheck, Check, X } from "lucide-react";

interface FreelancerSignals {
  has_free_tier: boolean;
  api_accessible: boolean;
  works_offline: boolean;
  gdpr_compliant: boolean;
  no_credit_card_required: boolean;
}

export function FreelancerTrustSignals({ tool }: { tool: any }) {
  // Using dummy/mock mapped signals for UI demonstration based strictly on the phase requirement
  const signals: FreelancerSignals = {
    has_free_tier: tool.has_free !== false,
    api_accessible: true,
    works_offline: false,
    gdpr_compliant: true,
    no_credit_card_required: tool.has_free !== false,
  };

  const list = [
    { label: "Free Tier Available", active: signals.has_free_tier },
    { label: "API Access", active: signals.api_accessible },
    { label: "Offline Mode", active: signals.works_offline },
    { label: "GDPR Compliant", active: signals.gdpr_compliant },
    {
      label: "No CC Required for Trial",
      active: signals.no_credit_card_required,
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mt-6">
      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-emerald-500" />
        Freelancer Trust Signals
      </h3>
      <ul className="space-y-2.5">
        {list.map((item, idx) => (
          <li key={idx} className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              {item.label}
            </span>
            {item.active ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <X className="w-4 h-4 text-slate-300 dark:text-slate-700" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
