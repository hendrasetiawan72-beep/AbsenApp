import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  memoryLocalCache,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Safe singleton Firestore initialization using memoryLocalCache to eliminate
// IndexedDB multi-tab lock contention and browser sandbox permission errors
const dbId = (firebaseConfig as any).firestoreDatabaseId;

let firestoreDb;
try {
  const settings = {
    localCache: memoryLocalCache(),
  };
  firestoreDb = dbId
    ? initializeFirestore(app, settings, dbId)
    : initializeFirestore(app, settings);
} catch (e) {
  // If already initialized in this runtime, reuse instance
  firestoreDb = getFirestore(app, dbId);
}

export const db = firestoreDb;
export const googleAuthProvider = new GoogleAuthProvider();

// Test connection with timeout guard
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 3500)
    );
    const testPromise = (async () => {
      await getDocFromServer(doc(db, 'test', 'connection'));
      return true;
    })();

    return await Promise.race([testPromise, timeoutPromise]);
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('timeout'))) {
      console.warn('Firestore connectivity status:', error.message);
    }
    return false;
  }
}


