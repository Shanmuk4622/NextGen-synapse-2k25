
'use client';
/**
 * @fileoverview This file provides a React component that sets up the Genkit
 *   authentication context.
 */

import { GenkitConnectionProvider, type GenkitConnectionOptions } from '@genkit-ai/next/react';
import { useUser } from '@/firebase';
import React from 'react';

/**
 * Provides an authentication-aware Genkit provider.
 */
export function GenkitProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  const [options, setOptions] = React.useState<GenkitConnectionOptions>({});

  React.useEffect(() => {
    (async () => {
      if (!user) return;
      setOptions({
        auth: {
          uid: user.uid,
          getIdToken: async () => await user.getIdToken(),
        },
      });
    })();
  }, [user]);

  return (
    <GenkitConnectionProvider options={options}>
      {children}
    </GenkitConnectionProvider>
  );
}
