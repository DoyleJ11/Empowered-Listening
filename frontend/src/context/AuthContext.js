// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { auth, firestore } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null); // Simplified user object
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged: firebaseUser =", firebaseUser);
      setFirebaseUser(firebaseUser); // Store the full Firebase user object
      if (firebaseUser) {
        // Get user data from Firestore
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();

        if (userData) {
          // User exists in Firestore
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            role: userData.role,
          });
        } else {
          // User does not exist in Firestore, create a new document
          const defaultRole = "listener"; // Default role
          await setDoc(userDocRef, {
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            role: defaultRole,
          });
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            role: defaultRole,
          });
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // User is handled in onAuthStateChanged
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const logout = () => {
    signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
