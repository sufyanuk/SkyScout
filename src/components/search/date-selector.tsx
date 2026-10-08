"use client";

import { useId, useRef } from "react";
import { CalendarDays, CalendarRange, Sparkles } from "lucide-react";
import type { WhenOption } from "@/lib/flights/types";
import { cn } from "@/lib/utils";
import { FieldShell } from "./field-shell";

const FLEX_LABELS: Partial<Record<WhenOption, string>> = {
  anytime: "Any dates",
  weekend: "Next weekends",
  "next-month": "Next month",
};

interface DateSelectorProps {
  label: string;
  value: string;
  min: string;
  onChange: (value: string) => void;
  /** When a flexible mode is active the field shows it instead of a date. */
  when: WhenOption;
  onExactRequested: () => void;
  disabled?: boolean;
  disabledLabel?: string;
  className?: string;
}

export function DateSelector({
  label,
  value,
  min,
  onChange,
  when,
  onExactRequested,
  disabled,
  disabledLabel,
  className,
}: DateSelectorProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const flexLabel = FLEX_LABELS[when];

  if (disabled) {
    return (
      <FieldShell label={label} icon={<CalendarRange />} className={cn("bg-muted/60", className)}>
        <span className="text-[15px] text-muted-foreground">{disabledLabel}</span>
      </FieldShell>
    );
  }

  if (flexLabel) {
    return (
      <FieldShell label={label} htmlFor={id} icon={<Sparkles className="text-sunrise" />} className={className}>
        <button
          id={id}
          type="button"
          onClick={() => {
            onExactRequested();
            requestAnimationFrame(() => inputRef.current?.showPicker?.());
          }}
          className="text-left text-[15px] font-semibold text-sunrise outline-none"
          aria-label={`${label}: ${flexLabel}. Choose exact dates instead`}
        >
          {flexLabel}
        </button>
        <input ref={inputRef} type="date" tabIndex={-1} aria-hidden="true" className="sr-only" min={min} onChange={(e) => onChange(e.target.value)} />
      </FieldShell>
    );
  }

  return (
    <FieldShell label={label} htmlFor={id} icon={<CalendarDays />} className={className}>
      <input
        ref={inputRef}
        id={id}
        type="date"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        className="w-full cursor-pointer bg-transparent text-[15px] font-semibold outline-none [color-scheme:light] invalid:text-muted-foreground [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </FieldShell>
  );
}
