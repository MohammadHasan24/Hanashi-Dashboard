// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA4WGIWPFccAgZiqiDjDMPwbeQT8PFnIQo",
  authDomain: "hanashi-beta.firebaseapp.com",
  projectId: "hanashi-beta",
  storageBucket: "hanashi-beta.firebasestorage.app",
  messagingSenderId: "428591119484",
  appId: "1:428591119484:web:b40803b47bf70ba1fc5df9",
  measurementId: "G-XXND8L5ES7",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
