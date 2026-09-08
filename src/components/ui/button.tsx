"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "black" | "orange";
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
      "group relative inline-flex items-center justify-center font-semibold select-none transition-all duration-300 ease-out rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] active:translate-y-0";

    const sizeStyles = {
      sm: "h-10 px-4 text-xs gap-2 rounded-xl",
      md: "h-12 px-6 text-sm gap-2.5 rounded-xl",
      lg: "h-14 px-8 text-base gap-3 rounded-xl",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-[#FF5500] via-[#FF5F08] to-[#E64800] text-white font-bold tracking-wide border border-[#FF5500] shadow-[0_4px_16px_rgba(255,85,0,0.4),0_1px_2px_rgba(0,0,0,0.1)] hover:from-[#FF6315] hover:to-[#D43F00] hover:border-[#FF5500] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(255,85,0,0.6)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(255,85,0,0.4)] focus-visible:ring-[#FF5500]",
      black:
        "bg-neutral-950 text-white font-bold tracking-wide border border-black shadow-[0_4px_16px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)] hover:bg-black hover:border-black hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0 active:shadow-[0_2px_6px_rgba(0,0,0,0.2)] focus-visible:ring-black",
      orange:
        "bg-gradient-to-r from-[#FF5500] via-[#FF5F08] to-[#E64800] text-white font-bold tracking-wide border border-[#FF5500] shadow-[0_4px_16px_rgba(255,85,0,0.4),0_1px_2px_rgba(0,0,0,0.1)] hover:from-[#FF6315] hover:to-[#D43F00] hover:border-[#FF5500] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(255,85,0,0.6)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(255,85,0,0.4)] focus-visible:ring-[#FF5500]",
      secondary:
        "bg-white text-neutral-900 border-2 border-black shadow-sm hover:bg-neutral-50 hover:border-black hover:text-black hover:-translate-y-0.5 hover:shadow-md active:shadow-xs focus-visible:ring-black",
      outline:
        "bg-transparent text-neutral-900 border border-neutral-300 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-2px_rgba(0,0,0,0.2)] focus-visible:ring-neutral-900",
      ghost:
        "bg-transparent text-neutral-600 hover:text-black hover:bg-neutral-100/80 focus-visible:ring-neutral-400",
      danger:
        "bg-red-600 text-white border border-red-600 shadow-sm hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-red-500",
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
