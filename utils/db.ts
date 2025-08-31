

const DB_NAME = 'JarvisDB';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

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
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveAsset = async (key: string, asset: File): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(asset, key);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error(`Failed to save asset with key: ${key}.`));
  });
};

export const getAsset = async <T extends File>(key: string): Promise<T | null> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error(`Failed to retrieve asset with key: ${key}.`));
  });
};

export const deleteAsset = async (key: string): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error(`Failed to delete asset with key: ${key}.`));
  });
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