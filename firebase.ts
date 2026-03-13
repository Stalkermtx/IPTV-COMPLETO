import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

let storageInstance = null;
if (firebaseConfig.storageBucket) {
  storageInstance = getStorage(app);
  storageInstance.maxUploadRetryTime = 10000; // 10 seconds timeout
}
export const storage = storageInstance;


