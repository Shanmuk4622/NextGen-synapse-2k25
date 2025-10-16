
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
import { useUser } from '@/firebase/provider'; // Import useUser

export type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a single Firestore document.
 * Automatically manages the subscription lifecycle based on the document reference provided.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthLoading } = useUser(); // Get authentication loading status

  useEffect(() => {
    // If auth is loading OR the document reference is not ready, do nothing.
    // Set loading to true if we expect a ref but don't have it yet.
    if (isAuthLoading || !memoizedDocRef) {
      setData(null);
      setError(null);
      // We are only truly "not loading" if auth is done and there's no doc ref.
      setIsLoading(isAuthLoading);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document doesn't exist
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // Unsubscribe from the listener when the component unmounts or the ref changes.
    return () => unsubscribe();
  }, [memoizedDocRef, isAuthLoading]); // Re-run effect if doc ref or auth status changes.
  
  return { data, isLoading, error };
}
