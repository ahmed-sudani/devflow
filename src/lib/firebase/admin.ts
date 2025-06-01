import {
  initializeApp,
  getApps,
  cert,
  ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FirebaseError } from "firebase/app";

const serviceAccount = JSON.parse(
  atob(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!)
);

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
  });
}

export const adminAuth = getAuth();

// Create custom token for NextAuth user
export async function createCustomToken(
  userId: string,
  additionalClaims?: object
) {
  try {
    const customToken = await adminAuth.createCustomToken(
      userId,
      additionalClaims
    );
    return customToken;
  } catch (error) {
    console.error("Error creating custom token:", error);
    throw error;
  }
}

ensureFirebaseUser({ uid: "ahmed" });

// Ensure Firebase user exists and sync with NextAuth user data
export async function ensureFirebaseUser(userData: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}) {
  try {
    // Try to get existing user
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUser(userData.uid);
    } catch (error) {
      if ((error as FirebaseError).code === "auth/user-not-found") {
        // Create user if doesn't exist
        firebaseUser = await adminAuth.createUser({
          uid: userData.uid,
          email: userData.email || undefined,
          displayName: userData.displayName || undefined,
          photoURL: userData.photoURL || undefined,
        });
      } else {
        throw error;
      }
    }

    // Update user info if needed
    const updateData = {
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    };
    if (userData.email && firebaseUser.email !== userData.email) {
      updateData.email = userData.email;
    }
    if (
      userData.displayName &&
      firebaseUser.displayName !== userData.displayName
    ) {
      updateData.displayName = userData.displayName;
    }
    if (userData.photoURL && firebaseUser.photoURL !== userData.photoURL) {
      updateData.photoURL = userData.photoURL;
    }

    if (Object.keys(updateData).length > 0) {
      await adminAuth.updateUser(userData.uid, updateData);
    }

    return firebaseUser;
  } catch (error) {
    console.error("Error ensuring Firebase user:", error);
    throw error;
  }
}
