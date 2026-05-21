import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, child, update, onValue, off, push, serverTimestamp, increment } from 'firebase/database'
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

const CLOUD_FUNCTIONS_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_URL

export {
  db,
  auth,
  ref,
  set,
  get,
  child,
  update,
  onValue,
  off,
  push,
  serverTimestamp,
  increment,
  signInWithCustomToken,
  signOut,
  CLOUD_FUNCTIONS_URL,
}
export default app
