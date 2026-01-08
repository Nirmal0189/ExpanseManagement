// Firebase Configuration
// IMPORTANT: Replaced with placeholders. Please restore your real keys.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "expense-manager.firebaseapp.com",
    projectId: "expense-manager",
    storageBucket: "expense-manager.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
