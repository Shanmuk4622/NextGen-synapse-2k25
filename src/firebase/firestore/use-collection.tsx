
'use client';

import { useState, useEffect } from 'react';
import type {
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '@/firebase/provider'; // Import useUser

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
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
 * Automatically manages the subscription lifecycle based on the query provided.
 */
export function useCollection<T = any>(
    memoizedQuery: Query<DocumentData> | null,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthLoading } = useUser(); // Get authentication loading status

  useEffect(() => {
    // If auth is loading OR the query is not ready, do nothing.
    if (isAuthLoading || !memoizedQuery) {
      setData(null);
      setError(null);
      // We are only truly "not loading" if auth is done and there's no query.
      setIsLoading(isAuthLoading);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: WithId<T>[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const path: string = (memoizedQuery as unknown as InternalQuery)._query.path.canonicalString();

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

    // Unsubscribe from the listener when the component unmounts or the query changes.
    return () => unsubscribe();
  }, [memoizedQuery, isAuthLoading]); // Re-run effect if query or auth status changes.

  return { data, isLoading, error };
}
