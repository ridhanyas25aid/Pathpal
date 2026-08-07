/**
 * Path Pal AI - Firebase Core Service Integrator
 * Handles SDK initialization for Authentication, Firestore, and Storage.
 */

// Replace this config with your actual Firebase Project config from the Firebase Console.

  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxHQ3vYcdgSsEI9IVbmKUeD_Trae8dyug",
  authDomain: "tamilnadu-safe-nav.firebaseapp.com",
  projectId: "tamilnadu-safe-nav",
  storageBucket: "tamilnadu-safe-nav.firebasestorage.app",
  messagingSenderId: "372745991027",
  appId: "1:372745991027:web:10e5c2a9c606706ddf8b06",
  measurementId: "G-CWLCC7H84J"
};


// Initialize Firebase App instance
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Global service interfaces
window.auth = firebase.auth();
window.db = firebase.firestore();
window.storage = firebase.storage();

// Configure Firestore offline persistence for reliability
window.db.enablePersistence().catch(err => {
  if (err.code == 'failed-precondition') {
    console.warn("Firestore persistence failed: Multiple tabs open.");
  } else if (err.code == 'unimplemented') {
    console.warn("Firestore persistence is not supported by this browser.");
  }
});
