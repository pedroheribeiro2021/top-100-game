// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCEBHGxBdbKdqTqs8el5RgweMg38JddCDM",
  authDomain: "top-100-game.firebaseapp.com",
  projectId: "top-100-game",
  storageBucket: "top-100-game.firebasestorage.app",
  messagingSenderId: "307868606079",
  appId: "1:307868606079:web:a28cc342adef659ef1694a",
  measurementId: "G-GFRDZQV1P1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const db = getFirestore(app);
