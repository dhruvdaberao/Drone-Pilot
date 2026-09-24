// ==========================================================
// DRONE PILOT — DIGITAL TWIN STORAGE & PERSISTENCE (PHASE 4)
// Dual-layer persistence: Firestore (authenticated) + LocalStorage (offline/demo)
// ==========================================================

import { DroneCategory, DroneDigitalTwinConfiguration, ConfigurationFetchResult } from "@/types/drone-digital-twin";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  getDocsFromServer,
  writeBatch,
} from "firebase/firestore";
import {
  TRAINING_QUADCOPTER_PRESET,
} from "./digital-twin-presets";

// ----------------------------------------------------------
// 1. LOCAL STORAGE HELPERS
// ----------------------------------------------------------
function getLocalSavedKey(uid: string | null): string {
  if (!uid) return "drone_pilot:anon:saved_digital_twins";
  return `drone_pilot:${uid}:saved_digital_twins`;
}

function getLocalActiveKey(uid: string | null): string {
  if (!uid) return "drone_pilot:anon:active_digital_twin";
  return `drone_pilot:${uid}:active_digital_twin`;
}

function getLocalLastSelectedKey(uid: string | null): string {
  if (!uid) return "drone_pilot:anon:last_selected_drone";
  return `drone_pilot:${uid}:last_selected_drone`;
}

// ----------------------------------------------------------
// 2. ACTIVE DIGITAL TWIN
// ----------------------------------------------------------

/**
 * Returns the currently active drone digital twin configuration for the simulator.
 */
export function getActiveDigitalTwin(uid: string | null): DroneDigitalTwinConfiguration {
  if (typeof window === "undefined") {
    return TRAINING_QUADCOPTER_PRESET;
  }
  try {
    const raw = localStorage.getItem(getLocalActiveKey(uid));
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
export function setActiveDigitalTwin(uid: string | null, config: DroneDigitalTwinConfiguration): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getLocalActiveKey(uid), JSON.stringify(config));
  } catch {
    // Storage error
  }
}

// ----------------------------------------------------------
// 3. LAST SELECTED DRONE
// ----------------------------------------------------------

export async function getLastSelectedDrone(uid: string | null): Promise<DroneCategory> {
  // 1. Try Firestore if authenticated
  if (uid && isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "users", uid);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().lastSelectedDrone) {
        return snap.data().lastSelectedDrone as DroneCategory;
      }
    } catch (e) {
      console.warn("Firestore getLastSelectedDrone error:", e);
    }
  }

  // 2. Local storage fallback
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(getLocalLastSelectedKey(uid));
      if (stored === "quadcopter" || stored === "hexacopter" || stored === "octacopter") {
        return stored;
      }
    } catch {}
  }
  
  return "quadcopter";
}

export async function setLastSelectedDrone(uid: string | null, category: DroneCategory): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(getLocalLastSelectedKey(uid), category);
  }

  if (uid && isFirebaseConfigured() && db) {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      const docRef = doc(db, "users", uid);
      await setDoc(docRef, { lastSelectedDrone: category, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
      console.warn("Firestore setLastSelectedDrone error:", e);
    }
  }
}

// ----------------------------------------------------------
// 4. MIGRATION OF EXISTING DATA
// ----------------------------------------------------------

async function migrateLegacyConfigurations(uid: string): Promise<void> {}

// ----------------------------------------------------------
// 5. USER CONFIGURATIONS
// ----------------------------------------------------------

/**
 * Loads all saved user configurations for the user.
 */
export async function listUserConfigurations(uid: string | null): Promise<DroneDigitalTwinConfiguration[]> {
  const customMap = new Map<string, DroneDigitalTwinConfiguration>();

  if (uid && isFirebaseConfigured() && db) {
    if (!(typeof navigator !== "undefined" && !navigator.onLine)) {
      try {
        const colRef = collection(db, "users", uid, "aircraftConfigurations");
        const snap = await getDocsFromServer(colRef);
        snap.forEach((docSnap) => {
          const data = docSnap.data() as DroneDigitalTwinConfiguration;
          if (data?.identity?.category) customMap.set(data.identity.category, data);
        });
        return Array.from(customMap.values());
      } catch (e: any) {
        console.warn("Firestore list configurations error:", e);
      }
    }
  }

  // LocalStorage fallback
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(getLocalSavedKey(uid));
      if (raw) {
        const customConfigs: DroneDigitalTwinConfiguration[] = JSON.parse(raw);
        customConfigs.forEach((c) => {
          if (c?.identity?.category) customMap.set(c.identity.category, c);
        });
      }
    } catch {}
  }

  return Array.from(customMap.values());
}

/**
 * Loads a specific category user configuration. Returns null if not configured.
 */
