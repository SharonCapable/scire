import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

// Initialize Firebase Admin
if (!getApps().length) {
    try {
        // For development, you can use environment variables
        // For production, use a service account key file
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            console.log('Initializing Firebase with service account...');

            let serviceAccount;
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            } catch (parseError) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT using simple JSON.parse');

                // Try to handle common env var formatting issues (e.g. escaped newlines)
                try {
                    const sanitized = process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n');
                    serviceAccount = JSON.parse(sanitized);
                    console.log('Successfully parsed FIREBASE_SERVICE_ACCOUNT after sanitizing newlines');
                } catch (retryError) {
                    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT after sanitization:', retryError);
                    console.error('FIREBASE_SERVICE_ACCOUNT first 50 chars:', process.env.FIREBASE_SERVICE_ACCOUNT.substring(0, 50));
                    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON. Ensure you pasted the full content of the service account JSON file into the Vercel environment variable.');
                }
            }

            if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
                throw new Error('FIREBASE_SERVICE_ACCOUNT is missing required fields (project_id, private_key, or client_email)');
            }

            app = initializeApp({
                credential: cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
            });
            console.log('Firebase initialized successfully');
        } else {
            console.log('No FIREBASE_SERVICE_ACCOUNT found, using Application Default Credentials...');
            if (!process.env.FIREBASE_PROJECT_ID) {
                throw new Error('FIREBASE_PROJECT_ID environment variable is required');
            }
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
    } catch (error) {
        console.error('Firebase initialization error:', error);
        throw error;
    }
} else {
    app = getApps()[0];
    db = getFirestore(app);
}

export { db, app };
