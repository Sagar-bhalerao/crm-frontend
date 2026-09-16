import {
  ArrowRightLeft,
  CheckCircle2,
  CircleDot,
  FilePlus2,
  FileText,
  Globe,
  Mail,
  MailOpen,
  MessageCircle,
  PencilLine,
  PhoneCall,
  Receipt,
  Send,
  UserPlus,
  Undo2,
} from "lucide-react";
import { formatDate, formatTime, isSameDay } from "@/lib/format";
import { cx } from "@/lib/utils";

/**
 * Icon + colour per activity type. Add new activity types here.
 */
export const ACTIVITY_TYPES = {
  lead_received: { icon: Globe, tone: "blue" },
  lead_created: { icon: FilePlus2, tone: "blue" },
  assigned: { icon: UserPlus, tone: "gray" },
  reassigned: { icon: ArrowRightLeft, tone: "gray" },
  status_changed: { icon: CircleDot, tone: "amber" },
  follow_up: { icon: PhoneCall, tone: "amber" },
  email_sent: { icon: Mail, tone: "gray" },
  email_received: { icon: MailOpen, tone: "blue" },
  quotation_created: { icon: FileText, tone: "violet" },
  quotation_shared: { icon: FileText, tone: "violet" },
  invoice_shared: { icon: Receipt, tone: "teal" },
  invoice_withdrawn: { icon: Undo2, tone: "gray" },
  finalized: { icon: CheckCircle2, tone: "green" },
  confirmation_sent: { icon: Send, tone: "green" },
  whatsapp: { icon: MessageCircle, tone: "green" },
  updated: { icon: PencilLine, tone: "gray" },
};

/** Activity history, newest first, grouped by day. */
export default function LeadTimeline({ activities = [], people = {}, limit }) {
  const items = limit ? activities.slice(0, limit) : activities;

  return (
    <ol className="relative">
      {items.map((a, i) => {
        const config = ACTIVITY_TYPES[a.type] || { icon: CircleDot, tone: "gray" };
        const Icon = config.icon;
        const newDay = i === 0 || !isSameDay(a.at, items[i - 1].at);
        const last = i === items.length - 1;

        return (
          <li key={a.id}>
            {newDay && <p className={cx("mb-2 text-xs font-medium text-muted", i > 0 && "mt-4")}>{formatDate(a.at)}</p>}
            <div className="relative flex gap-3 pb-4">
              {!last && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-line" aria-hidden />}
              <span className={cx("relative grid h-7 w-7 shrink-0 place-items-center rounded-full", `tone-${config.tone}`, "bg-[var(--tone-soft)] text-[var(--tone)]")}>
                <Icon size={14} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm text-ink">{a.message}</p>
                <p className="meta mt-0.5">
                  {formatTime(a.at)}
                  {a.byId ? ` by ${people[a.byId] || "a user"}` : ", automatic"}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
