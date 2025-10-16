"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const courseFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  duration: z.string().min(3, { message: "Please enter a course duration (e.g., '8 weeks')." }),
});

export default function CreateCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof courseFormSchema>>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: "",
    },
  });

  async function onSubmit(values: z.infer<typeof courseFormSchema>) {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a course.",
      });
      return;
    }

    const courseId = uuidv4();
    const coursesCollectionRef = collection(firestore, "courses");
    const placeholderImages = PlaceHolderImages.filter(p => p.id.startsWith("course-"));
    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    
    const newCourse = {
      id: courseId,
      ...values,
      teacherId: user.uid,
      imageId: randomImage.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // We are not awaiting this, so the UI can update immediately
    addDocumentNonBlocking(collection(firestore, 'courses'), newCourse);

    toast({
      title: "Course Created!",
      description: `The course "${values.title}" has been successfully created.`,
    });
    router.push("/teacher/dashboard");
  }

  return (
    <div className="container py-8 md:py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-3">
            <PlusCircle className="w-7 h-7 text-primary" />
            Create a New Course
          </CardTitle>
          <CardDescription>Fill out the details below to add a new course to the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Python" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Course Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed description of your course..."
                        className="resize-y"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Course Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 8 weeks, 12 hours" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
