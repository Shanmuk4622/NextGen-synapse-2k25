
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
import { useUser } from '@/firebase/provider';

export type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a single Firestore document.
 * It now implicitly waits for auth to be ready because FirebaseProvider won't render it otherwise.
 */
export function useDoc<T = any>(
  memoizedDocRef: (DocumentReference<DocumentData> & {__memo?: boolean}) | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const { isAuthLoading } = useUser();

  useEffect(() => {
    // If the doc ref isn't ready OR if auth is still loading, do nothing.
    if (!memoizedDocRef || isAuthLoading) {
      setData(null);
      setError(null);
      return;
    }

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Explicitly set to null if the document does not exist.
          setData(null);
        }
        setError(null);
      },
      (error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });

        setError(contextualError);
        setData(null);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef, isAuthLoading]);

  if(memoizedDocRef && !memoizedDocRef.__memo) {
    throw new Error('A firestore query was not properly memoized using useMemoFirebase');
  }

  // isLoading is true if a docRef is provided but we don't have data or an error yet.
  const isLoading = (!!memoizedDocRef && data === null && error === null);
  
  return { data, isLoading, error };
}
