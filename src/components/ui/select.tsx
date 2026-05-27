import { cn } from "@/lib/utils";

type Option = { label: string; value: string };

export function Select({
  value,
  onChange,
  options,
  className,
  name,
}: {
  value?: string;
  onChange?: (value: string) => void;
  options: Option[];
  className?: string;
  name?: string;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn("h-9 rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400", className)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
