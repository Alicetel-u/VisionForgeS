// IndexedDB-based image storage to avoid localStorage quota limits
const DB_NAME = 'vision-forge-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const saveImage = async (id: string, dataUrl: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id, dataUrl });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getImage = async (id: string): Promise<string | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.dataUrl : null);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteImage = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getAllImageIds = async (): Promise<string[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();

        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
    });
};

// Check if a string is a Base64 data URL
export const isBase64DataUrl = (str: string | undefined): boolean => {
    if (!str) return false;
    return str.startsWith('data:image/');
};

// Generate a unique image ID
export const generateImageId = (): string => {
    return `img_${crypto.randomUUID()}`;
};

// Clean up old localStorage data - DISABLED to prevent data loss
// The old aggressive cleanup was deleting valid data when Base64 fallback was used
export const cleanupOldStorage = (): void => {
    // No-op: We no longer clear localStorage automatically
    // IndexedDB is now the primary storage for images, with localStorage as reference storage
    // If quota issues occur, they will be handled at save time
};
