// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBk4cXq-__9mm1CjbhYVzOuPlO_4CELNVE",
  authDomain: "downloader-x-f3c50.firebaseapp.com",
  projectId: "downloader-x-f3c50",
  storageBucket: "downloader-x-f3c50.firebasestorage.app",
  messagingSenderId: "588056930579",
  appId: "1:588056930579:web:a18e4b8316aef32c3892e6",
  measurementId: "G-WYQE22BM01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
