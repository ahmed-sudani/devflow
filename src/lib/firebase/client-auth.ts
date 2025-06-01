"use client";
import {
  getAuth,
  signInWithCustomToken,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { app } from "./config"; // Your Firebase client config

const auth = getAuth(app);

export async function signInToFirebase(customToken: string) {
  try {
    const userCredential = await signInWithCustomToken(auth, customToken);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in to Firebase:", error);
    throw error;
  }
}

export function onFirebaseAuthStateChanged(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(auth, callback);
}

export function signOutFromFirebase() {
  return auth.signOut();
}

export { auth as firebaseAuth };
