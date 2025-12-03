import * as firebase from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- ATENÇÃO ---
// Substitua os valores abaixo pelos que você copiou do Console do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB9b0MxLS4DnW2N3s8QSmpVcU-N_jnxXL4",
  authDomain: "ornare-gestao.firebaseapp.com",
  projectId: "ornare-gestao",
  storageBucket: "ornare-gestao.firebasestorage.app",
  messagingSenderId: "980681006008",
  appId: "1:980681006008:web:c3fc5b3a11b1806a34cd4d",
  measurementId: "G-MLN9CMTJX0"
};

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
export const db = getFirestore(app);