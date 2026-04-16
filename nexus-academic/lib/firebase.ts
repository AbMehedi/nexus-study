import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyDxIZ25JV7uSHmBb54Par64Gvj0Vdw0IuY",
  authDomain: "academin-nexus.firebaseapp.com",
  projectId: "academin-nexus",
  storageBucket: "academin-nexus.firebasestorage.app",
  messagingSenderId: "69189787105",
  appId: "1:69189787105:web:8851e924964a9f879f06a0"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
