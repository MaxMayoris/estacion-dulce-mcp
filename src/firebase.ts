import admin from 'firebase-admin';

// Inicializar Firebase Admin SDK
export function initializeFirebase(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required');
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (error) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON: Must be valid JSON');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return admin.firestore();
}

// Cliente Firestore singleton
let firestoreClient: admin.firestore.Firestore | null = null;

export function getFirestore(): admin.firestore.Firestore {
  if (!firestoreClient) {
    firestoreClient = initializeFirebase();
  }
  return firestoreClient;
}

