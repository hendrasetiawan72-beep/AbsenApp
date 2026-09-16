import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with experimentalForceLongPolling to avoid 10-second WebChannel stream timeouts
// in reverse proxies, cloud sandbox iframes, and restricted network environments.
let firestoreDb;
try {
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  const settings = {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  };
  firestoreDb = dbId
    ? initializeFirestore(app, settings, dbId)
    : initializeFirestore(app, settings);
} catch (e) {
  firestoreDb = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
}

export const db = firestoreDb;
export const googleAuthProvider = new GoogleAuthProvider();

// Test connection with timeout guard
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
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

