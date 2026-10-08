"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Globe2, Map as MapIcon, MapPin } from "lucide-react";
import { AIRPORT_OPTIONS } from "@/lib/catalog/airports";
import { GROUP_LOCATIONS } from "@/lib/catalog/locations";
import { cn } from "@/lib/utils";
import { FieldShell } from "./field-shell";

export const ANYWHERE = "anywhere";

interface AirportSelectorProps {
  label: string;
  value: string;
  onChange: (code: string) => void;
  allowAnywhere?: boolean;
  /** Also offer countries and regions (multi-airport searches). */
  allowGroups?: boolean;
  icon?: ReactNode;
  exclude?: string;
  className?: string;
  inputClassName?: string;
  name?: string;
}

interface Option {
  code: string;
  primary: string;
  secondary: string;
  group?: boolean;
}

const ANYWHERE_OPTION: Option = { code: ANYWHERE, primary: "Anywhere", secondary: "Discover the cheapest destinations" };

function displayValue(code: string): string {
  if (code === ANYWHERE) return "Anywhere";
  const airport = AIRPORT_OPTIONS.find((a) => a.code === code);
  if (airport) return `${airport.city} (${airport.code})`;
  return GROUP_LOCATIONS.find((g) => g.token === code)?.label ?? code;
}

/** Accessible airport combobox (WAI-ARIA 1.2 pattern) with type-ahead search. */
export function AirportSelector({
  label,
  value,
  onChange,
  allowAnywhere,
  allowGroups,
  icon,
  exclude,
  className,
  inputClassName,
  name,
}: AirportSelectorProps) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const options = useMemo<Option[]>(() => {
    const q = query.trim().toLowerCase();
    const airports = AIRPORT_OPTIONS.filter((a) => a.code !== exclude)
      .filter(
        (a) =>
          !q ||
          a.code.toLowerCase().startsWith(q) ||
          a.city.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q),
      )
      .sort((a, b) => Number(b.code.toLowerCase() === q) - Number(a.code.toLowerCase() === q))
      .map((a) => ({ code: a.code, primary: `${a.city} (${a.code})`, secondary: `${a.name} · ${a.country}` }));
    const groups: Option[] = allowGroups
      ? GROUP_LOCATIONS.filter((g) => g.token !== exclude && (!q || g.label.toLowerCase().includes(q) || g.token.toLowerCase() === q)).map(
          (g) => ({ code: g.token, primary: g.label, secondary: g.kind === "region" ? `Region · ${g.detail}` : `Country · ${g.detail}`, group: true }),
        )
      : [];
    const anywhere = allowAnywhere && (!q || "anywhere".includes(q)) ? [ANYWHERE_OPTION] : [];
    // Typing narrows everything; with an empty query show a few regions after the airports.
    // A query that names a country or region ("united arab", "europe") puts that group first.
    const leading = groups.filter((g) => g.primary.toLowerCase().startsWith(q));
    const trailing = groups.filter((g) => !leading.includes(g));
    const list = q
      ? [...anywhere, ...leading, ...airports, ...trailing]
      : [...anywhere, ...airports.slice(0, 7), ...groups.slice(0, 4)];
    return list.slice(0, 12);
  }, [query, allowAnywhere, allowGroups, exclude]);

  function select(option: Option) {
    onChange(option.code);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (open && options[active]) {
        e.preventDefault();
        select(options[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className={cn("relative", className)}>
      <FieldShell label={label} htmlFor={id} icon={icon ?? (value === ANYWHERE ? <Globe2 /> : value.length !== 3 ? <MapIcon /> : <MapPin />)}>
        <input
          ref={inputRef}
          id={id}
          name={name}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-opt-${options[active].code}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={allowGroups ? "City, airport, country or region" : "City or airport"}
          value={open ? query : displayValue(value)}
          onFocus={(e) => {
            setOpen(true);
            setActive(0);
            e.currentTarget.select();
          }}
          onBlur={() => {
            setOpen(false);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full truncate bg-transparent text-[15px] font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground/70",
            inputClassName,
          )}
        />
      </FieldShell>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} options`}
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-80 min-w-[280px] overflow-y-auto rounded-2xl border bg-popover p-1.5 shadow-lift"
        >
          {options.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground">No airports match “{query}”.</li>}
          {options.map((option, i) => (
            <li
              key={option.code}
              id={`${id}-opt-${option.code}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => select(option)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                i === active && "bg-muted",
                option.code === value && "font-semibold",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                  option.code === ANYWHERE || option.group ? "bg-sunrise-soft text-sunrise" : "bg-accent text-accent-foreground",
                )}
              >
                {option.code === ANYWHERE ? (
                  <Globe2 className="size-4" aria-hidden="true" />
                ) : option.group ? (
                  <MapIcon className="size-4" aria-hidden="true" />
                ) : (
                  option.code
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{option.primary}</span>
                <span className="block truncate text-xs text-muted-foreground">{option.secondary}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
