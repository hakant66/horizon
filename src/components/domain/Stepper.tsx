export function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <div className="flex min-w-max items-center gap-1.5 text-sm pb-1">
        {steps.map((step, idx) => {
          const done    = idx < currentStep;
          const active  = idx === currentStep;
          const pending = idx > currentStep;
          return (
            <div key={step} className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done    ? "bg-green-600 text-white" :
                  active  ? "bg-slate-900 text-white" :
                            "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : idx + 1}
              </div>
              <span className={`truncate max-w-24 sm:max-w-none text-xs ${pending ? "text-slate-400" : "text-slate-700 font-medium"}`}>
                {step}
              </span>
              {idx < steps.length - 1 && (
                <span className="text-slate-300 text-xs mx-0.5">›</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
