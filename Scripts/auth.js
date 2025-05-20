// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, onValue, set, push, get, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCYXiF6EY04Wo3Gkj-i99_AyAq8rihNInU",
  authDomain: "f7coachingdata.firebaseapp.com",
  databaseURL: "https://f7coachingdata-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "f7coachingdata",
  storageBucket: "f7coachingdata.firebasestorage.app",
  messagingSenderId: "878911060444",
  appId: "1:878911060444:web:07e2b88f87fc68e718b719",
  measurementId: "G-Z480KWS92G"
};

// Initialize Firebsase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // ✅ Define db

// Exported functions
export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutUser() {
  return signOut(auth);
}

export function onUserChange(callback) {
  onAuthStateChanged(auth, callback);
}

export { db, ref, onValue, set, push, get, update };