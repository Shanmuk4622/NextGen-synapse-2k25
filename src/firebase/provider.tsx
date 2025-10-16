
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
  isAuthLoading: boolean; // This remains to signal the initial auth check
}

// The actual React Contexts.
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
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Always starts true

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false); // Auth check is complete
    }, (error) => {
      console.error("FirebaseProvider: onAuthStateChanged error:", error);
      setUser(null);
      setIsAuthLoading(false); // Auth check is complete, even on error
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

  // THE AUTHENTICATION GATE:
  // Do not render children until the initial authentication check is complete.
  // This prevents any child component from rendering and attempting to fetch
  // data before we know the user's authentication status.
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
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

export const useUser = (): UserHookResult => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return context;
};

type MemoFirebase <T> = T & {__memo?: boolean};
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}
