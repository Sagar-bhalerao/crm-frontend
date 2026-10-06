"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Pencil, Plus, Power, PowerOff, Send, Trash2 } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { brandService, locationService, messagingService } from "@/services/admin";
import {
  Button, Checkbox, ConfirmDialog, DropdownMenu, EmptyState, ErrorState,
  Field, Input, Modal, Panel, Select, Skeleton, StatusBadge, Textarea,
} from "@/components/ui";

const STATUS_OPTIONS = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

/** Locations for one brand, loaded on demand and cached per brand. */
function useBrandLocations(brandId) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (!brandId) {
      setLocations([]);
      return;
    }
    locationService
      .listLocations({ brandId, pageSize: 100, sort: "name:asc" })
      .then((res) => setLocations(res.items))
      .catch(() => setLocations([]));
  }, [brandId]);

  return locations;
}

function useProvidersList(brandId) {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    if (!brandId) {
      setProviders([]);
      return;
    }
    messagingService
      .listProviders({ brandId })
      .then((res) => setProviders(res))
      .catch(() => setProviders([]));
  }, [brandId]);

  return providers;
}

 


/** Brand + location pair, used by all three forms. */
function ScopeFields({ form, setForm, brands, errors }) {
  const locations = useBrandLocations(form.brandId);
  const providers = useProvidersList(form.brandId);

  return (
    <>
      <Field label="Brand" required error={errors.brandId}>
        {(p) => (
          <Select
            {...p}
            value={form.brandId}
            onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value, locationId: "" }))}
            placeholder="Choose brand"
            options={brands.map((b) => ({ value: String(b.id), label: b.name }))}
          />
        )}
      </Field>

      <Field label="Location" hint="Leave empty to use these for every location of the brand.">
        {(p) => (
          <Select
            {...p}
            value={form.locationId}
            onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
            placeholder="All locations"
            options={locations.map((l) => ({ value: String(l.id), label: l.name }))}
            disabled={!form.brandId}
          />
        )}
      </Field>

      <Field label="Provider" required error={errors.brandId}>
        {(p) => (
          <Select
            {...p}
            value={form.providerId}
            onChange={(e) => setForm((f) => ({ ...f, providerId: e.target.value }))}
            placeholder="Choose Provider"
            options={providers.map((b) => ({ value: String(b.id), label: b.provider }))}
          />
        )}
      </Field>
    </>
  );
}