export async function getUserConfiguration(
  uid: string | null, 
  category: DroneCategory, 
  _preferLocal = false
): Promise<ConfigurationFetchResult> {
  if (!uid) {
    return { status: 'ERROR', data: null, error: 'Unauthenticated: no uid provided' };
  }

  if (isFirebaseConfigured() && db) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('FIRESTORE READ SKIPPED - browser reports offline');
      return { status: 'OFFLINE', data: null, error: 'Client is offline' };
    }

    try {
      const docRef = doc(db, 'users', uid, 'aircraftConfigurations', category);

      console.log('FIRESTORE READ START', {
        OPERATION: 'getUserConfiguration',
        UID: uid,
        TYPE: category,
        PATH: 'users/' + uid + '/aircraftConfigurations/' + category,
        START_TIME: Date.now(),
      });

      const snap = await getDocFromServer(docRef);

      if (snap.exists()) {
        const data = snap.data() as DroneDigitalTwinConfiguration;
        console.log('FIRESTORE READ SUCCESS', { UID: uid, TYPE: category });

        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(getLocalSavedKey(uid));
            let list: DroneDigitalTwinConfiguration[] = raw ? JSON.parse(raw) : [];
            list = list.filter(c => c.identity.category !== category);
            list.push(data);
            localStorage.setItem(getLocalSavedKey(uid), JSON.stringify(list));
          } catch {}
        }

        return { status: 'SUCCESS', data };
      } else {
        console.log('FIRESTORE READ NOT_FOUND', { UID: uid, TYPE: category });
        return { status: 'NOT_FOUND', data: null };
      }
    } catch (e: any) {
      console.warn('FIRESTORE READ FAILURE', { CODE: e?.code, MESSAGE: e?.message });
      const isOffline = e?.message?.includes('offline') || e?.message?.includes('timeout') || e?.code === 'unavailable' || (typeof navigator !== 'undefined' && !navigator.onLine);
      if (isOffline) return { status: 'OFFLINE', data: null, error: e.message };
      return { status: 'ERROR', data: null, error: e.message };
    }
  }

  return { status: 'OFFLINE', data: null, error: 'Firebase not configured' };
}

/**
 * Saves or updates a drone digital twin configuration for a specific category.
 */
export async function saveUserConfiguration(
  uid: string,
  category: DroneCategory,
  config: DroneDigitalTwinConfiguration
): Promise<void> {
  // Deep clone to ensure no React state, DOM nodes, or functions leak into Firestore
  const safeData = JSON.parse(JSON.stringify(config));
  
  const toSave: DroneDigitalTwinConfiguration = {
    ...safeData,
    identity: {
      ...safeData.identity,
      id: category, // Enforce canonical ID
      category: category,
      updatedAt: Date.now(),
      isPreset: false,
    },
  };

  // 1. Save to Firestore via batch
  if (isFirebaseConfigured() && db) {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("Client is offline. Cannot save to Firestore.");
      }

      console.log("FIRESTORE WRITE START", {
        path: `users/${uid}/aircraftConfigurations/${category}`,
        userDocPath: `users/${uid}`,
      });

      const batch = writeBatch(db);
      
      const configRef = doc(db, "users", uid, "aircraftConfigurations", category);
      batch.set(configRef, toSave, { merge: true });
      
      const userRef = doc(db, "users", uid);
      batch.set(userRef, { lastSelectedDrone: category, updatedAt: Date.now() }, { merge: true });
      
      await batch.commit();

      console.log("FIRESTORE WRITE SUCCESS", {
        category,
        uid
      });
    } catch (e: any) {
      console.error("FIRESTORE WRITE FAILURE", {
        code: e?.code,
        name: e?.name,
        message: e?.message,
        uid,
        category
      });
      // Rethrow to inform UI of sync failure so we don't falsely claim success
      throw e; 
    }
  }

  // 2. Persist locally ONLY as a successful cache update
  if (typeof window !== "undefined") {
    try {
      const key = getLocalSavedKey(uid);
      const raw = localStorage.getItem(key);
      let list: DroneDigitalTwinConfiguration[] = raw ? JSON.parse(raw) : [];
      list = list.filter((item) => item.identity.category !== category);
      list.push(toSave);
      localStorage.setItem(key, JSON.stringify(list));
      
      // Update last selected locally
      localStorage.setItem(getLocalLastSelectedKey(uid), category);
    } catch {
      // Storage error
    }
  }
}

// ----------------------------------------------------------
// 6. EXPORT / IMPORT
// ----------------------------------------------------------
export interface DroneExportPackage {
  format: "DRONE_PILOT_DIGITAL_TWIN";
  digitalTwinSchemaVersion: string;
  exportedAt: number;
  configuration: DroneDigitalTwinConfiguration;
}

export function exportDigitalTwinToJson(config: DroneDigitalTwinConfiguration): string {
  const pkg: DroneExportPackage = {
    format: "DRONE_PILOT_DIGITAL_TWIN",
    digitalTwinSchemaVersion: config.digitalTwinSchemaVersion || "1.0",
    exportedAt: Date.now(),
    configuration: config,
  };
  return JSON.stringify(pkg, null, 2);
}

export function importDigitalTwinFromJson(
  jsonStr: string
): { success: boolean; config?: DroneDigitalTwinConfiguration; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);

    let configToValidate: DroneDigitalTwinConfiguration;
    if (parsed.format === "DRONE_PILOT_DIGITAL_TWIN" && parsed.configuration) {
      configToValidate = parsed.configuration;
    } else if (parsed.identity && parsed.airframe && parsed.motors) {
      configToValidate = parsed;
    } else {
      return {
        success: false,
        error: "Malformed configuration file: missing required Digital Twin root structure.",
      };
    }

    const importedConfig: DroneDigitalTwinConfiguration = {
      ...configToValidate,
      digitalTwinSchemaVersion: configToValidate.digitalTwinSchemaVersion || "1.0",
      identity: {
        ...configToValidate.identity,
        isPreset: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    return {
      success: true,
      config: importedConfig,
    };
  } catch (e: any) {
    return {
      success: false,
      error: `JSON parse error: ${e.message || "Invalid JSON syntax"}`,
    };
  }
}
