import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJAb0Xbu-2V7bUKsXXWyd3fIPQ5TO4qAk",
  authDomain: "join-3187.firebaseapp.com",
  databaseURL: "https://join-3187-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "join-3187",
  storageBucket: "join-3187.firebasestorage.app",
  messagingSenderId: "47681440648",
  appId: "1:47681440648:web:62f1ecfa741e3df1fd483d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);