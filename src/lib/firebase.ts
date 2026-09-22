import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  memoryLocalCache,
  disableNetwork,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Safe singleton Firestore initialization using memoryLocalCache to eliminate
// IndexedDB multi-tab lock contention and browser sandbox permission errors
const dbId = (firebaseConfig as any).firestoreDatabaseId;

let firestoreDb: any;
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

// Silence noisy internal SDK error logs when quota limits are reached
try {
  setLogLevel('silent');
} catch {}

// Automatically suppress network write loops if project daily quota is exhausted
if (typeof window !== 'undefined') {
  // Intercept Firestore backoff & quota error console noise
  const origConsoleError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const joined = args
      .map((a) => (typeof a === 'string' ? a : a?.message ? a.message : String(a || '')))
      .join(' ');
    if (
      joined.includes('@firebase/firestore') ||
      joined.includes('resource-exhausted') ||
      joined.includes('Quota limit exceeded') ||
      joined.includes('Using maximum backoff delay') ||
      joined.includes('Free daily write units')
    ) {
      try {
        const payload = JSON.stringify({
          exceeded: true,
          timestamp: Date.now(),
          reason: 'Batas kuota harian Cloud Firestore tercapai',
        });
        localStorage.setItem('smk_firestore_quota_exceeded', payload);
        sessionStorage.setItem('smk_firestore_quota_exceeded', payload);
      } catch {}
      try {
        disableNetwork(firestoreDb).catch(() => {});
      } catch {}
      console.warn('[Firestore] Notice: Kuota Cloud tercapai. Menggunakan penyimpanan offline browser.');
      return;
    }
    origConsoleError(...args);
  };

  try {
    const raw =
      localStorage.getItem('smk_firestore_quota_exceeded') ||
      sessionStorage.getItem('smk_firestore_quota_exceeded');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        disableNetwork(firestoreDb).catch(() => {});
      }
    }
  } catch {}

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    const code = reason?.code || '';
    if (
      code === 'resource-exhausted' ||
      msg.includes('resource-exhausted') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('Quota exceeded') ||
      msg.includes('Free daily write units')
    ) {
      console.warn('[Firebase] Quota limit reached; network paused to preserve local storage stability.');
      event.preventDefault();
      try {
        const payload = JSON.stringify({
          exceeded: true,
          timestamp: Date.now(),
          reason: msg,
        });
        localStorage.setItem('smk_firestore_quota_exceeded', payload);
        sessionStorage.setItem('smk_firestore_quota_exceeded', payload);
        window.dispatchEvent(
          new CustomEvent('firestore_quota_exceeded', { detail: { reason: msg } })
        );
      } catch {}
      try {
        disableNetwork(firestoreDb).catch(() => {});
      } catch {}
    }
  });
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


