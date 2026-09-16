import { Check } from "lucide-react";
import { getStatus, PIPELINE_STATUSES } from "@/config/leadStatuses";
import { getStageIndex } from "@/lib/leadWorkflow";
import { cx } from "@/lib/utils";

/**
 * Where the lead is in the pipeline. Driven entirely by config/leadStatuses.js.
 * Off-path statuses (Not interested) show the rail muted with a closing note.
 */
export default function StageRail({ status, reason }) {
  const current = getStageIndex(status);
  const offPath = current === -1;
  const offStatus = offPath ? getStatus(status) : null;

  return (
    <div>
      <ol className="grid grid-cols-5" aria-label="Lead stage">
        {PIPELINE_STATUSES.map((s, i) => {
          const done = !offPath && i < current;
          const active = !offPath && i === current;
          return (
            <li
              key={s.key}
              aria-current={active ? "step" : undefined}
              className={cx("relative flex flex-col gap-2 pr-2", `tone-${s.tone}`)}
            >
              <span
                className={cx(
                  "h-1.5 rounded-full",
                  offPath ? "bg-line" : done || active ? "bg-[var(--tone)]" : "bg-line"
                )}
              />
              <span className="flex min-w-0 items-center gap-1.5">
                {done && <Check size={13} className="shrink-0 text-[var(--tone)]" aria-label="Completed" />}
                <span
                  className={cx(
                    "truncate text-xs sm:text-[13px]",
                    active ? "font-semibold text-[var(--tone)]" : done ? "text-body" : "text-faint"
                  )}
                >
                  {s.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      {offPath && (
        <p className={cx("mt-3 flex items-center gap-2 text-[13px]", `tone-${offStatus.tone}`)}>
          <span className="badge">{offStatus.label}</span>
          {reason && <span className="text-muted">{reason}</span>}
        </p>
      )}
    </div>
  );
}
