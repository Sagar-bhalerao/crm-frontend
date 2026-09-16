"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { DATA_SOURCE } from "@/config/app";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";
import { Button, Checkbox, Field, Input, Modal } from "@/components/ui";
import DemoAccounts from "./DemoAccounts";

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setFormError("");
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Enter your work email";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.password) e.password = "Enter your password";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    } catch (err) {
      setFormError(err.message || "Couldn't sign you in. Try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {formError && (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2.5 text-[13px] text-danger">
            {formError}
          </p>
        )}

        <Field label="Work email" error={errors.email}>
          {(p) => <Input {...p} type="email" autoComplete="username" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-10" />}
        </Field>

        <Field label="Password" error={errors.password}>
          {(p) => (
            <div className="relative">
              <Input
                {...p}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-muted hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}
        </Field>

        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" checked={form.remember} onChange={(e) => set("remember", e.target.checked)} />
          <button type="button" onClick={() => setResetOpen(true)} className="link text-[13px] cursor-pointer">
            Forgot password?
          </button>
        </div>

        <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-1 w-full">
          {loading ? "Logging in" : "Log in"}
        </Button>
      </form>

      {DATA_SOURCE === "mock" && (
        <DemoAccounts onPick={(email, password) => setForm((f) => ({ ...f, email, password }))} />
      )}

      <ForgotPasswordDialog open={resetOpen} onClose={() => setResetOpen(false)} initialEmail={form.email} />
    </>
  );
}

function ForgotPasswordDialog({ open, onClose, initialEmail }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setSent(false);
    setError("");
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    const value = email || initialEmail;
    if (!/^\S+@\S+\.\S+$/.test(value)) return setError("Enter a valid email address");
    setLoading(true);
    await authService.requestPasswordReset(value);
    setLoading(false);
    setSent(true);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="sm"
      title="Reset your password"
      footer={
        sent ? (
          <Button variant="primary" onClick={close}>Back to log in</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button variant="primary" type="submit" form="reset-form" loading={loading}>Send reset link</Button>
          </>
        )
      }
    >
      {sent ? (
        <p className="text-sm text-body">If an account exists for that email, a reset link is on its way. It expires in 30 minutes.</p>
      ) : (
        <form id="reset-form" onSubmit={submit} noValidate>
          <Field label="Work email" error={error} hint="We'll email you a link to set a new password.">
            {(p) => <Input {...p} type="email" defaultValue={initialEmail} onChange={(e) => { setEmail(e.target.value); setError(""); }} />}
          </Field>
        </form>
      )}
    </Modal>
  );
}
