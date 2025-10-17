
'use server';
/**
 * @fileOverview A secure flow for enrolling a student in a course.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore/lite';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin on the server
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

export const EnrollInCourseInputSchema = z.object({
  courseId: z.string().describe('The ID of the course to enroll in.'),
});
export type EnrollInCourseInput = z.infer<typeof EnrollInCourseInputSchema>;

export const EnrollInCourseOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type EnrollInCourseOutput = z.infer<typeof EnrollInCourseOutputSchema>;


export async function enrollInCourse(input: EnrollInCourseInput): Promise<EnrollInCourseOutput> {
  return enrollInCourseFlow(input);
}


const enrollInCourseFlow = ai.defineFlow(
  {
    name: 'enrollInCourseFlow',
    inputSchema: EnrollInCourseInputSchema,
    outputSchema: EnrollInCourseOutputSchema,
    auth: (auth, input) => {
        if (!auth) {
            throw new Error("User must be authenticated to enroll.");
        }
    }
  },
  async (input, { auth }) => {
    
    if (!auth) {
        // This should be caught by the auth policy, but as a safeguard:
        throw new Error('Authentication is required to enroll in a course.');
    }
    const studentId = auth.uid;
    const { courseId } = input;

    try {
        const courseRef = doc(db, 'courses', courseId);
        await updateDoc(courseRef, {
            enrolledStudentIds: arrayUnion(studentId)
        });

        return {
            success: true,
            message: 'Successfully enrolled in course.'
        };
    } catch (error: any) {
        console.error('Error in enrollInCourseFlow:', error);
        return {
            success: false,
            message: error.message || 'An unexpected error occurred during enrollment.'
        }
    }
  }
);
