"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wand2, Loader2, Lightbulb, Book, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { personalizedLearningPath, PersonalizedLearningPathOutput, PersonalizedLearningPathInput } from '@/ai/flows/personalized-learning-path';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import type { User as AppUser, Course } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

const learningPathSchema = z.object({
  learningGoals: z.string().min(10, { message: 'Please describe your learning goals in at least 10 characters.' }),
});

export function PersonalizedLearning({ appUser }: { appUser: AppUser }) {
  const [result, setResult] = useState<PersonalizedLearningPathOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const enrolledCoursesQuery = useMemoFirebase(() => {
    if (!firestore || !appUser?.id) return null;
    return query(collection(firestore, 'courses'), where('enrolledStudentIds', 'array-contains', appUser.id));
  }, [firestore, appUser?.id]);

  const { data: enrolledCourses } = useCollection<Course>(enrolledCoursesQuery);

  const form = useForm<z.infer<typeof learningPathSchema>>({
    resolver: zodResolver(learningPathSchema),
    defaultValues: {
      learningGoals: '',
    },
  });

  async function onSubmit(values: z.infer<typeof learningPathSchema>) {
    setIsLoading(true);
    setResult(null);

    if (!appUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
        setIsLoading(false);
        return;
    }

    try {
      const input: PersonalizedLearningPathInput = {
        studentId: appUser.id,
        currentCourses: enrolledCourses?.map(c => c.title) || [],
        learningGoals: values.learningGoals,
        // These are example values. In a real app, you'd fetch this data.
        performanceData: enrolledCourses?.reduce((acc, course) => {
            acc[course.title] = 'Not tracked';
            return acc;
        }, {} as Record<string, any>) || {},
        knowledgeAssessment: 'User has expressed interest in the specified learning goals.',
        currentTrends: 'Growing demand for AI-powered applications and full-stack developers.',
      };

      const response = await personalizedLearningPath(input);
      setResult(response);
    } catch (error) {
      console.error('Error generating learning path:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate your personalized learning path. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Wand2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">AI-Powered Learning Path</CardTitle>
        </div>
        <CardDescription>
          Tell us your goals, and our AI will generate a personalized learning path just for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="learningGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">What do you want to learn?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'I want to become a full-stack developer' or 'I want to improve my data analysis skills.'"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate My Path
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      {result && (
        <CardFooter className="flex flex-col items-start gap-4 pt-6 border-t">
          <h3 className="font-headline text-xl font-semibold">Your Personalized Recommendations</h3>
          <Accordion type="single" collapsible className="w-full" defaultValue="explanation">
            <AccordionItem value="explanation">
              <AccordionTrigger className='font-semibold text-left'>
                <div className='flex items-center gap-2'>
                  <Lightbulb className="w-5 h-5 text-accent-foreground fill-accent" />
                  Recommendation Rationale
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{result.explanation}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="courses">
              <AccordionTrigger className='font-semibold text-left'>
                <div className='flex items-center gap-2'>
                  <GraduationCap className="w-5 h-5 text-primary" />
                   Recommended Courses
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2">
                  {result.recommendedCourses.map((course) => (
                    <li key={course}>{course}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="resources">
              <AccordionTrigger className='font-semibold text-left'>
                <div className='flex items-center gap-2'>
                  <Book className="w-5 h-5 text-secondary-foreground" />
                  Suggested Resources
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2">
                  {result.suggestedResources.map((resource) => (
                    <li key={resource}><a href={resource} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{resource}</a></li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardFooter>
      )}
    </Card>
  );
}
