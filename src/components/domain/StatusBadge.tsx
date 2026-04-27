import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  if (["VALIDATED", "APPROVED", "ON_TRACK", "ACCEPTED", "CERTIFIED", "GENERATED", "COMPLETED"].includes(normalized)) {
    return <Badge variant="success">{status}</Badge>;
  }
  if (["NEEDS_CORRECTION", "REJECTED", "OFF_TRACK", "CHANGES_REQUESTED"].includes(normalized)) {
    return <Badge variant="danger">{status}</Badge>;
  }
  if (["UNDER_REVIEW", "SUBMITTED", "IN_PROGRESS", "AT_RISK"].includes(normalized)) {
    return <Badge variant="warning">{status}</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
}
