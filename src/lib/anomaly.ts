export interface AnomalyResult {
  pctChange: number;
  isWarning: boolean;
  isBlock: boolean;
}

const WARN_THRESHOLD = 50;
const BLOCK_THRESHOLD = 500;

export function detectAnomaly(current: number, previous: number): AnomalyResult | null {
  if (previous === 0) return null;
  const pctChange = ((current - previous) / Math.abs(previous)) * 100;
  const absPct = Math.abs(pctChange);
  if (absPct < WARN_THRESHOLD) return null;
  return {
    pctChange,
    isWarning: absPct < BLOCK_THRESHOLD,
    isBlock: absPct >= BLOCK_THRESHOLD,
  };
}
