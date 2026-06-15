import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, getDoc, doc, orderBy, query, limit } from 'firebase/firestore';

// TTL of 5 minutes for cached Firestore queries
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Memory cache
const queryCache: Record<string, CacheEntry> = {};
const docCache: Record<string, CacheEntry> = {};

/**
 * Read from Session Storage if available (as a fallback/secondary cache level)
 */
function getSessionStorageItem(key: string): CacheEntry | null {
  try {
    const val = sessionStorage.getItem(`fs_cache_${key}`);
    if (val) {
      return JSON.parse(val);
    }
  } catch (e) {
    // Ignore storage errors on restricted environments
  }
  return null;
}

function setSessionStorageItem(key: string, entry: CacheEntry) {
  try {
    sessionStorage.setItem(`fs_cache_${key}`, JSON.stringify(entry));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * General cache invalidation utility. Clears both in-memory and sessionStorage caches.
 * Call this whenever any insert, update or delete operation completes on the db.
 */
export function invalidateFirestoreCache(collectionName?: string) {
  const prefix = collectionName ? `fs_cache_${collectionName}` : 'fs_cache_';
  
  // 1. In-memory cleanup
  if (collectionName) {
    Object.keys(queryCache).forEach(key => {
      if (key.startsWith(collectionName) || key.includes(collectionName)) {
        delete queryCache[key];
      }
    });
    Object.keys(docCache).forEach(key => {
      if (key.startsWith(collectionName) || key.includes(collectionName)) {
        delete docCache[key];
      }
    });
  } else {
    Object.keys(queryCache).forEach(k => delete queryCache[k]);
    Object.keys(docCache).forEach(k => delete docCache[k]);
  }

  // 2. SessionStorage cleanup
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
  } catch (e) {
    // Ignore storage errors
  }

  console.log(`[Cache Invalidation] Cleared Cache for: ${collectionName || 'all collections'}`);
}

/**
 * Fetches a list of documents with caching.
 */
export async function getDocsCached(
  collectionName: string,
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limitVal?: number
): Promise<any[]> {
  const cacheKey = `${collectionName}_ord_${orderByField || 'none'}_dir_${orderDirection}_lim_${limitVal || 'none'}`;
  const now = Date.now();

  // Try Memory Cache
  let cached = queryCache[cacheKey];
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  // Try SessionStorage Cache
  const storageCached = getSessionStorageItem(cacheKey);
  if (storageCached && (now - storageCached.timestamp < CACHE_TTL_MS)) {
    // Populate memory cache and return
    queryCache[cacheKey] = storageCached;
    return storageCached.data;
  }

  // Fetch from live database
  try {
    const colRef = collection(db, collectionName);
    let q;
    if (orderByField && limitVal) {
      q = query(colRef, orderBy(orderByField, orderDirection), limit(limitVal));
    } else if (orderByField) {
      q = query(colRef, orderBy(orderByField, orderDirection));
    } else if (limitVal) {
      q = query(colRef, limit(limitVal));
    } else {
      q = colRef;
    }

    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as any)
    }));

    const newEntry: CacheEntry = { data, timestamp: now };
    queryCache[cacheKey] = newEntry;
    setSessionStorageItem(cacheKey, newEntry);

    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
}

/**
 * Fetches a single document with caching.
 */
export async function getDocCached(
  collectionName: string,
  docId: string
): Promise<any> {
  const cacheKey = `${collectionName}_doc_${docId}`;
  const now = Date.now();

  // Try Memory Cache
  let cached = docCache[cacheKey];
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  // Try SessionStorage Cache
  const storageCached = getSessionStorageItem(cacheKey);
  if (storageCached && (now - storageCached.timestamp < CACHE_TTL_MS)) {
    docCache[cacheKey] = storageCached;
    return storageCached.data;
  }

  // Fetch from live database
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...(docSnap.data() as any) };
      const newEntry: CacheEntry = { data, timestamp: now };
      
      docCache[cacheKey] = newEntry;
      setSessionStorageItem(cacheKey, newEntry);
      return data;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
    return null;
  }
}
