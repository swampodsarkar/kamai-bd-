import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, child, update, onValue, off, push, increment } from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyCfwz5irJzMy1UGzVhqb4rmqL4z-jeeJzA',
  authDomain: 'minerx-market.firebaseapp.com',
  databaseURL: 'https://minerx-market-default-rtdb.firebaseio.com',
  projectId: 'minerx-market',
  storageBucket: 'minerx-market.firebasestorage.app',
  messagingSenderId: '1080849676320',
  appId: '1:1080849676320:web:1faa3502ad7899c6192445',
  measurementId: 'G-E0SGPXWBQ4',
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

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
  increment,
  signInAnonymously,
}
export default app
