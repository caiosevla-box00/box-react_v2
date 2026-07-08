import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, doc,
  onSnapshot, setDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp,
  enableNetwork, disableNetwork,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDrHdKDTUiwVa1XgG_YZmDsTb3cubSnV-o",
  authDomain: "a-casa-da-progressiva.firebaseapp.com",
  projectId: "a-casa-da-progressiva",
  storageBucket: "a-casa-da-progressiva.firebasestorage.app",
  messagingSenderId: "332955165526",
  appId: "1:332955165526:web:e96786a5ace69496cdacf7"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Collections
export const COLS = {
  clientes:     'box00_clientes',
  agendamentos: 'box00_agendamentos',
  atendimentos: 'box00_atendimentos',
  saidas:       'box00_saidas',
  config:       'box00_config',
} as const

// Helpers
export function gerarId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function tsToStr(ts: any): string {
  if (!ts) return ''
  if (ts instanceof Timestamp) return ts.toDate().toISOString().slice(0, 10)
  if (typeof ts === 'string') return ts
  return ''
}

export {
  collection, doc, onSnapshot, setDoc, addDoc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp,
  enableNetwork, disableNetwork,
}
