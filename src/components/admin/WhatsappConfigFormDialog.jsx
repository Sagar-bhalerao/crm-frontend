"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { whatsappConfigService } from "@/services/admin";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import BrandLocationFields from "./BrandLocationFields";
import SecretInput from "./SecretInput";
import { AUTH_TYPE_OPTIONS, PLACEHOLDER_HINT, STATUS_OPTIONS, configName, isValidHttpUrl } from "./configOptions";

const EMPTY = {
  brandId: "",
  locationId: "",
  apiProvider: "",
  apiUrl: "",
  authType: "bearer",
  authHeader: "",
  authUsername: "",
  authKey: "",
  messageBody: "",
  status: 1,
};

const MESSAGE_LIMIT = 4096;

function validate(form, config) {
  const errors = {};
  if (!form.brandId) errors.brandId = "Choose a brand";
  if (!form.locationId) errors.locationId = "Choose a location";
  if (form.apiProvider.trim().length < 2) errors.apiProvider = "Enter the API provider";
  if (!isValidHttpUrl(form.apiUrl)) errors.apiUrl = "Enter the full API URL, starting with https://";

  if (form.authType === "api_key") {
    if (!form.authHeader.trim()) errors.authHeader = "Enter the header name the provider expects, like Api-Key";
    else if (!/^[A-Za-z0-9_-]+$/.test(form.authHeader.trim())) errors.authHeader = "Use letters, numbers, hyphens and underscores only";
  }
  if (form.authType === "basic" && !form.authUsername.trim()) errors.authUsername = "Enter the username";

  const hasSavedKey = Boolean(config?.authKeySet);
  if (form.authType !== "none" && !form.authKey.trim() && !hasSavedKey) {
    errors.authKey = form.authType === "basic" ? "Enter the password" : "Enter the auth key";
  }

  if (!form.messageBody.trim()) errors.messageBody = "Enter the message text";
  else if (form.messageBody.length > MESSAGE_LIMIT) errors.messageBody = `Keep it under ${MESSAGE_LIMIT} characters`;
  return errors;
}

/** Create or edit a WhatsApp configuration. `config` null means create. */
export default function WhatsappConfigFormDialog({ open, config, brands, onClose, onSaved }) {
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
            apiProvider: config.apiProvider || "",
            apiUrl: config.apiUrl || "",
            authType: config.authType || "bearer",
            authHeader: config.authHeader || "",
            authUsername: config.authUsername || "",
            authKey: "", // never loaded back; blank keeps the saved key
            messageBody: config.messageBody || "",
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

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form, config);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      locationId: Number(form.locationId),
      apiProvider: form.apiProvider.trim(),
      apiUrl: form.apiUrl.trim(),
      authType: form.authType,
      authHeader: form.authType === "api_key" ? form.authHeader.trim() : "",
      authUsername: form.authType === "basic" ? form.authUsername.trim() : "",
      messageBody: form.messageBody.trim(),
      status: Number(form.status),
    };
    // Only send a key when one was typed, so a blank field keeps the saved key.
    if (form.authType !== "none" && form.authKey.trim()) payload.authKey = form.authKey.trim();

    const saved = await run(
      () => (isEdit ? whatsappConfigService.updateWhatsappConfig(config.id, payload) : whatsappConfigService.createWhatsappConfig(payload)),
      {
        success: isEdit ? "WhatsApp configuration updated" : "WhatsApp configuration created",
        successDescription: (c) => configName(c),
      }
    );
    if (saved) {
      onSaved?.(saved);
      onClose();
    }
  };

  const keyLabel = form.authType === "basic" ? "Password" : form.authType === "api_key" ? "API key" : "Bearer token";
  const keyHint =
    isEdit && config.authKeySet
      ? `Saved${config.authKeyHint ? `, ends in ${config.authKeyHint}` : ""}. Leave blank to keep it.`
      : "Stored encrypted and never shown again after saving.";
  const extraAuthField = form.authType === "api_key" || form.authType === "basic";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit WhatsApp configuration" : "Add WhatsApp configuration"}
      description={isEdit ? configName(config) : "How messages for one brand and location are sent through your WhatsApp provider."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="whatsapp-config-form" loading={busy}>
            {isEdit ? "Save changes" : "Create configuration"}
          </Button>
        </>
      }
    >
      <form id="whatsapp-config-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <BrandLocationFields
          brands={brands}
          brandId={form.brandId}
          locationId={form.locationId}
          saved={config ? { brandId: config.brandId, locationId: config.locationId } : null}
          onChange={patch}
          errors={errors}
        />

        <Field label="API provider" required error={errors.apiProvider}>
          {(p) => <Input {...p} value={form.apiProvider} onChange={set("apiProvider")} maxLength={60} placeholder="Chat360" />}
        </Field>

        <Field label="API URL" required error={errors.apiUrl} hint="The endpoint messages are sent to.">
          {(p) => <Input {...p} type="url" value={form.apiUrl} onChange={set("apiUrl")} maxLength={500} placeholder="https://" />}
        </Field>

        <Field label="Auth type" required className={form.authType === "none" ? "sm:col-span-2" : undefined}>
          {(p) => <Select {...p} value={form.authType} onChange={set("authType")} options={AUTH_TYPE_OPTIONS} />}
        </Field>

        {form.authType === "api_key" && (
          <Field label="Header name" required error={errors.authHeader} hint="The header the provider reads the key from.">
            {(p) => <Input {...p} value={form.authHeader} onChange={set("authHeader")} maxLength={60} placeholder="Api-Key" />}
          </Field>
        )}

        {form.authType === "basic" && (
          <Field label="Username" required error={errors.authUsername}>
            {(p) => <Input {...p} value={form.authUsername} onChange={set("authUsername")} maxLength={150} autoComplete="off" />}
          </Field>
        )}

        {form.authType !== "none" && (
          <Field
            label={keyLabel}
            required={!(isEdit && config.authKeySet)}
            error={errors.authKey}
            hint={keyHint}
            className={extraAuthField ? "sm:col-span-2" : undefined}
          >
            {(p) => (
              <SecretInput {...p} saved={isEdit && config.authKeySet} value={form.authKey} onChange={set("authKey")} maxLength={2000} />
            )}
          </Field>
        )}

        <Field
          label="Message text"
          required
          error={errors.messageBody}
          hint={`${PLACEHOLDER_HINT} ${form.messageBody.length}/${MESSAGE_LIMIT}`}
          className="sm:col-span-2"
        >
          {(p) => <Textarea {...p} rows={6} value={form.messageBody} onChange={set("messageBody")} placeholder="Hi {{customer.name}}, thank you for your enquiry…" />}
        </Field>

        <Field label="Status" hint="Only active configurations are used to send messages.">
          {(p) => <Select {...p} value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />}
        </Field>
      </form>
    </Modal>
  );
}
