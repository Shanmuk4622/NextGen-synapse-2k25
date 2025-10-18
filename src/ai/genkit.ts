
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { firebaseAuth } from '@genkit-ai/firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

if (!getApps().length) {
  initializeApp(firebaseConfig);
}


export const ai = genkit({
  plugins: [googleAI(), firebaseAuth()],
  model: 'googleai/gemini-2.5-flash',
  enableTracing: true,
});
