"use client";

import React, { forwardRef, useState } from "react";
import { Input, type InputProps } from "./input";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps extends Omit<InputProps, "type" | "rightElement"> {
  showToggle?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    const toggleButton = showToggle ? (
      <button
        type="button"
        onClick={toggleVisibility}
        className="rounded-md p-1 text-neutral-400 hover:text-black hover:bg-neutral-100/80 focus:outline-none focus:ring-1 focus:ring-black/20 transition-all"
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
    ) : undefined;

    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        rightElement={toggleButton}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";
