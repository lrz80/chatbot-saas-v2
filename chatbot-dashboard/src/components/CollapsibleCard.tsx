//src/components/CollapsibleCard.tsx
"use client";

import { useState, ReactNode } from "react";
import { FiChevronDown } from "react-icons/fi";

type CollapsibleCardProps = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  rightSlot?: ReactNode;
};

export default function CollapsibleCard({
  title,
  subtitle,
  defaultOpen = false,
  children,
  rightSlot,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left hover:bg-white/5 transition"
      >
        <div className="min-w-0">
          <div className="text-lg font-semibold text-white">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm text-white/60">{subtitle}</div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {rightSlot}
          <FiChevronDown
            className={`text-xl text-white/70 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}