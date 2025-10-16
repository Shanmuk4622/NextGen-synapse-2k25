
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
}

// This is the shape of the user-specific hook.
export interface UserHookResult {
  user: User | null;
  isAuthLoading: boolean;
}

// The actual React Context. It's undefined by default.
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);
const UserContext = createContext<UserHookResult | undefined>(undefined);


interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
    }, (error) => {
      console.error("FirebaseProvider: onAuthStateChanged error:", error);
      setUser(null);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
  }), [firebaseApp, firestore, auth]);

  const userContextValue = useMemo((): UserHookResult => ({
    user,
    isAuthLoading,
  }), [user, isAuthLoading]);

  // THIS IS THE CRITICAL FIX:
  // Do not render children until the initial auth check is complete.
  // This prevents any child component from rendering and triggering
  // a Firestore query before the auth state is known.
  if (isAuthLoading) {
    return null; // Or a global loading spinner
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      <UserContext.Provider value={userContextValue}>
        <FirebaseErrorListener />
        {children}
      </UserContext.Provider>
    </FirebaseContext.Provider>
  );
};


// HOOKS

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
 */
export const useUser = (): UserHookResult => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return context;
};

// useMemoFirebase remains unchanged.
type MemoFirebase <T> = T & {__memo?: boolean};
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}
