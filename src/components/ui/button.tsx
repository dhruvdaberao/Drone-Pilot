"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "group relative inline-flex items-center justify-center font-medium select-none transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]";

    const sizeStyles = {
      sm: "h-8.5 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-xs sm:text-sm gap-2",
      lg: "h-11 px-5 text-sm gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-black text-white font-semibold hover:bg-neutral-800 border border-black shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_14px_-2px_rgba(0,0,0,0.3)]",
      secondary:
        "bg-white text-neutral-800 border border-neutral-200/90 hover:bg-neutral-50/90 hover:border-neutral-300 hover:shadow-sm shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
      outline:
        "bg-transparent text-neutral-800 border border-neutral-300 hover:border-neutral-500 hover:bg-neutral-100/60 hover:text-black",
      ghost:
        "bg-transparent text-neutral-600 hover:text-black hover:bg-neutral-100",
      danger:
        "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current" />
            <span>{loadingText || "Processing..."}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0 transition-transform group-hover:-translate-x-0.5">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="inline-flex shrink-0 transition-transform group-hover:translate-x-1">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
