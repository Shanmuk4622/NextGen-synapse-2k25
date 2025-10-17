
import {genkit, FlowAuth, Auth } from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

// Simple in-memory store for auth users.
// In a real application, you would want to use a more robust session management solution.
const userStore: { [key: string]: User } = {};

onAuthStateChanged(getAuth(), (user) => {
    if (user) {
        userStore[user.uid] = user;
    }
})

function firebaseAuthPolicy(auth: Auth | undefined, input: any) {
  const userId = auth?.uid;
  if (!userId) {
    throw new Error('Authentication is required.');
  }
  const user = userStore[userId];
  if (!user) {
     throw new Error('User not found or session expired. Please log in again.');
  }
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
  auth: firebaseAuthPolicy,
  enableTracing: true,
});
