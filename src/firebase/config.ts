// "use client";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { config } from "dotenv";
config();

// Your web app's Firebase configuration
export const FIREBASE_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Firebase Services
const storage = getStorage(app);
const auth = getAuth(app);
// const db = getFirestore(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

// Initialize Firebase Messaging
let messaging: any;

const initMessaging = async () => {
  if (typeof window !== "undefined") {
    const isMessagingSupported = await isSupported();
    if (isMessagingSupported) {
      messaging = getMessaging(app);
    } else {
      console.warn("Firebase Messaging is not supported in this browser.");
    }
  }
};

// Call the function to initialize messaging
// initMessaging();

export { db, auth, storage, messaging };

// Request for FCM Token
export const requestForToken = async () => {
  try {
    if (!messaging) {
      console.warn("Messaging is not initialized or not supported.");
      return null;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
    });
    if (currentToken) {
      return currentToken;
    } else {
      alert(
        "No registration token available. Request permission to generate one."
      );
      return null;
    }
  } catch (err) {
    alert("An error occurred while retrieving token: ");
    return null;
  }
};
