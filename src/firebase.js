import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBaBr4ef9L2N04MkRTGwwqRyOifLlNHUhw",
  authDomain: "expensify-a9347.firebaseapp.com",
  projectId: "expensify-a9347",
  storageBucket: "expensify-a9347.firebasestorage.app",
  messagingSenderId: "146717555857",
  appId: "1:146717555857:web:52a1424997dac71f8c5330",
  databaseURL: "https://expensify-a9347-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app);