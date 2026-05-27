import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <nav aria-label="Progress" className="mb-6 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-0">
        {steps.map((step, idx) => {
          const done   = idx < currentStep;
          const active = idx === currentStep;
          return (
            <li key={step} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-offset-1 transition-all",
                    done   && "bg-emerald-600 text-white ring-emerald-600",
                    active && "bg-slate-900 text-white ring-slate-900",
                    !done && !active && "bg-white text-slate-400 ring-slate-200",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <span>{idx + 1}</span>}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    active && "text-slate-900",
                    done   && "text-emerald-700",
                    !done && !active && "text-slate-400",
                  )}
                >
                  {step}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn("mx-3 h-px w-8 shrink-0", done ? "bg-emerald-300" : "bg-slate-200")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
