import { Suspense } from "react";
import { Check } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import LoginShowcase from "@/components/auth/LoginShowcase";
import Logo, { LogoMark } from "@/components/brand/Logo";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh bg-ink lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:bg-surface">
      {/* Brand panel (desktop) */}
      <section className="relative hidden overflow-hidden bg-ink px-12 py-10 text-white lg:flex lg:flex-col">
        <Logo size={36} tone="dark" />
        <LoginShowcase />
      </section>

      <div className="flex min-h-dvh flex-col lg:min-h-0">
        {/* Brand band (phones and tablets): the same story, told in one card */}
        <header className="relative overflow-hidden px-5 pb-16 pt-7 text-white sm:px-10 lg:hidden">
          <div className="pointer-events-none absolute -right-20 -top-16 opacity-[0.16]" aria-hidden>
            <LogoMark size={280} />
          </div>

          {/* Lines up with the form column below it */}
          <div className="relative mx-auto w-full max-w-[380px]">
            <Logo size={32} tone="dark" />

            <p className="mt-8 max-w-[22ch] text-[24px] font-semibold leading-[1.2] tracking-tight sm:text-[28px]">
              Every enquiry, from first call to confirmed booking.
            </p>

            <div
              className="login-mobile-card mt-6 flex max-w-[320px] items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)]"
              aria-hidden
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2fbf8f] text-white">
                <Check size={16} strokeWidth={2.5} />
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-[#152033]">Booking confirmed</span>
                <span className="block text-xs leading-relaxed text-[#6b7686]">
                  ₹24,000 advance received on <span className="whitespace-nowrap">PI-DBIMUM42</span>
                </span>
              </span>
            </div>
          </div>
        </header>

        {/* Form: a sheet over the band on phones and tablets, the plain right half on desktop */}
        <section className="-mt-8 flex flex-1 flex-col rounded-t-[28px] bg-surface px-5 pb-6 pt-9 sm:px-10 lg:mt-0 lg:rounded-none lg:py-8">
          <div className="mx-auto w-full max-w-[380px] sm:my-auto sm:py-10">
            <h1 className="text-[26px] font-semibold tracking-tight text-ink">Log in</h1>
            <p className="mb-7 mt-1.5 text-sm leading-relaxed text-muted">
              Use your work email. You&apos;ll see the leads for your brands and outlets.
            </p>
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-auto pt-10 text-center text-[13px] text-muted lg:pt-0">
            New to Circle CRM? Ask your admin to create your account.
          </p>
        </section>
      </div>
    </main>
  );
}