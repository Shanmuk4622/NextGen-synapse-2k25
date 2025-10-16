
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth, User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// This interface defines the shape of the context's value.
export interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  // This is now the definitive flag for whether the INITIAL auth check is done.
  isAuthLoading: boolean;
}

// This is the shape of the user-specific hook.
export interface UserHookResult {
  user: User | null;
  isAuthLoading: boolean;
}

// The actual React Context. It's undefined by default.
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

/**
 * FirebaseProvider: The core of the new authentication strategy.
 *
 * CRITICAL BEHAVIOR: This provider now implements a "hard gate". It will render
 * nothing (`null`) until the very first `onAuthStateChanged` event is received.
 * This guarantees that no child component, hook, or page can render or execute
 * a query until Firebase has confirmed the user's authentication status. This
 * completely eliminates the race condition that caused "auth: null" errors.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  // This state is the "gate". It starts true and only becomes false
  // after the first auth check is complete.
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires once on initialization and then again on any auth changes.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // Once this first callback fires, we know the initial auth state.
      // We can now "open the gate" by setting isAuthLoading to false.
      if (isAuthLoading) {
        setIsAuthLoading(false);
      }
    }, (error) => {
      console.error("FirebaseProvider: onAuthStateChanged error:", error);
      setUser(null);
      // Also open the gate on error.
      if (isAuthLoading) {
        setIsAuthLoading(false);
      }
    });

    // Cleanup subscription on unmount.
    return () => unsubscribe();
  }, [auth, isAuthLoading]); // Dependency on isAuthLoading ensures we only set it once.

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    user,
    isAuthLoading,
  }), [firebaseApp, firestore, auth, user, isAuthLoading]);

  // THE HARD GATE: If the initial authentication check is still running,
  // do not render any part of the application.
  if (isAuthLoading) {
    return null; // Or a global spinner component if preferred
  }

  // Once auth is resolved, render the app.
  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


// HOOKS: These are simplified now that the provider handles the auth gate.

function useFirebase(): FirebaseContextState {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
}

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;

/**
 * Hook specifically for accessing the authenticated user's state.
 * It provides the user object and the loading status of the initial auth check.
 */
export const useUser = (): UserHookResult => {
  const { user, isAuthLoading } = useFirebase();
  return { user, isAuthLoading };
};

// useMemoFirebase remains unchanged.
type MemoFirebase <T> = T & {__memo?: boolean};
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}
