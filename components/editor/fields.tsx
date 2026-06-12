"use client";

import * as React from "react";
import { HexColorPicker } from "react-colorful";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { hexToRgb, rgbToHex, type RGB } from "@/lib/lottie/color";
import { cn } from "@/lib/utils";

export function Section({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="border-b border-border px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function IconButton({
  label,
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        active && "bg-accent text-primary",
        className,
      )}
      {...props}
    />
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  precision?: number;
}

export function NumberField({
  label,
  value,
  onCommit,
  step = 1,
  min,
  max,
  disabled,
  precision = 2,
}: NumberFieldProps) {
  const display = Number(value.toFixed(precision)).toString();
  const [text, setText] = React.useState(display);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setText(display);
  }, [display, focused]);

  const commit = () => {
    const parsed = Number(text);
    if (Number.isFinite(parsed)) {
      let next = parsed;
      if (min !== undefined) next = Math.max(min, next);
      if (max !== undefined) next = Math.min(max, next);
      if (next !== value) onCommit(next);
      setText(Number(next.toFixed(precision)).toString());
    } else {
      setText(display);
    }
  };

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        className="h-7 w-full rounded-lg bg-background px-2 text-xs tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={text}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        title={
          disabled ? "This property is keyframed — edit disabled" : undefined
        }
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setText(display);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </label>
  );
}

interface ColorSwatchProps {
  label: string;
  rgb: RGB;
  onChange: (rgb: RGB) => void;
  disabled?: boolean;
  subtitle?: string;
}

export function ColorSwatch({
  label,
  rgb,
  onChange,
  disabled,
  subtitle,
}: ColorSwatchProps) {
  const hex = rgbToHex(rgb);
  const [hexText, setHexText] = React.useState(hex);

  React.useEffect(() => setHexText(hex), [hex]);

  const commitHex = (text: string) => {
    const parsed = hexToRgb(text);
    if (parsed) onChange(parsed);
    else setHexText(hex);
  };

  return (
    <div className="flex items-center gap-2 py-1">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            title={
              disabled ? "Animated color — edit disabled" : `${label} ${hex}`
            }
            className="h-6 w-6 shrink-0 rounded border border-border shadow-sm transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: hex }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" side="left">
          <HexColorPicker color={hex} onChange={(h) => commitHex(h)} />
          <input
            className="mt-2 h-7 w-full rounded-lg bg-background px-2 text-xs uppercase tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={hexText}
            onChange={(e) => setHexText(e.target.value)}
            onBlur={(e) => commitHex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                commitHex((e.target as HTMLInputElement).value);
            }}
          />
        </PopoverContent>
      </Popover>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs text-foreground">{label}</div>
        {subtitle && (
          <div className="truncate text-[10px] text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
      <span className="text-[10px] uppercase tabular-nums text-muted-foreground">
        {hex}
      </span>
    </div>
  );
}
