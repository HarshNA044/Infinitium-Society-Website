import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const env = (import.meta as any).env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

const app = initializeApp(config);

// Use initializeFirestore to enable long polling as a fallback for connection issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId);

export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test: Online and accessible.");
  } catch (error: any) {
    if (error && (error.code === 'permission-denied' || (error.message && error.message.includes('permission-denied')))) {
      // If access is denied by security rules, it confirms we successfully connected to the Firebase Firestore backend server!
      console.log("Firestore connection test: Success (connected and secured by rules).");
      return;
    }
    const isOffline = error && (
      error.code === 'unavailable' || 
      (error.message && error.message.toLowerCase().includes('offline')) ||
      (error.message && error.message.toLowerCase().includes('failed to connect'))
    );
    if (isOffline) {
      console.warn("Firestore is operating in offline/cache mode. Handled gracefully; client will sync as soon as connectivity is established.");
    } else {
      console.error("Firestore connection checker received: ", error instanceof Error ? error.message : String(error));
    }
  }
}

testConnection();
