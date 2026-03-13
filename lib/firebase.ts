import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA6555MqKTD3JCLe4E5en6Wi3WJDpBmj9g",
  authDomain: "flixyapp-b51d2.firebaseapp.com",
  projectId: "flixyapp-b51d2",
  storageBucket: "flixyapp-b51d2.firebasestorage.app",
  messagingSenderId: "823032292680",
  appId: "1:823032292680:web:f99e2d0c8c5e01fd1d3f7d",
  measurementId: "G-1FQ3BYF8NH"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
