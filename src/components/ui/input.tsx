"use client";

import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightElement, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-neutral-800 tracking-tight"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-neutral-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(
              "w-full rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 transition-all duration-200",
              "border-neutral-200/90 hover:border-neutral-400",
              "focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:shadow-[0_1px_4px_rgba(0,0,0,0.05)]",
              "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60",
              leftIcon && "pl-9",
              rightElement && "pr-9",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-2.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
            <span className="inline-block h-1 w-1 rounded-full bg-red-600" />
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="text-xs text-neutral-500 mt-1 font-normal">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
