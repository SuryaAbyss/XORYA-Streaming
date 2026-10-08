import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCdrBpZ_5G4M709SU6U1_to43hny1toaAQ",
  authDomain: "xorya-streaming.firebaseapp.com",
  projectId: "xorya-streaming",
  storageBucket: "xorya-streaming.firebasestorage.app",
  messagingSenderId: "1018668224964",
  appId: "1:1018668224964:web:bcfdcd75fdb45590d29491",
  measurementId: "G-ZZ05NM91MB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
