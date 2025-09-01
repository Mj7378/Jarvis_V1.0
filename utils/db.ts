import type { CustomAppDefinition } from '../types';

const DB_NAME = 'JarvisDB';
const DB_VERSION = 2; // Bump version for schema change
const ASSETS_STORE_NAME = 'assets';
const CUSTOM_APPS_STORE_NAME = 'customApps';


let db: IDBDatabase;

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // If the database connection is already open, resolve it.
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error("Error opening IndexedDB."));
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    // This event is fired only when the DB version changes.
    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      // Create an object store if it doesn't exist.
      if (!dbInstance.objectStoreNames.contains(ASSETS_STORE_NAME)) {
        dbInstance.createObjectStore(ASSETS_STORE_NAME);
      }
       // Create the new object store for custom apps
      if (!dbInstance.objectStoreNames.contains(CUSTOM_APPS_STORE_NAME)) {
        dbInstance.createObjectStore(CUSTOM_APPS_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveAsset = async (key: string, asset: File): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ASSETS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ASSETS_STORE_NAME);
    const request = store.put(asset, key);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error(`Failed to save asset with key: ${key}.`));
  });
};

export const getAsset = async <T extends File>(key: string): Promise<T | null> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ASSETS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(ASSETS_STORE_NAME);
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error(`Failed to retrieve asset with key: ${key}.`));
  });
};

export const deleteAsset = async (key: string): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ASSETS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ASSETS_STORE_NAME);
    const request = store.delete(key);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error(`Failed to delete asset with key: ${key}.`));
  });
};

// --- New Functions for Custom Apps ---
export const saveCustomApp = async (app: CustomAppDefinition): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CUSTOM_APPS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CUSTOM_APPS_STORE_NAME);
    store.put(app);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error(`Failed to save custom app with id: ${app.id}.`));
  });
};

export const getCustomApps = async (): Promise<CustomAppDefinition[]> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CUSTOM_APPS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CUSTOM_APPS_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error('Failed to retrieve custom apps.'));
  });
};

export const deleteCustomApp = async (appId: string): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CUSTOM_APPS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CUSTOM_APPS_STORE_NAME);
    store.delete(appId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error(`Failed to delete custom app with id: ${appId}.`));
  });
};


export const getOperatingSystem = (): 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS' | 'Unknown' => {
  const userAgent = window.navigator.userAgent;

  if (userAgent.indexOf("Win") !== -1) return "Windows";
  if (userAgent.indexOf("Mac") !== -1) return "macOS";
  // Check for Linux before Android, as Android user agents also contain "Linux"
  if (userAgent.indexOf("Linux") !== -1 && userAgent.indexOf("Android") === -1) return "Linux";
  if (userAgent.indexOf("Android") !== -1) return "Android";
  // Use a regex to check for iOS devices
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return "iOS";
  
  return "Unknown";
};

export const parseTimeString = (timeString: string): number | null => {
  const now = new Date();
  const lowerCaseTimeString = timeString.toLowerCase();

  // Case 1: "in X minutes/hours"
  let match = lowerCaseTimeString.match(/in (\d+)\s+(minute|hour)s?/);
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const newDate = new Date(now.getTime());
    if (unit === 'minute') {
      newDate.setMinutes(now.getMinutes() + amount);
    } else if (unit === 'hour') {
      newDate.setHours(now.getHours() + amount);
    }
    return newDate.getTime();
  }

  // Case 2: "at H:MM AM/PM" or "at H AM/PM" (today or tomorrow)
  match = lowerCaseTimeString.match(/(tomorrow at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (match) {
    const isTomorrow = !!match[1];
    let hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3] || '0', 10); // Default to 0 if minutes not provided
    const ampm = match[4];

    if (ampm === 'pm' && hours < 12) {
      hours += 12;
    }
    if (ampm === 'am' && hours === 12) { // Midnight case
      hours = 0;
    }

    const reminderDate = new Date();
    if (isTomorrow) {
      reminderDate.setDate(now.getDate() + 1);
    }
    
    reminderDate.setHours(hours, minutes, 0, 0);

    // If the time is in the past for today, assume it's for tomorrow (unless "tomorrow" was specified)
    if (!isTomorrow && reminderDate.getTime() < now.getTime()) {
      reminderDate.setDate(now.getDate() + 1);
    }
    
    return reminderDate.getTime();
  }

  return null;
};