
'use client';

import { useState, useEffect } from 'react';
import type {
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '../provider';

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
 *
 * It will correctly handle a `null` or `undefined` query, and wait for authentication
 * to be resolved before executing the query.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthLoading } = useUser();

  useEffect(() => {
    // If the query isn't ready OR we are still waiting for the initial auth
    // check, then we are in a loading state. Reset and wait.
    if (!memoizedTargetRefOrQuery || isAuthLoading) {
      setIsLoading(true);
      setData(null);
      setError(null);
      return;
    }

    // A valid query is provided and auth is resolved. Start loading.
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: WithId<T>[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(results);
        setError(null); // Clear any previous error.
        setIsLoading(false); // Loading is complete.
      },
      (error: FirestoreError) => {
        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false); // Stop loading on error.

        // Propagate the error for global handling.
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // Cleanup subscription on unmount or if the query changes.
    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, isAuthLoading]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('A firestore query was not properly memoized using useMemoFirebase');
  }

  // The hook is loading if the query is being prepared OR if the initial auth check is running.
  return { data, isLoading: isLoading || isAuthLoading, error };
}
