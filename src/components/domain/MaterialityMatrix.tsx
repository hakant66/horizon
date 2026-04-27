"use client";

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

export function MaterialityMatrix({
  points,
}: {
  points: { name: string; financialImpactScore: number; impactSeverityScore: number }[];
}) {
  return (
    <div className="h-72 rounded-lg border border-slate-200 bg-white p-2">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid />
          <XAxis dataKey="financialImpactScore" type="number" name="Financial Impact" domain={[1, 5]} />
          <YAxis dataKey="impactSeverityScore" type="number" name="Impact Severity" domain={[1, 5]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={points} fill="#334155" name="Topics" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
