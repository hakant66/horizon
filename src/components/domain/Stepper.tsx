export function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`rounded-full px-2 py-1 ${
              idx <= currentStep ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {idx + 1}
          </div>
          <span>{step}</span>
          {idx < steps.length - 1 ? <span className="text-slate-400">→</span> : null}
        </div>
      ))}
    </div>
  );
}
