// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC_qgUfDCnZlRhs6MnZTpNDPoJMl5hPEGw",
  authDomain: "cuyecitosbd-49824.firebaseapp.com",
  projectId: "cuyecitosbd-49824",
  storageBucket: "cuyecitosbd-49824.firebasestorage.app",
  messagingSenderId: "612701891221",
  appId: "1:612701891221:web:2018fc11f6bb77b96f499c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
