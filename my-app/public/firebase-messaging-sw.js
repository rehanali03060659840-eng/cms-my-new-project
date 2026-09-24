importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
apiKey: "AIzaSyBk4cXq-__9mm1CjbhYVzOuPlO_4CELNVE",
  authDomain: "downloader-x-f3c50.firebaseapp.com",
  projectId: "downloader-x-f3c50",
  storageBucket: "downloader-x-f3c50.firebasestorage.app",
  messagingSenderId: "588056930579",
  appId: "1:588056930579:web:a18e4b8316aef32c3892e6",
  measurementId: "G-WYQE22BM01"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => { 
  console.log('Background message:', payload);
});