import { initializeApp } from "firebase/app";
import { getMessaging, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBk4cXq-__9mm1CjbhYVzOuPlO_4CELNVE",
  authDomain: "downloader-x-f3c50.firebaseapp.com",
  projectId: "downloader-x-f3c50",
  storageBucket: "downloader-x-f3c50.firebasestorage.app",
  messagingSenderId: "588056930579",
  appId: "1:588056930579:web:a18e4b8316aef32c3892e6",
  measurementId: "G-WYQE22BM01"
};

const app = initializeApp(firebaseConfig);
export const messaging: Messaging = getMessaging(app);