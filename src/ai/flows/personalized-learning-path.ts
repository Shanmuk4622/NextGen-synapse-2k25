'use server';

/**
 * @fileOverview AI flow for providing personalized course recommendations and learning resources.
 *
 * - personalizedLearningPath - A function that generates personalized learning resources.
 * - PersonalizedLearningPathInput - The input type for the personalizedLearningPath function.
 * - PersonalizedLearningPathOutput - The return type for the personalizedLearningPath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedLearningPathInputSchema = z.object({
  studentId: z.string().describe('The unique identifier for the student.'),
  currentCourses: z.array(z.string()).describe('List of course IDs the student is currently enrolled in.'),
  learningGoals: z.string().describe('The learning goals of the student.'),
  performanceData: z.record(z.any()).describe('A JSON object containing the student performance data, including grades, assignment scores, etc.'),
  knowledgeAssessment: z.string().describe('A string containing the student knowledge assessment results.'),
  currentTrends: z.string().optional().describe('Current trends that may influence learning path, optional.'),
});
export type PersonalizedLearningPathInput = z.infer<typeof PersonalizedLearningPathInputSchema>;

const PersonalizedLearningPathOutputSchema = z.object({
  recommendedCourses: z.array(z.string()).describe('A list of recommended course IDs for the student.'),
  suggestedResources: z.array(z.string()).describe('A list of suggested learning resources (URLs, documents, etc.).'),
  explanation: z.string().describe('Explanation of why the courses and resources are recommended.'),
});
export type PersonalizedLearningPathOutput = z.infer<typeof PersonalizedLearningPathOutputSchema>;

export async function personalizedLearningPath(input: PersonalizedLearningPathInput): Promise<PersonalizedLearningPathOutput> {
  return personalizedLearningPathFlow(input);
}

const personalizedLearningPathPrompt = ai.definePrompt({
  name: 'personalizedLearningPathPrompt',
  input: {schema: PersonalizedLearningPathInputSchema},
  output: {schema: PersonalizedLearningPathOutputSchema},
  prompt: `You are an AI learning path generator. You will take into account the student's learning goals, current performance, knowledge assessment, and current trends to suggest courses and resources that will help the student improve their learning outcomes.

Student ID: {{{studentId}}}
Current Courses: {{#each currentCourses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Learning Goals: {{{learningGoals}}}
Performance Data: {{{performanceData}}}
Knowledge Assessment: {{{knowledgeAssessment}}}
Current Trends: {{{currentTrends}}}

Based on this information, recommend courses and resources that the student should focus on to improve their understanding and achieve their learning goals. Explain why you are recommending these courses and resources.

Output courses as an array of course IDs, and resources as an array of URLs or document names. Return explanation as a string.

Make sure to return a valid JSON object:
{
  "recommendedCourses": ["course1", "course2"],
  "suggestedResources": ["resource1", "resource2"],
  "explanation": "Explanation of recommendations"
}
`,
});

const personalizedLearningPathFlow = ai.defineFlow(
  {
    name: 'personalizedLearningPathFlow',
    inputSchema: PersonalizedLearningPathInputSchema,
    outputSchema: PersonalizedLearningPathOutputSchema,
  },
  async input => {
    const {output} = await personalizedLearningPathPrompt(input);
    return output!;
  }
);
