
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
  refetch: () => void;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query.
 * This hook does NOT automatically fetch data. It provides a `refetch` function
 * that must be called to initiate the data subscription.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: Query<DocumentData> | null,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const refetch = useCallback(() => {
    // If there's an existing listener, unsubscribe before creating a new one.
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // **Guard:** If the query isn't ready, do nothing and reset state.
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: WithId<T>[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const path: string = (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    unsubscribeRef.current = unsubscribe;

  }, [memoizedTargetRefOrQuery]);

  // Cleanup effect to unsubscribe when the component unmounts or the query changes.
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []); // Only run cleanup on unmount.

  return { data, isLoading, error, refetch };
}
