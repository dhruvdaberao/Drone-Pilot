import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User,
  type ActionCodeSettings,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./client";

function getActionCodeSettings(returnPath: string = "/dashboard"): ActionCodeSettings {
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "http://localhost:3000";

  return {
    url: `${origin}${returnPath}`,
    handleCodeInApp: false,
  };
}

export interface PilotUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isMockPilot?: boolean;
}

// Simulated pilot session key for local testing when Firebase credentials are not yet configured
const MOCK_STORAGE_KEY = "drone_pilot_mock_auth_session";

function getStoredMockUser(): PilotUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredMockUser(user: PilotUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    }
  } catch {}
}

/**
 * Sign up a new pilot with email and password.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: PilotUser }> {
  if (!isFirebaseConfigured()) {
    // Simulated auth mode for local development without live Firebase keys
    await new Promise((resolve) => setTimeout(resolve, 600));
    const mockUser: PilotUser = {
      uid: "mock-pilot-" + Math.random().toString(36).substring(2, 9),
      email,
      displayName: displayName || email.split("@")[0],
      photoURL: null,
      emailVerified: false,
      isMockPilot: true,
    };
    setStoredMockUser(mockUser);
    return { user: mockUser };
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName });
  }
  // Automatically trigger email verification dispatch
  try {
    await sendEmailVerification(credential.user, getActionCodeSettings("/dashboard"));
  } catch (err) {
    console.warn("Could not automatically dispatch verification email:", err);
  }

  return {
    user: {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: displayName || credential.user.displayName,
      photoURL: credential.user.photoURL,
      emailVerified: credential.user.emailVerified,
    },
  };
}

/**
 * Sign in existing pilot with email and password.
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: PilotUser }> {
  if (!isFirebaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const existing = getStoredMockUser();
    const mockUser: PilotUser = {
      uid: existing?.uid || "mock-pilot-" + Math.random().toString(36).substring(2, 9),
      email,
      displayName: existing?.displayName || email.split("@")[0],
      photoURL: null,
      emailVerified: existing?.emailVerified ?? false,
      isMockPilot: true,
    };
    setStoredMockUser(mockUser);
    return { user: mockUser };
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return {
    user: {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      photoURL: credential.user.photoURL,
      emailVerified: credential.user.emailVerified,
    },
  };
}

/**
 * Sign in using Google OAuth popup.
 */
export async function loginWithGoogle(): Promise<{ user: PilotUser }> {
  if (!isFirebaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const mockUser: PilotUser = {
      uid: "mock-google-pilot-770",
      email: "flight.cadet@dronepilot.io",
      displayName: "Commander Maverick",
      photoURL: null,
      emailVerified: true,
      isMockPilot: true,
    };
    setStoredMockUser(mockUser);
    return { user: mockUser };
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(auth, provider);
  return {
    user: {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      photoURL: credential.user.photoURL,
      emailVerified: credential.user.emailVerified,
    },
  };
}

/**
 * Send password reset instructions.
 */
export async function resetPassword(email: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }
  await sendPasswordResetEmail(auth, email, getActionCodeSettings("/login"));
}

/**
 * Dispatch email verification link.
 */
export async function sendVerificationEmail(currentUser?: User | null): Promise<void> {
  if (!isFirebaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }
  const target = currentUser || auth.currentUser;
  if (!target) {
    throw new Error("No authenticated pilot found to verify.");
  }
  await sendEmailVerification(target, getActionCodeSettings("/dashboard"));
}

/**
 * Reload the current user to refresh emailVerified status.
 */
export async function reloadCurrentUser(currentUser?: User | null): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const mock = getStoredMockUser();
    if (mock) {
      // In mock mode, clicking verify simulates verification completion
      mock.emailVerified = true;
      setStoredMockUser(mock);
      return true;
    }
    return false;
  }
  const target = currentUser || auth.currentUser;
  if (target) {
    await target.reload();
    return target.emailVerified;
  }
  return false;
}

/**
 * Sign out the current pilot.
 */
export async function logoutUser(): Promise<void> {
  if (!isFirebaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setStoredMockUser(null);
    return;
  }
  await signOut(auth);
}

/**
 * Update the pilot's profile (callsign / display name).
 */
export async function updatePilotProfile(
  currentUser: User | null,
  updates: { displayName?: string; photoURL?: string }
): Promise<void> {
  if (!isFirebaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const mock = getStoredMockUser();
    if (mock) {
      if (updates.displayName !== undefined) mock.displayName = updates.displayName;
      if (updates.photoURL !== undefined) mock.photoURL = updates.photoURL;
      setStoredMockUser(mock);
    }
    return;
  }
  const target = currentUser || auth.currentUser;
  if (!target) {
    throw new Error("No authenticated pilot found to update profile.");
  }
  await updateProfile(target, updates);
}

/**
 * Request an email change for the authenticated pilot.
 * Uses Firebase's native verifyBeforeUpdateEmail, dispatching a secure verification link
 * to the new email without needing Brevo or external mail servers.
 */
export async function updatePilotEmail(
  currentUser: User | null,
  newEmail: string
): Promise<{ verificationEmailSent: boolean; message: string }> {
  if (!newEmail || !newEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  if (!isFirebaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const mock = getStoredMockUser();
    if (mock) {
      mock.email = newEmail;
      setStoredMockUser(mock);
    }
    return {
      verificationEmailSent: false,
      message: "Email updated successfully in local session.",
    };
  }

  const target = currentUser || auth.currentUser;
  if (!target) {
    throw new Error("No authenticated pilot found.");
  }

  // Firebase native secure verification link to new email address
  try {
    await verifyBeforeUpdateEmail(target, newEmail, getActionCodeSettings("/profile"));
    return {
      verificationEmailSent: true,
      message: `A security verification link has been sent to ${newEmail}. Please click the link to confirm your new email address.`,
    };
  } catch (err: any) {
    if (err.code === "auth/requires-recent-login") {
      throw new Error("Security check: Please sign out and sign back in before updating your email address.");
    }
    throw err;
  }
}
