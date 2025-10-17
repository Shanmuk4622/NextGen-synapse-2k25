'use client';
/**
 * @fileoverview This provider is responsible for bridging Firebase Authentication
 * with the Genkit client. It retrieves the current user's ID token and configures
 * the Genkit API client to automatically include it in all requests, enabling
 * authenticated server-side flows.
 */

import { GenkitConnectionProvider, type GenkitConnectionOptions } from '@genkit-ai/next/react';
import { useUser } from '@/firebase';
import React from 'react';

/**
 * A client-side component that provides Genkit connection configuration.
 */
export function GenkitProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading } = useUser();
  const [config, setConfig] = React.useState<GenkitConnectionOptions>();

  React.useEffect(() => {
    async function getAuthToken() {
      if (!user) {
        // If there's no user, clear the config.
        setConfig(undefined);
        return;
      }
      try {
        // Get the Firebase ID token for the current user.
        const token = await user.getIdToken();
        // Set the Genkit configuration with the authorization header.
        setConfig({
          requestHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        // If getting the token fails, log the error and clear config.
        console.error('Failed to get user auth token for Genkit', e);
        setConfig(undefined);
      }
    }
    // Re-run this effect whenever the user object changes.
    getAuthToken();
  }, [user]);

  // Do not render children until authentication status is resolved.
  if (isAuthLoading) {
    return null;
  }

  // Wrap children with the GenkitConnectionProvider, passing the auth config.
  return (
    <GenkitConnectionProvider config={config}>
      {children}
    </GenkitConnectionProvider>
  );
}
