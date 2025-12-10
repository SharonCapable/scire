import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

// Initialize Firebase Admin
if (!getApps().length) {
    // For development, you can use environment variables
    // For production, use a service account key file
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        app = initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
    } else {
        // Fallback for development - uses Application Default Credentials
        app = initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
    }

    db = getFirestore(app);

    // Set Firestore settings
    db.settings({
        ignoreUndefinedProperties: true,
    });
} else {
    app = getApps()[0];
    db = getFirestore(app);
}

export { db, app };
