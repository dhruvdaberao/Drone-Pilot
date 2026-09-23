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
      "group relative inline-flex items-center justify-center font-semibold select-none transition-all duration-200 ease-out rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:translate-y-0";

    const sizeStyles = {
      sm: "h-8 px-3 text-[10px] gap-2",
      md: "h-12 px-6 text-sm gap-2",
      lg: "h-14 px-8 text-sm gap-2",
    };

    const variantStyles = {
      primary:
        "bg-[#FF5500] text-white tracking-widest border border-transparent hover:bg-[#E64800] focus-visible:ring-[#FF5500]",
      black:
        "bg-neutral-950 text-white tracking-widest border border-white/10 hover:bg-black hover:border-white/20 focus-visible:ring-neutral-500",
      orange:
        "bg-[#FF5500] text-white tracking-widest border border-transparent hover:bg-[#E64800] focus-visible:ring-[#FF5500]",
      secondary:
        "bg-white/5 text-white tracking-widest border border-white/10 hover:bg-white/10 hover:border-white/20 focus-visible:ring-white/20",
      outline:
        "bg-transparent text-neutral-400 tracking-widest border border-neutral-700 hover:bg-white/5 hover:text-white focus-visible:ring-neutral-500",
      ghost:
        "bg-transparent text-neutral-400 tracking-widest hover:text-white hover:bg-white/5 focus-visible:ring-neutral-500",
      danger:
        "bg-red-600/10 text-red-500 tracking-widest border border-red-600/20 hover:bg-red-600/20 hover:text-red-400 focus-visible:ring-red-500",
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
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-current block" />
            <span className="leading-none">{loadingText || "PROCESSING..."}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0 block">{leftIcon}</span>}
            <span className="leading-none">{children}</span>
            {rightIcon && <span className="inline-flex shrink-0 block">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
