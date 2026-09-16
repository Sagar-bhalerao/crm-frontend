import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import { APP_NAME } from "@/config/app";
import { PIPELINE_STATUSES } from "@/config/leadStatuses";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Context panel (desktop) */}
      <section className="hidden flex-col justify-between bg-ink px-12 py-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-sm font-semibold text-ink">N</span>
          <span className="text-base font-semibold">{APP_NAME}</span>
        </div>

        <div className="max-w-sm">
          <h2 className="text-[28px] font-semibold leading-tight tracking-tight">Every party enquiry, from first call to confirmed booking.</h2>
          <ol className="mt-8 grid gap-0">
            {PIPELINE_STATUSES.map((s, i) => (
              <li key={s.key} className="relative flex gap-4 pb-5 last:pb-0">
                {i < PIPELINE_STATUSES.length - 1 && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-white/20" aria-hidden />}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/30 text-xs text-white/80">{i + 1}</span>
                <span>
                  <span className="block text-sm font-medium">{s.label}</span>
                  <span className="block text-[13px] text-white/60">{s.hint}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs text-white/50">Dave &amp; Buster&apos;s India. More Imagicaa World brands coming soon.</p>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center bg-surface px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-sm font-semibold text-white">N</span>
            <span className="text-base font-semibold text-ink">{APP_NAME}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Log in</h1>
          <p className="mb-6 mt-1 text-sm text-muted">Use your company email to access leads for your outlets.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
