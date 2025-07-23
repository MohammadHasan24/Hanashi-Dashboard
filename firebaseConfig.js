import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read env vars
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 🔍 Log all config keys
console.log('%cFIREBASE CONFIG', 'color: #00caff; font-weight: bold;', firebaseConfig);

// ✅ Check for missing environment variables (only in development)
if (typeof window !== 'undefined' && location.hostname === 'localhost') {
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) {
      console.warn(`⚠️ Missing ENV var: ${key}`);
    }
  });
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore (with long polling for CORS issues)
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  console.warn('⚠️ Firestore already initialized. Falling back to getFirestore().');
  db = getFirestore(app);
}

const auth = getAuth(app);
const storage = getStorage(app);

export { auth, db, storage };
