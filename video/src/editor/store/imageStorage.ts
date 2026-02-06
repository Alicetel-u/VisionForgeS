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

// Clean up old localStorage data that may contain Base64 images
export const cleanupOldStorage = (): void => {
    const storageKey = 'vision-forge-storage';
    try {
        const data = localStorage.getItem(storageKey);
        if (data) {
            // If stored data is larger than 100KB, it likely contains Base64 images
            // Clear it to force a fresh start with IndexedDB-based storage
            if (data.length > 100 * 1024) {
                console.warn('Clearing oversized localStorage data to migrate to IndexedDB storage');
                localStorage.removeItem(storageKey);
            }
        }
    } catch (e) {
        // If we can't even read localStorage, clear everything
        console.error('Error accessing localStorage, clearing:', e);
        try {
            localStorage.removeItem(storageKey);
        } catch (e2) {
            console.error('Failed to clear localStorage:', e2);
        }
    }
};

// Run cleanup on module load
cleanupOldStorage();