export default function MessagingSettings({ channel }) {
  const { can } = useAuth();
  const canManage = can(P.SETTINGS_MANAGE);

  const [brands, setBrands] = useState([]);
  const [options, setOptions] = useState({ messageTypes: [], authTypes: [], variables: [] });
  const [providers, setProviders] = useState(null);
  const [messages, setMessages] = useState(null);
  const [emailConfigs, setEmailConfigs] = useState(null);
  const [error, setError] = useState(null);

  const [providerForm, setProviderForm] = useState(null);
  const [messageForm, setMessageForm] = useState(null);
  const [emailForm, setEmailForm] = useState(null);
  const [testing, setTesting] = useState(null);
  const [deleting, setDeleting] = useState(null); // { kind, row }
  const [run, busy] = useAction();

  const load = async () => {
    setError(null);
    try {
      const [b, o] = await Promise.all([
        brandService.listBrands({ pageSize: 100, sort: "name:asc" }),
        messagingService.getOptions(),
      ]);
      setBrands(b.items);
      setOptions(o);

      if (channel === "whatsapp") {
        const [p, m] = await Promise.all([messagingService.listProviders(), messagingService.listMessages()]);
        setProviders(p);
        setMessages(m);
      } else {
        setEmailConfigs(await messagingService.listEmailConfigs());
      }
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  if (error) return <Panel><ErrorState error={error} onRetry={load} /></Panel>;

  const toggleStatus = async (kind, row) => {
    const next = Number(row.status) === 1 ? 0 : 1;
    const setter = {
      provider: messagingService.setProviderStatus,
      message: messagingService.setMessageStatus,
      email: messagingService.setEmailConfigStatus,
    }[kind];
    const ok = await run(() => setter(row.id, next), { success: next === 1 ? "Activated" : "Deactivated" });
    if (ok) load();
  };

  const confirmDelete = async () => {
    const remover = {
      provider: messagingService.deleteProvider,
      message: messagingService.deleteMessage,
      email: messagingService.deleteEmailConfig,
    }[deleting.kind];
    const ok = await run(() => remover(deleting.row.id), { success: "Deleted" });
    setDeleting(null);
    if (ok) load();
  };

  const rowMenu = (kind, row, onEdit, extra = []) =>
    [
      canManage && { key: "edit", label: "Edit", icon: Pencil, onClick: onEdit },
      ...extra,
      canManage && {
        key: "status",
        label: Number(row.status) === 1 ? "Deactivate" : "Activate",
        icon: Number(row.status) === 1 ? PowerOff : Power,
        onClick: () => toggleStatus(kind, row),
        separator: true,
      },
      canManage && { key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: () => setDeleting({ kind, row }) },
    ].filter(Boolean);

  const typeLabel = (key) => options.messageTypes.find((t) => t.key === key)?.label || key;

  // ── WhatsApp ────────────────────────────────────────────────────────────
  if (channel === "whatsapp") {
    return (
      <div className="grid gap-4">
        <Panel
          title="Provider credentials"
          description="One set per brand. Add a location row only when that outlet uses a different account."
          bodyClassName="p-0"
          actions={canManage && <Button size="sm" icon={Plus} onClick={() => setProviderForm({ row: null })}>Add credentials</Button>}
        >
          {!providers ? (
            <div className="grid gap-2 p-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : providers.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="No WhatsApp credentials yet"
              description="Add the API details from your provider, such as Chat360 or Netcore."
              action={canManage && <Button size="sm" variant="primary" onClick={() => setProviderForm({ row: null })}>Add credentials</Button>}
            />
          ) : (
            <ul className="divide-y divide-line">
              {providers.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{p.provider}</span>
                      <StatusBadge status={p.status} />
                    </p>
                    <p className="meta">{p.brandName} · {p.scope}</p>
                    <p className="meta truncate">{p.apiUrl}</p>
                    <p className="meta">Auth: {p.authType}{p.senderId ? ` · Sender ${p.senderId}` : ""}</p>
                  </div>
                  <DropdownMenu items={rowMenu("provider", p, () => setProviderForm({ row: p }))} label="Credential actions" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Message templates"
          description="What the customer receives at each stage. Wording is stored here, not in code."
          bodyClassName="p-0"
          actions={canManage && <Button size="sm" icon={Plus} onClick={() => setMessageForm({ row: null })}>Add message</Button>}
        >
          {!messages ? (
            <div className="grid gap-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="No messages yet"
              description="Add one message per stage, such as quotation shared or booking confirmed."
              action={canManage && <Button size="sm" variant="primary" onClick={() => setMessageForm({ row: null })}>Add message</Button>}
            />
          ) : (
            <ul className="divide-y divide-line">
              {messages.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{typeLabel(m.messageType)}</span>
                      <StatusBadge status={m.status} />
                    </p>
                    <p className="meta">
                      {m.brandName} · {m.scope}
                      {m.templateName ? ` · ${m.templateName}` : ""} · {m.language}
                    </p>
                    <p className="mt-1 line-clamp-2 whitespace-pre-line text-[13px] text-body">{m.body}</p>
                  </div>
                  <DropdownMenu items={rowMenu("message", m, () => setMessageForm({ row: m }))} label="Message actions" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <ProviderDialog
          state={providerForm}
          brands={brands}
          authTypes={options.authTypes}
          onClose={() => setProviderForm(null)}
          onSaved={load}
        />

        <MessageDialog
          state={messageForm}
          brands={brands}
          messageTypes={options.messageTypes}
          variables={options.variables}
          onClose={() => setMessageForm(null)}
          onSaved={load}
        />

        <DeleteDialog deleting={deleting} busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
      </div>
    );
  }

  // ── Email ───────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-4">
      <Panel
        title="Sending account (SMTP)"
        description="Email wording lives in code. These are the credentials used to send it."
        bodyClassName="p-0"
        actions={canManage && <Button size="sm" icon={Plus} onClick={() => setEmailForm({ row: null })}>Add account</Button>}
      >
        {!emailConfigs ? (
          <div className="grid gap-2 p-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : emailConfigs.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No email account yet"
            description="Add the SMTP details the CRM should send from."
            action={canManage && <Button size="sm" variant="primary" onClick={() => setEmailForm({ row: null })}>Add account</Button>}
          />
        ) : (
          <ul className="divide-y divide-line">
            {emailConfigs.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{c.fromName ? `${c.fromName} <${c.fromEmail}>` : c.fromEmail}</span>
                    <StatusBadge status={c.status} />
                  </p>
                  <p className="meta">{c.brandName} · {c.scope}</p>
                  <p className="meta">
                    {c.smtpHost}:{c.smtpPort}
                    {c.smtpSecure === 1 ? " (SSL)" : " (STARTTLS)"} · {c.smtpUsername}
                  </p>
                  {c.replyToEmail && <p className="meta">Reply to {c.replyToEmail}</p>}
                </div>
                <DropdownMenu
                  items={rowMenu("email", c, () => setEmailForm({ row: c }), [
                    canManage && { key: "test", label: "Test connection", icon: Send, onClick: () => setTesting(c) },
                  ])}
                  label="Email actions"
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <EmailDialog state={emailForm} brands={brands} onClose={() => setEmailForm(null)} onSaved={load} />
      <TestEmailDialog config={testing} onClose={() => setTesting(null)} />
      <DeleteDialog deleting={deleting} busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
    </div>
  );
}

// ── Dialogs ───────────────────────────────────────────────────────────────

function ProviderDialog({ state, brands, authTypes, onClose, onSaved }) {
  const EMPTY = { brandId: "", locationId: "", provider: "", apiUrl: "", authType: "bearer", authKey: "", senderId: "", status: "1" };
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();
  const row = state?.row;

  useEffect(() => {
    if (!state) return;
    setErrors({});
    setForm(
      row
        ? {
            brandId: String(row.brandId),
            locationId: row.locationId ? String(row.locationId) : "",
            provider: row.provider || "",
            apiUrl: row.apiUrl || "",
            authType: row.authType || "bearer",
            authKey: row.authKey || "",
            senderId: row.senderId || "",
            status: String(row.status),
          }
        : { ...EMPTY, brandId: brands.length === 1 ? String(brands[0].id) : "" }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.brandId) found.brandId = "Choose a brand";
    if (form.provider.trim().length < 2) found.provider = "Enter the provider name";
    if (!/^https?:\/\/\S+$/.test(form.apiUrl.trim())) found.apiUrl = "Enter a full URL starting with https";
    if (form.authKey.trim().length < 4) found.authKey = "Enter the auth key";
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      brandId: Number(form.brandId),
      locationId: form.locationId ? Number(form.locationId) : null,
      provider: form.provider.trim(),
      apiUrl: form.apiUrl.trim(),
      authType: form.authType,
      authKey: form.authKey.trim(),
      senderId: form.senderId.trim(),
      status: Number(form.status),
    };

    const saved = await run(
      () => (row ? messagingService.updateProvider(row.id, payload) : messagingService.createProvider(payload)),
      { success: row ? "Credentials updated" : "Credentials saved" }
    );
    if (saved) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal
      open={Boolean(state)}
      onClose={onClose}
      size="lg"
      title={row ? `Edit ${row.provider}` : "Add WhatsApp credentials"}
      description="From your provider's dashboard."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="provider-form" loading={busy}>
            {row ? "Save changes" : "Save credentials"}
          </Button>
        </>
      }
    >
      <form id="provider-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <ScopeFields form={form} setForm={setForm} brands={brands} errors={errors} />

        <Field label="Provider" required error={errors.provider} hint="chat360, netcore, gupshup…">
          {(p) => <Input {...p} value={form.provider} onChange={set("provider")} placeholder="chat360" />}
        </Field>

        <Field label="Sender ID" hint="WABA number or approved sender name.">
          {(p) => <Input {...p} value={form.senderId} onChange={set("senderId")} placeholder="919820012345" />}
        </Field>

        <Field label="API URL" required error={errors.apiUrl} className="sm:col-span-2">
          {(p) => <Input {...p} value={form.apiUrl} onChange={set("apiUrl")} placeholder="https://api.chat360.io/v1/messages" />}
        </Field>

        <Field label="Auth type" hint={authTypes.find((a) => a.key === form.authType)?.hint}>
          {(p) => (
            <Select {...p} value={form.authType} onChange={set("authType")} options={authTypes.map((a) => ({ value: a.key, label: a.label }))} />
          )}
        </Field>

        <Field label="Status">
          {(p) => <Select {...p} value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />}
        </Field>

        <Field label="Auth key" required error={errors.authKey} className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={2} value={form.authKey} onChange={set("authKey")} className="font-mono text-[13px]" />}
        </Field>
      </form>
    </Modal>
  );
}

function MessageDialog({ state, brands, messageTypes, variables, onClose, onSaved }) {
  const EMPTY = { brandId: "", locationId: "", providerId:"", messageType: "", templateName: "", templateId: "", language: "en", body: "", status: "1" };
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();
  const row = state?.row;
  
  useEffect(() => {
    if (!state) return;
    setErrors({});
    setForm(
      row
        ? {
            brandId: String(row.brandId),
            locationId: row.locationId ? String(row.locationId) : "",
            providerId: row.providerId ? String(row.providerId) : "",
            messageType: row.messageType || "",
            templateName: row.templateName || "",
            templateId: row.templateId || "",
            language: row.language || "en",
            body: row.body || "",
            status: String(row.status),
          }
        : { ...EMPTY, brandId: brands.length === 1 ? String(brands[0].id) : "" }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  /** Drops a variable in at the end of the body. */
  const addVariable = (v) => setForm((f) => ({ ...f, body: `${f.body}${v}` }));

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.brandId) found.brandId = "Choose a brand";
    if (!form.messageType) found.messageType = "Choose a message type";
    if (form.body.trim().length < 5) found.body = "Write the message";
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      brandId: Number(form.brandId),
      locationId: form.locationId ? Number(form.locationId) : null,
      providerId: form.providerId ? Number(form.providerId) : null,
      messageType: form.messageType,
      templateName: form.templateName.trim(),
      templateId: form.templateId.trim(),
      language: form.language.trim() || "en",
      body: form.body.trim(),
      status: Number(form.status),
    };    
    const saved = await run(
      () => (row ? messagingService.updateMessage(row.id, payload) : messagingService.createMessage(payload)),
      { success: row ? "Message updated" : "Message saved" }
    );
    if (saved) {
      onSaved();
      onClose();
    }
  };

  const selectedType = messageTypes.find((t) => t.key === form.messageType);

  return (
    <Modal
      open={Boolean(state)}
      onClose={onClose}
      size="lg"
      title={row ? "Edit message" : "Add message"}
      description="Placeholders are filled in with the lead's details when the message is sent."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="message-form" loading={busy}>
            {row ? "Save changes" : "Save message"}
          </Button>
        </>
      }
    >
      <form id="message-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <ScopeFields form={form} setForm={setForm} brands={brands} errors={errors} />

        <Field label="Message type" required error={errors.messageType} hint={selectedType?.hint}>
          {(p) => (
            <Select
              {...p}
              value={form.messageType}
              onChange={set("messageType")}
              placeholder="Choose type"
              options={messageTypes.map((t) => ({ value: t.key, label: t.label }))}
            />
          )}
        </Field>

        <Field label="Template name" hint="The name approved with your provider, if they need one.">
          {(p) => <Input {...p} value={form.templateName} onChange={set("templateName")} placeholder="booking_confirmation_v1" />}
        </Field>
        <Field label="Template ID" hint="The ID approved with your provider, if they need one.">
          {(p) => <Input {...p} value={form.templateId} onChange={set("templateId")} placeholder="78d780c9-4eb4-*******" />}
        </Field>

        <Field label="Language">
          {(p) => <Input {...p} value={form.language} onChange={set("language")} placeholder="en" maxLength={10} />}
        </Field>

        <Field label="Status">
          {(p) => <Select {...p} value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />}
        </Field>

        <Field label="Message" required error={errors.body} className="sm:col-span-2">
          {(p) => (
            <Textarea
              {...p}
              rows={7}
              value={form.body}
              onChange={set("body")}
              placeholder={"Hi {{customer.name}}, your booking at {{location.name}} is confirmed."}
            />
          )}
        </Field>

        <div className="sm:col-span-2">
          <p className="meta mb-1.5">Click to insert:</p>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <button key={v} type="button" onClick={() => addVariable(v)} className="chip cursor-pointer font-mono text-xs">
                {v}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

function EmailDialog({ state, brands, onClose, onSaved }) {
  const EMPTY = {
    brandId: "", locationId: "", smtpHost: "", smtpPort: "587", smtpSecure: false,
    smtpUsername: "", smtpPassword: "", fromEmail: "", fromName: "",
    replyToEmail: "", replyToName: "", status: "1",
  };
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();
  const row = state?.row;

  useEffect(() => {
    if (!state) return;
    setErrors({});
    setForm(
      row
        ? {
            brandId: String(row.brandId),
            locationId: row.locationId ? String(row.locationId) : "",
            smtpHost: row.smtpHost || "",
            smtpPort: String(row.smtpPort ?? 587),
            smtpSecure: row.smtpSecure === 1,
            smtpUsername: row.smtpUsername || "",
            smtpPassword: row.smtpPassword || "",
            fromEmail: row.fromEmail || "",
            fromName: row.fromName || "",
            replyToEmail: row.replyToEmail || "",
            replyToName: row.replyToName || "",
            status: String(row.status),
          }
        : { ...EMPTY, brandId: brands.length === 1 ? String(brands[0].id) : "" }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.brandId) found.brandId = "Choose a brand";
    if (form.smtpHost.trim().length < 3) found.smtpHost = "Enter the SMTP host";
    if (!form.smtpUsername.trim()) found.smtpUsername = "Enter the username";
    if (!form.smtpPassword) found.smtpPassword = "Enter the password";
    if (!/^\S+@\S+\.\S+$/.test(form.fromEmail)) found.fromEmail = "Enter a valid from address";
    if (form.replyToEmail && !/^\S+@\S+\.\S+$/.test(form.replyToEmail)) found.replyToEmail = "Enter a valid email address";
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      brandId: Number(form.brandId),
      locationId: form.locationId ? Number(form.locationId) : null,
      smtpHost: form.smtpHost.trim(),
      smtpPort: Number(form.smtpPort),
      smtpSecure: form.smtpSecure ? 1 : 0,
      smtpUsername: form.smtpUsername.trim(),
      smtpPassword: form.smtpPassword,
      fromEmail: form.fromEmail.trim(),
      fromName: form.fromName.trim(),
      replyToEmail: form.replyToEmail.trim(),
      replyToName: form.replyToName.trim(),
      status: Number(form.status),
    };

    const saved = await run(
      () => (row ? messagingService.updateEmailConfig(row.id, payload) : messagingService.createEmailConfig(payload)),
      { success: row ? "Email settings updated" : "Email settings saved" }
    );
    if (saved) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal
      open={Boolean(state)}
      onClose={onClose}
      size="lg"
      title={row ? "Edit email account" : "Add email account"}
      description="The CRM sends customer email through this account."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="email-form" loading={busy}>
            {row ? "Save changes" : "Save account"}
          </Button>
        </>
      }
    >
      <form id="email-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <ScopeFields form={form} setForm={setForm} brands={brands} errors={errors} />

        <Field label="SMTP host" required error={errors.smtpHost}>
          {(p) => <Input {...p} value={form.smtpHost} onChange={set("smtpHost")} placeholder="smtp.gmail.com" />}
        </Field>

        <Field label="SMTP port" required hint="587 for STARTTLS, 465 for SSL.">
          {(p) => <Input {...p} type="number" value={form.smtpPort} onChange={set("smtpPort")} />}
        </Field>

        <Field label="Username" required error={errors.smtpUsername}>
          {(p) => <Input {...p} value={form.smtpUsername} onChange={set("smtpUsername")} autoComplete="off" />}
        </Field>

        <Field label="Password" required error={errors.smtpPassword}>
          {(p) => <Input {...p} type="password" value={form.smtpPassword} onChange={set("smtpPassword")} autoComplete="new-password" />}
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            label="Use SSL (tick this for port 465)"
            checked={form.smtpSecure}
            onChange={(e) => setForm((f) => ({ ...f, smtpSecure: e.target.checked }))}
          />
        </div>

        <Field label="From email" required error={errors.fromEmail}>
          {(p) => <Input {...p} type="email" value={form.fromEmail} onChange={set("fromEmail")} placeholder="bookings@yourbrand.com" />}
        </Field>

        <Field label="From name">
          {(p) => <Input {...p} value={form.fromName} onChange={set("fromName")} placeholder="Dave &amp; Buster's India" />}
        </Field>

        <Field label="Reply-to email" error={errors.replyToEmail}>
          {(p) => <Input {...p} type="email" value={form.replyToEmail} onChange={set("replyToEmail")} />}
        </Field>

        <Field label="Reply-to name">
          {(p) => <Input {...p} value={form.replyToName} onChange={set("replyToName")} />}
        </Field>

        <Field label="Status">
          {(p) => <Select {...p} value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />}
        </Field>
      </form>
    </Modal>
  );
}

/** Opens a real SMTP connection, and optionally sends a test email. */
function TestEmailDialog({ config, onClose }) {
  const [to, setTo] = useState("");
  const [result, setResult] = useState(null);
  const [run, busy] = useAction();

  useEffect(() => {
    if (config) {
      setTo("");
      setResult(null);
    }
  }, [config]);

  const submit = async (e) => {
    e.preventDefault();
    const res = await run(() => messagingService.testEmailConfig(config.id, to), {
      success: (r) => (r.sent ? `Test email sent to ${r.to}` : "SMTP connection works"),
    });
    if (res) setResult(res);
  };

  return (
    <Modal
      open={Boolean(config)}
      onClose={onClose}
      size="sm"
      title="Test connection"
      description={config ? `${config.smtpHost}:${config.smtpPort}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" type="submit" form="test-form" loading={busy}>
            {to ? "Send test email" : "Check connection"}
          </Button>
        </>
      }
    >
      <form id="test-form" onSubmit={submit} noValidate>
        <Field label="Send a test email to" hint="Leave empty to only check that the credentials connect.">
          {(p) => <Input {...p} type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@yourcompany.com" />}
        </Field>
        {result && (
          <p className="mt-3 rounded-md bg-success-soft px-3 py-2 text-[13px] text-success">
            {result.sent ? `Sent to ${result.to}. Check the inbox, and the spam folder.` : "Connected and signed in successfully."}
          </p>
        )}
      </form>
    </Modal>
  );
}

function DeleteDialog({ deleting, busy, onConfirm, onClose }) {
  const label = { provider: "credentials", message: "message", email: "email account" }[deleting?.kind] || "record";
  return (
    <ConfirmDialog
      open={Boolean(deleting)}
      title={`Delete these ${label}?`}
      description="This cannot be undone. Deactivate instead if you only want to stop using it for now."
      confirmLabel="Delete"
      tone="danger"
      loading={busy}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}