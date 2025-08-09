// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAYbiX6xIP7WVPGRrSYduqpGnmM52Fahck",
    authDomain: "shop-eeec7.firebaseapp.com",
    projectId: "shop-eeec7",
    storageBucket: "shop-eeec7.firebasestorage.app",
    messagingSenderId: "150225914691",
    appId: "1:150225914691:web:c98d8221394f7262f1bdf6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the app instance if needed
export default app;