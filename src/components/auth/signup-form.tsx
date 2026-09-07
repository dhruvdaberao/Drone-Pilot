"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { validateSignUpForm } from "@/lib/validation";
import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";
import { GoogleIcon } from "../ui/google-icon";
import { PasswordStrengthMeter } from "./password-strength";
import { AuthCard } from "./auth-card";
import { User, Mail, Lock, ArrowRight } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAuthError(null);

    const validationErrors = validateSignUpForm({
      displayName,
      email,
      password,
      confirmPassword,
      acceptTerms,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await signup(email, password, displayName);
      router.push("/verify-email");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError("Google sign-up could not be completed.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthCard
      heading="PILOT ENLISTMENT"
      subheading="Register your flight credentials."
      belowCard={
        <>
          {/* Subtle Canvas-blended Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative bg-white/95 backdrop-blur-sm px-3.5 py-1 rounded-full text-[11px] font-semibold text-neutral-600 uppercase tracking-wider border border-neutral-200 shadow-sm">
              or continue with
            </div>
          </div>

          {/* Premium Google OAuth Bar Button */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full justify-center text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-50 shadow-sm border-neutral-300 transition-all"
            onClick={handleGoogleSignUp}
            isLoading={isGoogleLoading}
            loadingText="Connecting..."
            leftIcon={<GoogleIcon className="h-5 w-5 shrink-0" />}
          >
            Continue with Google
          </Button>

          {/* Existing User Account Switch directly on page with seamless feathered blur */}
          <div className="relative flex justify-center pt-2">
            <div
              className="absolute -inset-x-8 -inset-y-2.5 -z-10 pointer-events-none"
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-black hover:underline transition-colors ml-1 focus-visible:outline-none focus-visible:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </>
      }
    >
      <div className="space-y-2.5">
        {authError && (
          <Alert
            variant="error"
            message={authError}
            onClose={() => setAuthError(null)}
          />
        )}

        <form onSubmit={handleSubmit} action="javascript:void(0);" className="space-y-3.5" noValidate>
          <Input
            id="pilot-callsign"
            label="Pilot Call Sign"
            type="text"
            autoComplete="name"
            placeholder="e.g. Maverick"
            leftIcon={<User className="h-4 w-4" />}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: "" }));
            }}
            error={errors.displayName}
            required
          />

          <Input
            id="pilot-signup-email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="pilot@dronepilot.io"
            leftIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            error={errors.email}
            required
          />

          <div className="space-y-1">
            <PasswordInput
              id="pilot-signup-password"
              label="Password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
              }}
              error={errors.password}
              required
            />

            <PasswordStrengthMeter password={password} />
          </div>

          <PasswordInput
            id="pilot-signup-confirm-password"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            leftIcon={<Lock className="h-4 w-4" />}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            error={errors.confirmPassword}
            required
          />

          {/* Terms & Consent */}
          <div className="pt-0.5">
            <label className="flex items-start gap-2 text-xs text-neutral-600 font-medium select-none cursor-pointer leading-tight">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  if (errors.acceptTerms) setErrors((prev) => ({ ...prev, acceptTerms: "" }));
                }}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
              />
              <span>
                I agree to the{" "}
                <span className="text-black font-semibold hover:underline">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-black font-semibold hover:underline">
                  Privacy Policy
                </span>.
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                <span className="inline-block h-1 w-1 rounded-full bg-red-600" />
                {errors.acceptTerms}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2 font-semibold text-sm"
            isLoading={isSubmitting}
            loadingText="Creating account..."
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Create an account
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
