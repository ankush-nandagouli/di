import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyADZirx15puloMVWbG-AkQI4VVg1lf_FjQ",
  authDomain: "concentrated-port-6gtt6.firebaseapp.com",
  projectId: "concentrated-port-6gtt6",
  storageBucket: "concentrated-port-6gtt6.firebasestorage.app",
  messagingSenderId: "511026945823",
  appId: "1:511026945823:web:6ac86dacdba42bdcfa9a2a"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
