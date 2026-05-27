import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />;
}

export function TableHeader(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="border-b border-slate-200 bg-slate-50/60" {...props} />;
}

export function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-slate-100" {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-slate-50/80 data-[selected]:bg-blue-50/40", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-9 px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-widest text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2.5 align-middle text-sm text-slate-700", className)} {...props} />;
}
