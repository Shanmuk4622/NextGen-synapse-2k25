
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
 * It will correctly handle a `null` or `undefined` docRef, and wait for authentication
 * to be resolved before executing the query.
 */
export function useDoc<T = any>(
  memoizedDocRef: (DocumentReference<DocumentData> & {__memo?: boolean}) | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthLoading } = useUser();

  useEffect(() => {
    // If the docRef isn't ready OR we are still waiting for the initial auth
    // check, then we are in a loading state. Reset and wait.
    if (!memoizedDocRef || isAuthLoading) {
      setIsLoading(true);
      setData(null);
      setError(null);
      return;
    }

    // A valid reference is provided and auth is resolved. Start loading.
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
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

    return () => unsubscribe();
  }, [memoizedDocRef, isAuthLoading]);

  if(memoizedDocRef && !memoizedDocRef.__memo) {
    throw new Error('A firestore query was not properly memoized using useMemoFirebase');
  }

  // The hook is loading if the query is being prepared OR if the initial auth check is running.
  return { data, isLoading: isLoading || isAuthLoading, error };
}
