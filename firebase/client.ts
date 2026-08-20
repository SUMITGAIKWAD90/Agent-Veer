import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {getFirestore} from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyDo2PHeU5zA4nSpeaexyO_vP7kb1irQzoA",
  authDomain: "register01-1ddf6.firebaseapp.com",
  databaseURL: "https://register01-1ddf6-default-rtdb.firebaseio.com",
  projectId: "register01-1ddf6",
  storageBucket: "register01-1ddf6.firebasestorage.app",
  messagingSenderId: "421482049095",
  appId: "1:421482049095:web:9d18d33e49dde39f9d0b62",
  measurementId: "G-JJZ9J0ZSFW"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);