
"use client";

import Image from "next/image";
import { notFound } from "next/navigation";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, UserCircle, BookOpen, FileText, CheckCircle } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import type { Course, Enrollment, User } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from "react";

function TeacherProfile({ teacherId }: { teacherId: string }) {
  const firestore = useFirestore();
  
  // DEFENSIVE CHECK: Only create a reference if teacherId is valid.
  const teacherRef = useMemoFirebase(() => {
    if (!firestore || !teacherId) return null;
    return doc(firestore, 'users', teacherId);
  }, [firestore, teacherId]);

  const { data: teacher, isLoading } = useDoc<User>(teacherRef);

  if (isLoading) {
    return <span>Loading...</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <UserCircle className="h-5 w-5" />
      <span>{teacher?.name || 'N/A'}</span>
    </div>
  );
}

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const id = React.use(params).id;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isEnrolled, setIsEnrolled] = useState(false);


  const courseRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'courses', id);
  }, [firestore, id]);
  const { data: course, isLoading: isCourseLoading } = useDoc<Course>(courseRef);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !id) return null;
    return query(collection(firestore, `users/${user.uid}/enrollments`), where('courseId', '==', id));
  }, [firestore, id, user?.uid]);

  const { data: userEnrollment, isLoading: areEnrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  useEffect(() => {
    setIsEnrolled(userEnrollment != null && userEnrollment.length > 0);
  }, [userEnrollment]);


  const handleEnroll = async () => {
    if (!user || !firestore || !course) {
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: "You must be logged in to enroll in a course.",
      });
      return;
    }

    try {
      const enrollmentsCollection = collection(firestore, `users/${user.uid}/enrollments`);
      await addDoc(enrollmentsCollection, {
        id: uuidv4(),
        studentId: user.uid,
        courseId: course.id,
        enrollmentDate: serverTimestamp(),
      });
      
      const courseDocRef = doc(firestore, "courses", course.id);
      await updateDoc(courseDocRef, {
        studentCount: increment(1)
      });


      toast({
        title: "Enrollment Successful!",
        description: `You have enrolled in "${course.title}".`,
      });
      setIsEnrolled(true);

    } catch (error) {
      console.error("Enrollment error: ", error);
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: "An error occurred while trying to enroll you.",
      });
    }
  };

  const isLoading = isCourseLoading || areEnrollmentsLoading;

  if (isLoading) {
      return <div>Loading...</div>;
  }
  
  if (!course) {
    notFound();
  }
  
  const placeholder = PlaceHolderImages.find(p => p.id === course.imageId);
  
  return (
    <div className="bg-card">
      {/* Hero Section */}
      <section className="relative h-72 md:h-96 w-full">
        {placeholder && (
          <Image
            src={placeholder.imageUrl}
            alt={placeholder.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={placeholder.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="container relative z-10 h-full flex flex-col justify-end pb-12">
          <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary-foreground">{course.title}</h1>
          <div className="flex items-center gap-4 mt-4 text-primary-foreground/90">
            {/* RENDER GUARD: Only render when course data is ready */}
            {course.teacherId && <TeacherProfile teacherId={course.teacherId} />}
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{course.duration}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">About this course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{course.description}</p>
              </CardContent>
            </Card>

            <Separator className="my-8" />
            
            <div>
              <h2 className="font-headline text-2xl font-bold mb-4 flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                Course Content & Assignments
              </h2>
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <h3 className="text-lg font-semibold">Enroll to view assignments</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Once you enroll, all course materials and assignments will be available here.</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">
                  {isEnrolled ? "You are enrolled" : "Get Started"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEnrolled ? (
                  <div className="flex items-center gap-3 text-green-600">
                    <CheckCircle className="h-8 w-8" />
                    <p className="font-semibold">You have access to all course materials.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">Enroll now to get full access to the course content and assignments.</p>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" onClick={handleEnroll} disabled={!user}>Enroll in Course</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
