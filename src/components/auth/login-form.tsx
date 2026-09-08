"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { validateLoginForm } from "@/lib/validation";
import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";
import { Button } from "../ui/button";
import { GoogleIcon } from "../ui/google-icon";
import { AuthCard } from "./auth-card";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAuthError(null);

    const validationErrors = validateLoginForm(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError("Incorrect password or account does not exist. Please check your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError("Google authentication could not be completed.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthCard
      heading="WELCOME, PILOT"
      subheading="Enter the flight experience."
      belowCard={
        <>
          {/* Subtle Canvas-blended Divider */}
          <div className="relative flex items-center justify-center my-1.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative bg-white/95 backdrop-blur-sm px-3.5 py-0.5 rounded-full text-[11px] font-semibold text-neutral-600 uppercase tracking-wider border border-neutral-200 shadow-sm">
              or continue with
            </div>
          </div>

          {/* Premium Google OAuth Bar Button */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full justify-center text-xs sm:text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-50 shadow-sm border-neutral-300 transition-all"
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            loadingText="Connecting..."
            leftIcon={<GoogleIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
          >
            Continue with Google
          </Button>

          {/* New User Account Switch directly on canvas */}
          <div className="relative flex justify-center pt-1">
            <div
              className="absolute -inset-x-8 -inset-y-2 -z-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 50%, transparent 80%)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                maskImage:
                  "radial-gradient(ellipse at center, black 35%, transparent 80%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse at center, black 35%, transparent 80%)",
              }}
            />
            <p className="text-center text-xs sm:text-sm text-neutral-700">
              New user?{" "}
              <Link
                href="/signup"
                className="font-bold text-black hover:underline transition-colors ml-1 focus-visible:outline-none focus-visible:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </>
      }
    >
      <div className="space-y-3">
        {authError && (
          <div className="flex items-start gap-2 text-xs font-medium text-red-600 py-0.5 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span className="leading-snug">{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} action="javascript:void(0);" className="space-y-3" noValidate>
          <Input
            id="pilot-email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="pilot@dronepilot.io"
            leftIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            required
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="pilot-password"
                className="block text-xs font-semibold text-neutral-800 tracking-tight"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-neutral-500 hover:text-black transition-colors focus-visible:outline-none focus-visible:underline"
              >
                Forgot?
              </Link>
            </div>
            <PasswordInput
              id="pilot-password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-600 pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
              />
              <span className="text-xs text-neutral-600">Remember this station</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-1.5 font-semibold text-xs sm:text-sm"
            isLoading={isSubmitting}
            loadingText="Signing in..."
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
