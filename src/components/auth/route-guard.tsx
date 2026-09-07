"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * Screen displayed during authentication state resolution.
 * Minimalist luxury white canvas loader.
 */
export function FlightSysLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-neutral-900">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-black" />
        <p className="text-xs font-medium text-neutral-500">
          {message}
        </p>
      </div>
    </div>
  );
}

/**
 * Ensures user is authenticated. Redirects to /login if unauthenticated.
 */
export function ProtectedRoute({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <FlightSysLoader message="Verifying session..." />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

/**
 * For auth pages (/login, /signup). Redirects to /dashboard if already authenticated.
 */
export function PublicOnlyRoute({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (!loading && user) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Route guard for /verify-email.
 */
export function VerifyEmailGuard({ children }: RouteGuardProps) {
  const { user, loading, isEmailVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (isEmailVerified) {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, isEmailVerified, router]);

  if (loading) {
    return <FlightSysLoader message="Checking verification..." />;
  }

  if (!user || isEmailVerified) {
    return null;
  }

  return <>{children}</>;
}
