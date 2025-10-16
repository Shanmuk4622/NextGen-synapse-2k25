
'use client';

import { useState, useEffect } from 'react';
import type {
  DocumentReference,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '../provider';

export type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a single Firestore document.
 *
 * NEW BEHAVIOR: This hook no longer needs its own auth check. The parent
 * `FirebaseProvider` now guarantees that authentication is resolved before
 * this hook can even be executed.
 *
 * It will correctly handle a `null` or `undefined` docRef, entering a loading
 * state until a valid reference is provided.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If the document reference isn't ready, we are in a loading state.
    // Reset state and wait for a valid reference.
    if (!memoizedDocRef) {
      setIsLoading(true);
      setData(null);
      setError(null);
      return;
    }

    // A valid reference is provided. Start loading.
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document does not exist. This is a valid state, not an error.
          setData(null);
        }
        setError(null); // Clear any previous error.
        setIsLoading(false); // Loading is complete.
      },
      (error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false); // Stop loading on error.

        // Propagate the error for global handling.
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // Cleanup subscription on unmount or if the reference changes.
    return () => unsubscribe();
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
