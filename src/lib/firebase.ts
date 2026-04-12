import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyArUNCOM_oTFmUOIz1lB_U5esGxNsOPs38",
  authDomain: "burnout12.firebaseapp.com",
  projectId: "burnout12",
  storageBucket: "burnout12.firebasestorage.app",
  messagingSenderId: "436970381513",
  appId: "1:436970381513:web:6d7471a88d28129c0c2d18",
  measurementId: "G-32DJ23LSDD",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
