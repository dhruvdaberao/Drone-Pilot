"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { validateLoginForm } from "@/lib/validation";
import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";
import { GoogleIcon } from "../ui/google-icon";
import { AuthCard } from "./auth-card";
import { Mail, Lock, ArrowRight } from "lucide-react";

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
        setAuthError("Unable to sign in. Please check your credentials.");
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
          <div className="relative flex items-center justify-center my-0.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative bg-[#f8fafc] px-2.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
              or continue with
            </div>
          </div>

          {/* Premium Google OAuth Button Outside the Card */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full justify-center text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-50 shadow-sm border-neutral-200/90 transition-all"
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            loadingText="Connecting..."
            leftIcon={<GoogleIcon className="h-4 w-4 shrink-0" />}
          >
            Continue with Google
          </Button>

          {/* New User Account Switch */}
          <p className="text-center text-xs text-neutral-500 pt-0.5">
            New user?{" "}
            <Link
              href="/signup"
              className="font-bold text-black hover:underline transition-colors ml-0.5 focus-visible:outline-none focus-visible:underline"
            >
              Create an account
            </Link>
          </p>
        </>
      }
    >
      <div className="space-y-3">
        {authError && (
          <Alert
            variant="error"
            message={authError}
            onClose={() => setAuthError(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
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

          <div className="space-y-1">
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
                className="h-3.5 w-3.5 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
              />
              <span className="text-[11px] text-neutral-600">Remember this station</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-1 font-semibold"
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
