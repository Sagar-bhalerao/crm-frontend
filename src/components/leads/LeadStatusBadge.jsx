import { getStatus } from "@/config/leadStatuses";
import { Badge } from "@/components/ui";

export default function LeadStatusBadge({ status, className }) {
  const s = getStatus(status);
  return (
    <Badge tone={s.tone} dot className={className}>
      {s.label}
    </Badge>
  );
}
