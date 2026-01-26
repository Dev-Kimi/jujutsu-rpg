import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// AQUI É ONDE VOCÊ COLA AS SUAS CHAVES REAIS
const firebaseConfig = {
  apiKey: 'AIzaSyAwTTbf0naP-VXrIueTcGKkQ_1x14zSkOM',
  authDomain: 'banco-de-dados-jujutsu.firebaseapp.com',
  projectId: 'banco-de-dados-jujutsu',
  storageBucket: 'banco-de-dados-jujutsu.firebasestorage.app',
  messagingSenderId: '460856497012',
  appId: '1:460856497012:web:cbd7b1327237d845161221',
  measurementId: 'G-9GZB1QCLWT',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
