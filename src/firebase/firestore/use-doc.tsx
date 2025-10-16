
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  DocumentReference,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
  refetch: () => void;
}

/**
 * React hook to subscribe to a single Firestore document.
 * This hook does NOT automatically fetch data. It provides a `refetch` function
 * that must be called to initiate the data subscription.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const refetch = useCallback(() => {
    // If there's an existing listener, unsubscribe before creating a new one.
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    // **Guard:** If the doc ref isn't ready, do nothing and reset state.
    if (!memoizedDocRef) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

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

    unsubscribeRef.current = unsubscribe;

  }, [memoizedDocRef]);

  // Cleanup effect to unsubscribe when the component unmounts.
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []); // Only run cleanup on unmount.
  
  return { data, isLoading, error, refetch };
}
