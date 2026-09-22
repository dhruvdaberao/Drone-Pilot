// ==========================================================
// DRONE PILOT — DIGITAL TWIN STORAGE & PERSISTENCE (PHASE 4)
// Dual-layer persistence: Firestore (authenticated) + LocalStorage (offline/demo)
// ==========================================================

import { DroneDigitalTwinConfiguration } from "@/types/drone-digital-twin";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import {
  TRAINING_QUADCOPTER_PRESET,
  DIGITAL_TWIN_PRESETS,
} from "./digital-twin-presets";

const LOCAL_STORAGE_ACTIVE_KEY = "drone_pilot_active_digital_twin";
const LOCAL_STORAGE_SAVED_KEY = "drone_pilot_saved_digital_twins";

/**
 * Returns the currently active drone digital twin configuration.
 * Falls back to the factory Training Quadcopter if none selected.
 */
export function getActiveDigitalTwin(): DroneDigitalTwinConfiguration {
  if (typeof window === "undefined") {
    return TRAINING_QUADCOPTER_PRESET;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.identity?.id) {
        return parsed;
      }
    }
  } catch {
    // Storage access error
  }
  return TRAINING_QUADCOPTER_PRESET;
}

/**
 * Sets the active digital twin in local session storage for simulator initialization.
 */
export function setActiveDigitalTwin(config: DroneDigitalTwinConfiguration): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, JSON.stringify(config));
  } catch {
    // Storage error
  }
}

/**
 * Loads all saved user configurations.
 * Merges built-in factory presets with custom saved configurations.
 */
export async function listUserConfigurations(): Promise<DroneDigitalTwinConfiguration[]> {
  const result: DroneDigitalTwinConfiguration[] = [...DIGITAL_TWIN_PRESETS];

  // 1. Try Firestore if authenticated and live
  const currentUser = auth.currentUser;
  if (isFirebaseConfigured() && db && currentUser) {
    try {
      const colRef = collection(db, "users", currentUser.uid, "droneConfigurations");
      const snap = await getDocs(colRef);
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DroneDigitalTwinConfiguration;
        if (data?.identity?.id && !result.some((r) => r.identity.id === data.identity.id)) {
          result.push(data);
        }
      });
      return result;
    } catch (e) {
      console.warn("Firestore list configurations error, falling back to localStorage:", e);
    }
  }

  // 2. LocalStorage fallback
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      if (raw) {
        const customConfigs: DroneDigitalTwinConfiguration[] = JSON.parse(raw);
        customConfigs.forEach((c) => {
          if (!result.some((r) => r.identity.id === c.identity.id)) {
            result.push(c);
          }
        });
      }
    } catch {
      // LocalStorage error
    }
  }

  return result;
}

/**
 * Saves or updates a drone digital twin configuration.
 */
export async function saveUserConfiguration(
  config: DroneDigitalTwinConfiguration
): Promise<void> {
  const toSave: DroneDigitalTwinConfiguration = {
    ...config,
    identity: {
      ...config.identity,
      updatedAt: Date.now(),
      isPreset: false,
    },
  };

  // 1. Save to Firestore if available
  const currentUser = auth.currentUser;
  if (isFirebaseConfigured() && db && currentUser) {
    try {
      const docRef = doc(
        db,
        "users",
        currentUser.uid,
        "droneConfigurations",
        toSave.identity.id
      );
      await setDoc(docRef, toSave);
    } catch (e) {
      console.warn("Firestore save error, preserving locally:", e);
    }
  }

  // 2. Always persist locally as well
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      let list: DroneDigitalTwinConfiguration[] = raw ? JSON.parse(raw) : [];
      list = list.filter((item) => item.identity.id !== toSave.identity.id);
      list.push(toSave);
      localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(list));
      setActiveDigitalTwin(toSave);
    } catch {
      // Storage error
    }
  }
}

/**
 * Deletes a saved custom configuration.
 * Factory presets cannot be deleted.
 */
export async function deleteUserConfiguration(configId: string): Promise<boolean> {
  if (DIGITAL_TWIN_PRESETS.some((p) => p.identity.id === configId)) {
    return false; // Protected factory preset
  }

  // 1. Delete from Firestore if available
  const currentUser = auth.currentUser;
  if (isFirebaseConfigured() && db && currentUser) {
    try {
      const docRef = doc(
        db,
        "users",
        currentUser.uid,
        "droneConfigurations",
        configId
      );
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore delete error:", e);
    }
  }

  // 2. Delete locally
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      if (raw) {
        let list: DroneDigitalTwinConfiguration[] = JSON.parse(raw);
        list = list.filter((item) => item.identity.id !== configId);
        localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(list));
      }
    } catch {
      // Storage error
    }
  }

  return true;
}

/**
 * Duplicates an existing configuration with a new unique ID and copy name.
 */
export function duplicateConfiguration(
  source: DroneDigitalTwinConfiguration
): DroneDigitalTwinConfiguration {
  const newId = `custom-${source.identity.category}-${Date.now().toString(36)}`;
  return {
    ...JSON.parse(JSON.stringify(source)),
    identity: {
      ...source.identity,
      id: newId,
      name: `${source.identity.name} (Copy)`,
      isPreset: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
}
