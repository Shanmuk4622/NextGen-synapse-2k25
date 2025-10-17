/**
 * @fileOverview Zod schemas and TypeScript types for the course enrollment flow.
 * This file separates schema definitions from the 'use server' file to comply with Next.js rules.
 */

import { z } from 'genkit';

export const EnrollInCourseInputSchema = z.object({
  courseId: z.string().describe('The ID of the course to enroll in.'),
});
export type EnrollInCourseInput = z.infer<typeof EnrollInCourseInputSchema>;

export const EnrollInCourseOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type EnrollInCourseOutput = z.infer<typeof EnrollInCourseOutputSchema>;
