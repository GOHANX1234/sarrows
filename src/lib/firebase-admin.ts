import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let firebaseApp: App | null = null;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  }

  let credentials: {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };

  try {
    credentials = JSON.parse(rawCredentials);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  if (!credentials.project_id || !credentials.client_email || !credentials.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing required service-account fields");
  }

  firebaseApp =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: credentials.project_id,
        clientEmail: credentials.client_email,
        privateKey: credentials.private_key.replace(/\\n/g, "\n"),
      }),
    });

  return firebaseApp;
}

export function getFirebaseMessaging(): Messaging {
  return getMessaging(getFirebaseApp());
}