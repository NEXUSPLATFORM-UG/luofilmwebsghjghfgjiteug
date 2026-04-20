import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDLTChrn95RRzf-iVEhKjh5JJoX9rKTvNY",
  authDomain: "luo-film-site.firebaseapp.com",
  databaseURL: "https://luo-film-site-default-rtdb.firebaseio.com",
  projectId: "luo-film-site",
  storageBucket: "luo-film-site.firebasestorage.app",
  messagingSenderId: "778290137107",
  appId: "1:778290137107:web:57c41ff3a19d618c5397e6",
  measurementId: "G-J8PMRX2BZY",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
