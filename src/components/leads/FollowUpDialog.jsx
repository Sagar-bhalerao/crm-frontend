"use client";

import { useEffect, useState } from "react";
import { FOLLOW_UP_CHANNELS, FOLLOW_UP_OUTCOMES } from "@/config/leadOptions";
import { useAction } from "@/hooks/useAction";
import { addDays, toDateTimeInput } from "@/lib/format";
import { leadService } from "@/services";
import { cx } from "@/lib/utils";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";

const at = (days, hour) => {
  const d = addDays(new Date(), days);
  d.setHours(hour, 0, 0, 0);
  return toDateTimeInput(d);
};

const QUICK_PICKS = [
  { label: "Tomorrow, 11 AM", value: () => at(1, 11) },
  { label: "In 2 days", value: () => at(2, 11) },
  { label: "Next week", value: () => at(7, 11) },
  { label: "No follow-up", value: () => "" },
];

export default function FollowUpDialog({ open, lead, onClose }) {
  const [form, setForm] = useState({ channel: "call", outcome: "", note: "", nextFollowUpAt: "" });
  const [error, setError] = useState("");
  const [run, busy] = useAction();

  useEffect(() => {
    if (open) {
      setForm({ channel: "call", outcome: "", note: "", nextFollowUpAt: at(1, 11) });
      setError("");
    }
  }, [open]);

  if (!lead) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e?.preventDefault();
    if (!form.outcome) return setError("Choose the outcome of this follow-up");
    const ok = await run(() => leadService.addFollowUp(lead.id, form), {
      success: "Follow-up saved",
      successDescription: lead.status === "new" ? "Lead moved to In progress" : undefined,
    });
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log follow-up"
      description={`${lead.customer.name}, ${lead.id}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="follow-up-form" loading={busy}>Save follow-up</Button>
        </>
      }
    >
      <form id="follow-up-form" onSubmit={save} className="grid gap-4" noValidate>
        <fieldset>
          <legend className="label">Contacted by</legend>
          <div className="flex flex-wrap gap-2">
            {FOLLOW_UP_CHANNELS.map((c) => (
              <button key={c.key} type="button" aria-pressed={form.channel === c.key} onClick={() => set("channel", c.key)} className={cx("chip", form.channel === c.key && "chip-on")}>
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Outcome" required error={error}>
          {(p) => (
            <Select
              {...p}
              value={form.outcome}
              onChange={(e) => { set("outcome", e.target.value); setError(""); }}
              placeholder="Choose outcome"
              options={FOLLOW_UP_OUTCOMES.map((o) => ({ value: o, label: o }))}
            />
          )}
        </Field>

        <Field label="Notes">
          {(p) => <Textarea {...p} rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="What did the customer say?" />}
        </Field>

        <Field label="Next follow-up">
          {(p) => (
            <>
              <div className="mb-2 flex flex-wrap gap-2">
                {QUICK_PICKS.map((q) => {
                  const v = q.value();
                  return (
                    <button key={q.label} type="button" onClick={() => set("nextFollowUpAt", v)} className={cx("chip h-7 text-xs", form.nextFollowUpAt === v && "chip-on")}>
                      {q.label}
                    </button>
                  );
                })}
              </div>
              <Input {...p} type="datetime-local" value={form.nextFollowUpAt} onChange={(e) => set("nextFollowUpAt", e.target.value)} />
            </>
          )}
        </Field>
      </form>
    </Modal>
  );
}
