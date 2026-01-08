// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCRomQxl_QiQxYvLVGkIWfqaO3Ay6x2Hlo",
    authDomain: "ai-automation-card.firebaseapp.com",
    projectId: "ai-automation-card",
    storageBucket: "ai-automation-card.firebasestorage.app",
    messagingSenderId: "55157088218",
    appId: "1:55157088218:web:fd5e1a3718c04084b6aae3",
    measurementId: "G-JYP9P5YV4V"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
