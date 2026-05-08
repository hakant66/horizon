"use client";

import { useI18n } from "@/components/providers/LanguageProvider";

type RiskPoint = {
  id: string;
  name: string;
  probabilityScore: number; // 1–5
  impactScore: number;      // 1–5
  status: string;
};

const CELL_SIZE = 52;
const PADDING = 48;

// Color per risk score (1–25)
function cellColor(prob: number, imp: number): string {
  const score = prob * imp;
  if (score >= 16) return "#fca5a5"; // red-300
  if (score >= 9)  return "#fde68a"; // amber-200
  if (score >= 4)  return "#bfdbfe"; // blue-200
  return "#dcfce7";                  // green-100
}

function labelColor(prob: number, imp: number): string {
  const score = prob * imp;
  if (score >= 16) return "#991b1b";
  if (score >= 9)  return "#92400e";
  if (score >= 4)  return "#1d4ed8";
  return "#166534";
}

const PROB_LABELS = {
  tr: ["Çok Düşük", "Düşük", "Orta", "Yüksek", "Çok Yüksek"],
  en: ["Very Low", "Low", "Medium", "High", "Very High"],
};

const IMP_LABELS = {
  tr: ["Çok Düşük", "Düşük", "Orta", "Yüksek", "Çok Yüksek"],
  en: ["Very Low", "Low", "Medium", "High", "Very High"],
};

export function RiskHeatMap({
  risks,
  onSelect,
}: {
  risks: RiskPoint[];
  onSelect?: (id: string) => void;
}) {
  const { locale } = useI18n();
  const tr = locale === "tr";
  const probLabels = tr ? PROB_LABELS.tr : PROB_LABELS.en;
  const impLabels  = tr ? IMP_LABELS.tr  : IMP_LABELS.en;

  const svgW = PADDING + 5 * CELL_SIZE + 8;
  const svgH = PADDING + 5 * CELL_SIZE + 8;

  // Group risks by cell
  const cellMap: Record<string, RiskPoint[]> = {};
  for (const r of risks) {
    const prob = Math.min(5, Math.max(1, r.probabilityScore));
    const imp  = Math.min(5, Math.max(1, r.impactScore));
    const key  = `${prob}-${imp}`;
    if (!cellMap[key]) cellMap[key] = [];
    cellMap[key].push(r);
  }

  return (
    <div className="overflow-x-auto">
      <p className="mb-1 text-xs text-slate-500">
        {tr ? "Risk Isı Haritası — olasılık × etki" : "Risk Heat Map — probability × impact"}
      </p>
      <svg
        width={svgW}
        height={svgH}
        style={{ fontFamily: "inherit" }}
        role="img"
        aria-label={tr ? "Risk ısı haritası" : "Risk heat map"}
      >
        {/* Y-axis label */}
        <text
          x={10}
          y={PADDING + (5 * CELL_SIZE) / 2}
          fontSize={9}
          fill="#64748b"
          textAnchor="middle"
          transform={`rotate(-90, 10, ${PADDING + (5 * CELL_SIZE) / 2})`}
        >
          {tr ? "Olasılık →" : "Probability →"}
        </text>

        {/* X-axis label */}
        <text
          x={PADDING + (5 * CELL_SIZE) / 2}
          y={svgH - 2}
          fontSize={9}
          fill="#64748b"
          textAnchor="middle"
        >
          {tr ? "Etki →" : "Impact →"}
        </text>

        {/* Axis tick labels */}
        {[1, 2, 3, 4, 5].map((i) => (
          <g key={`axis-${i}`}>
            {/* X (impact) labels */}
            <text
              x={PADDING + (i - 1) * CELL_SIZE + CELL_SIZE / 2}
              y={PADDING - 4}
              fontSize={8}
              fill="#94a3b8"
              textAnchor="middle"
            >
              {impLabels[i - 1]}
            </text>
            {/* Y (probability) labels */}
            <text
              x={PADDING - 4}
              y={PADDING + (5 - i) * CELL_SIZE + CELL_SIZE / 2 + 3}
              fontSize={8}
              fill="#94a3b8"
              textAnchor="end"
            >
              {probLabels[i - 1]}
            </text>
          </g>
        ))}

        {/* Grid cells */}
        {[1, 2, 3, 4, 5].map((prob) =>
          [1, 2, 3, 4, 5].map((imp) => {
            const x = PADDING + (imp - 1) * CELL_SIZE;
            const y = PADDING + (5 - prob) * CELL_SIZE;
            const key = `${prob}-${imp}`;
            const cellRisks = cellMap[key] ?? [];
            const bg = cellColor(prob, imp);
            const textCol = labelColor(prob, imp);

            return (
              <g key={key}>
                <rect
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={bg}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  rx={2}
                />
                {cellRisks.length > 0 && (
                  <>
                    <text
                      x={x + CELL_SIZE / 2}
                      y={y + CELL_SIZE / 2 - 6}
                      fontSize={16}
                      fontWeight="bold"
                      fill={textCol}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {cellRisks.length}
                    </text>
                    <text
                      x={x + CELL_SIZE / 2}
                      y={y + CELL_SIZE / 2 + 10}
                      fontSize={7}
                      fill={textCol}
                      textAnchor="middle"
                    >
                      {cellRisks.length === 1 ? cellRisks[0].name.slice(0, 10) : (tr ? "risk" : "risks")}
                    </text>
                    {onSelect && cellRisks.length === 1 && (
                      <rect
                        x={x}
                        y={y}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        fill="transparent"
                        style={{ cursor: "pointer" }}
                        onClick={() => onSelect(cellRisks[0].id)}
                      />
                    )}
                  </>
                )}
              </g>
            );
          })
        )}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        {[
          { color: "#fca5a5", label: tr ? "Kritik (≥16)" : "Critical (≥16)" },
          { color: "#fde68a", label: tr ? "Yüksek (9–15)" : "High (9–15)" },
          { color: "#bfdbfe", label: tr ? "Orta (4–8)" : "Medium (4–8)" },
          { color: "#dcfce7", label: tr ? "Düşük (1–3)" : "Low (1–3)" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-slate-200"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
