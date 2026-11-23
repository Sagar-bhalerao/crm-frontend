"use client";

import { useRef } from "react";
import { Check, Globe } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

/**
 * The login screen's left panel: three moments from one booking (the
 * enquiry, its quotation, the advance landing) laid over the Circle mark.
 * The cards drift slightly with the pointer; that is the only movement
 * after they settle in, and both are off for reduced motion.
 */
export default function LoginShowcase() {
  const stage = useRef(null);

  // Pointer position as -1..1 from the panel centre, read by the CSS
  const track = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    stage.current?.style.setProperty("--mx", ((e.clientX - box.left) / box.width) * 2 - 1);
    stage.current?.style.setProperty("--my", ((e.clientY - box.top) / box.height) * 2 - 1);
  };
  const reset = () => {
    stage.current?.style.setProperty("--mx", 0);
    stage.current?.style.setProperty("--my", 0);
  };

  return (
    <div className="flex flex-1 flex-col justify-center" onPointerMove={track} onPointerLeave={reset}>
      <div ref={stage} className="showcase relative h-[380px] w-full max-w-[470px]" aria-hidden>
        <div className="showcase-layer absolute left-1/2 top-1/2 -ml-[210px] -mt-[210px] opacity-[0.2]" style={{ "--depth": 6 }}>
          <LogoMark size={420} />
        </div>

        {/* The enquiry */}
        <div className="showcase-layer showcase-card absolute left-0 top-0 w-[272px]" style={{ "--depth": 10, "--delay": "0.1s" }}>
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#e9f0fb] px-2 py-0.5 text-[11px] font-medium text-[#1f5fbf]">New enquiry</span>
            <span className="flex items-center gap-1 text-[11px] text-[#6b7686]">
              <Globe size={11} /> Website, 2 min ago
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#152033] text-xs font-semibold text-white">RK</span>
            <span>
              <span className="block text-sm font-semibold text-[#152033]">Riya Kapoor</span>
              <span className="block text-xs text-[#6b7686]">Birthday party for 25 guests</span>
            </span>
          </div>
          <p className="mt-3 border-t border-[#eef1f5] pt-2.5 text-xs text-[#4a5567]">
            Mumbai, Saturday 14 December
          </p>
        </div>

        {/* Its quotation */}
        <div className="showcase-layer showcase-card absolute right-0 top-[128px] w-[292px]" style={{ "--depth": 16, "--delay": "0.35s" }}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#152033]">Quotation QT-DBIMUM42</span>
            <span className="rounded-full bg-[#efeafc] px-2 py-0.5 text-[11px] font-medium text-[#6a45c9]">Shared</span>
          </div>
          <dl className="mt-3 grid gap-1.5 text-xs text-[#4a5567]">
            <div className="flex justify-between"><dt>Party package × 25</dt><dd>₹31,250</dd></div>
            <div className="flex justify-between"><dt>Game cards × 25</dt><dd>₹10,000</dd></div>
            <div className="flex justify-between"><dt>GST 18%</dt><dd>₹7,425</dd></div>
          </dl>
          <div className="mt-2.5 flex justify-between border-t border-[#eef1f5] pt-2.5 text-[13px] font-semibold text-[#152033]">
            <span>Total</span>
            <span>₹48,675</span>
          </div>
        </div>

        {/* The booking */}
        <div className="showcase-layer showcase-card absolute bottom-0 left-6 flex w-[300px] items-start gap-3" style={{ "--depth": 22, "--delay": "0.6s" }}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2fbf8f] text-white">
            <Check size={16} strokeWidth={2.5} />
          </span>
          <span>
            <span className="block text-[13px] font-semibold text-[#152033]">Booking confirmed</span>
            <span className="block text-xs leading-relaxed text-[#6b7686]">₹24,000 advance received on <span className="whitespace-nowrap">PI-DBIMUM42</span></span>
          </span>
        </div>
      </div>

      <div className="mt-14 max-w-[440px]">
        <p className="text-[30px] font-semibold leading-[1.15] tracking-tight">
          Every enquiry, from first call to confirmed booking.
        </p>
        <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-white/65">
          Leads, quotations and proforma invoices for Dave &amp; Buster&apos;s, Imagicaa and Wet&apos;nJoy, in one place.
        </p>
      </div>
    </div>
  );
}