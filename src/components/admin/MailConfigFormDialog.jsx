"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { mailConfigService } from "@/services/admin";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import BrandLocationFields from "./BrandLocationFields";
import SecretInput from "./SecretInput";
import {
  DEFAULT_SMTP_PORT,
  PLACEHOLDER_HINT,
  SMTP_SECURITY_OPTIONS,
  STATUS_OPTIONS,
  configName,
  isValidEmail,
} from "./configOptions";

const EMPTY = {
  brandId: "",
  locationId: "",
  smtpHost: "",
  smtpPort: String(DEFAULT_SMTP_PORT.starttls),
  smtpSecurity: "starttls",
  smtpUsername: "",
  smtpPassword: "",
  fromEmail: "",
  fromName: "",
  replyToEmail: "",
  replyToName: "",
  subject: "",
  body: "",
  status: 1,
};

function validate(form, config) {
  const errors = {};
  if (!form.brandId) errors.brandId = "Choose a brand";
  if (!form.locationId) errors.locationId = "Choose a location";

  if (form.smtpHost.trim().length < 3) errors.smtpHost = "Enter the SMTP host";
  else if (!/^[A-Za-z0-9.-]+$/.test(form.smtpHost.trim())) errors.smtpHost = "Enter a host name only, like smtp.gmail.com";
  const port = Number(form.smtpPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.smtpPort = "Port must be between 1 and 65535";
  if (!form.smtpUsername.trim()) errors.smtpUsername = "Enter the SMTP username";
  if (!form.smtpPassword && !config?.smtpPasswordSet) errors.smtpPassword = "Enter the SMTP password";

  if (!isValidEmail(form.fromEmail)) errors.fromEmail = "Enter a valid from email";
  if (!form.fromName.trim()) errors.fromName = "Enter the sender name";
  if (form.replyToEmail.trim() && !isValidEmail(form.replyToEmail)) errors.replyToEmail = "Enter a valid reply-to email";

  if (!form.subject.trim()) errors.subject = "Enter the email subject";
  if (!form.body.trim()) errors.body = "Enter the email text";
  return errors;
}

/** Create or edit a mail configuration. `config` null means create. */
export default function MailConfigFormDialog({ open, config, brands, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();
  const isEdit = Boolean(config);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      config
        ? {
            brandId: String(config.brandId ?? ""),
            locationId: String(config.locationId ?? ""),
            smtpHost: config.smtpHost || "",
            smtpPort: String(config.smtpPort ?? ""),
            smtpSecurity: config.smtpSecurity || "starttls",
            smtpUsername: config.smtpUsername || "",
            smtpPassword: "", // never loaded back; blank keeps the saved password
            fromEmail: config.fromEmail || "",
            fromName: config.fromName || "",
            replyToEmail: config.replyToEmail || "",
            replyToName: config.replyToName || "",
            subject: config.subject || "",
            body: config.body || "",
            status: Number(config.status),
          }
        : EMPTY
    );
  }, [open, config]);

  const patch = (changes) => {
    setForm((f) => ({ ...f, ...changes }));
    setErrors((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(changes).map((k) => [k, undefined])) }));
  };
  const set = (key) => (e) => patch({ [key]: e.target.value });

  /** Switching encryption fills in its usual port, unless a custom port was typed. */
  const changeSecurity = (e) => {
    const next = e.target.value;
    const usingDefault = !form.smtpPort || Number(form.smtpPort) === DEFAULT_SMTP_PORT[form.smtpSecurity];
    patch({ smtpSecurity: next, ...(usingDefault ? { smtpPort: String(DEFAULT_SMTP_PORT[next]) } : {}) });
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form, config);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      locationId: Number(form.locationId),
      smtpHost: form.smtpHost.trim(),
      smtpPort: Number(form.smtpPort),
      smtpSecurity: form.smtpSecurity,
      smtpUsername: form.smtpUsername.trim(),
      fromEmail: form.fromEmail.trim(),
      fromName: form.fromName.trim(),
      replyToEmail: form.replyToEmail.trim(),
      replyToName: form.replyToName.trim(),
      subject: form.subject.trim(),
      body: form.body.trim(),
      status: Number(form.status),
    };
    // Only send a password when one was typed, so a blank field keeps the saved one.
    if (form.smtpPassword) payload.smtpPassword = form.smtpPassword;

    const saved = await run(
      () => (isEdit ? mailConfigService.updateMailConfig(config.id, payload) : mailConfigService.createMailConfig(payload)),
      {
        success: isEdit ? "Mail configuration updated" : "Mail configuration created",
        successDescription: (c) => configName(c),
      }
    );
    if (saved) {
      onSaved?.(saved);
      onClose();
    }
  };

  const passwordSaved = isEdit && config.smtpPasswordSet;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit mail configuration" : "Add mail configuration"}
      description={isEdit ? configName(config) : "The mail server and email used for one brand and location."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="mail-config-form" loading={busy}>
            {isEdit ? "Save changes" : "Create configuration"}
          </Button>
        </>
      }
    >
      <form id="mail-config-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <BrandLocationFields
          brands={brands}
          brandId={form.brandId}
          locationId={form.locationId}
          saved={config ? { brandId: config.brandId, locationId: config.locationId } : null}
          onChange={patch}
          errors={errors}
        />

        <p className="label mb-0 mt-2 sm:col-span-2">Mail server</p>

        <Field label="SMTP host" required error={errors.smtpHost}>
          {(p) => <Input {...p} value={form.smtpHost} onChange={set("smtpHost")} maxLength={255} placeholder="smtp.eu.mailgun.org" />}
        </Field>

        <Field label="Encryption" required>
          {(p) => <Select {...p} value={form.smtpSecurity} onChange={changeSecurity} options={SMTP_SECURITY_OPTIONS} />}
        </Field>

        <Field label="SMTP port" required error={errors.smtpPort}>
          {(p) => <Input {...p} type="number" inputMode="numeric" min={1} max={65535} value={form.smtpPort} onChange={set("smtpPort")} />}
        </Field>

        <Field label="SMTP username" required error={errors.smtpUsername}>
          {(p) => <Input {...p} value={form.smtpUsername} onChange={set("smtpUsername")} maxLength={255} autoComplete="off" />}
        </Field>

        <Field
          label="SMTP password"
          required={!passwordSaved}
          error={errors.smtpPassword}
          hint={
            passwordSaved
              ? `Saved${config.smtpPasswordHint ? `, ends in ${config.smtpPasswordHint}` : ""}. Leave blank to keep it.`
              : "Stored encrypted and never shown again after saving."
          }
          className="sm:col-span-2"
        >
          {(p) => <SecretInput {...p} saved={passwordSaved} value={form.smtpPassword} onChange={set("smtpPassword")} maxLength={500} />}
        </Field>

        <p className="label mb-0 mt-2 sm:col-span-2">Sender</p>

        <Field label="From email" required error={errors.fromEmail}>
          {(p) => <Input {...p} type="email" value={form.fromEmail} onChange={set("fromEmail")} maxLength={150} placeholder="bookings@example.com" />}
        </Field>

        <Field label="From name" required error={errors.fromName}>
          {(p) => <Input {...p} value={form.fromName} onChange={set("fromName")} maxLength={120} placeholder="Dave & Buster's Mumbai" />}
        </Field>

        <Field label="Reply-to email" error={errors.replyToEmail} hint="Optional. Where customer replies go.">
          {(p) => <Input {...p} type="email" value={form.replyToEmail} onChange={set("replyToEmail")} maxLength={150} />}
        </Field>

        <Field label="Reply-to name">
          {(p) => <Input {...p} value={form.replyToName} onChange={set("replyToName")} maxLength={120} />}
        </Field>

        <p className="label mb-0 mt-2 sm:col-span-2">Email</p>

        <Field label="Subject" required error={errors.subject} className="sm:col-span-2">
          {(p) => <Input {...p} value={form.subject} onChange={set("subject")} maxLength={255} placeholder="Your booking at {{location.name}}" />}
        </Field>

        <Field label="Email text" required error={errors.body} hint={PLACEHOLDER_HINT} className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={8} value={form.body} onChange={set("body")} placeholder="Hi {{customer.name}}," />}
        </Field>

        <Field label="Status" hint="Only active configurations are used to send email.">
          {(p) => <Select {...p} value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />}
        </Field>
      </form>
    </Modal>
  );
}
