const DB_NAME = 'JarvisDB';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
const VIDEO_KEY = 'bootVideo';

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

export const saveVideo = async (videoFile: File): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(videoFile, VIDEO_KEY);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Failed to save video."));
  });
};

export const getVideo = async (): Promise<File | null> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(VIDEO_KEY);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error("Failed to retrieve video."));
  });
};

export const deleteVideo = async (): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(VIDEO_KEY);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Failed to delete video."));
  });
};
