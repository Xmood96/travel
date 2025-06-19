// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZl9JWuIm4yHS6ZZtJi_xJk5KeGWcQRC8",
  authDomain: "travelagency-sd.firebaseapp.com",
  projectId: "travelagency-sd",
  storageBucket: "travelagency-sd.firebasestorage.app",
  messagingSenderId: "1021951570638",
  appId: "1:1021951570638:web:9a87b4217d4f40cc30d69f",
  measurementId: "G-FQDWFV931W",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
