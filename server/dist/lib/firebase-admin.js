import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from the parent directory if not already loaded
if (!process.env.FIREBASE_PROJECT_ID) {
    dotenv.config({ path: path.join(__dirname, '../../.env') });
}
// Initialize Firebase Admin SDK only once
if (getApps().length === 0) {
    try {
        console.log('Initializing Firebase Admin SDK...');
        console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
                initializeApp({
                    credential: cert(serviceAccount),
                    projectId: process.env.FIREBASE_PROJECT_ID,
                });
                console.log('Firebase Admin initialized with service account from environment variable');
            }
            catch (err) {
                console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY environment variable:', err);
            }
        }
        else if (process.env.FIREBASE_PROJECT_ID) {
            initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID,
            });
            console.log('Firebase Admin initialized with project ID');
        }
        else {
            console.warn('Firebase Admin not initialized - missing configuration');
        }
    }
    catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error);
    }
}
export { getAuth };
