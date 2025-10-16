
"use client";

import Link from 'next/link';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import { PersonalizedLearning } from '@/components/dashboard/PersonalizedLearning';
import { getTeacherById } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useEffect, useState, useMemo } from 'react';
import type { User as AppUser, Course, Enrollment } from '@/lib/types';
import { doc, getDoc, collection, query, where, documentId } from 'firebase/firestore';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );

  useEffect(() => {
    if (userDocRef) {
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setAppUser(docSnap.data() as AppUser);
        }
      });
    } else {
      setAppUser(null);
    }
  }, [userDocRef]);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, `users/${user.uid}/enrollments`));
  }, [firestore, user?.uid]);

  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  const enrolledCourseIds = useMemo(() => {
    if (!enrollments) return null; // Distinguish between loading and empty
    if (enrollments.length === 0) return [];
    return enrollments.map(e => e.courseId);
  }, [enrollments]);

  const coursesQuery = useMemoFirebase(() => {
    // Important: Do not run this query if the enrolledCourseIds array is null (loading) or empty.
    if (!firestore || enrolledCourseIds === null || enrolledCourseIds.length === 0) {
      return null;
    }
    return query(collection(firestore, 'courses'), where(documentId(), 'in', enrolledCourseIds));
  }, [firestore, enrolledCourseIds]);

  const { data: enrolledCourses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const isLoading = isUserLoading || (user && !appUser) || enrollmentsLoading || (enrolledCourseIds && enrolledCourseIds.length > 0 && coursesLoading);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !appUser) {
    return (
      <div className="container text-center py-12">
        <h2 className="font-headline text-2xl">Please log in</h2>
        <p className="text-muted-foreground mt-2">You need to be logged in to view your dashboard.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Welcome back, {appUser.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground mt-2 text-lg">Let's continue your learning journey.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="font-headline text-2xl font-semibold mb-4">My Courses</h2>
            {enrolledCourses && enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolledCourses.map(course => {
                  const teacher = getTeacherById(course.teacherId);
                  const progress = Math.floor(Math.random() * 81) + 20; // Mock progress
                  return (
                    <Card key={course.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
                        <CardDescription>by {teacher?.name}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Your progress:</p>
                          <Progress value={progress} aria-label={`${progress}% complete`} />
                          <p className="text-xs text-right text-muted-foreground">{progress}%</p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                          <Link href={`/courses/${course.id}`}>Continue Learning</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Courses Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">You are not enrolled in any courses.</p>
                <Button asChild className="mt-4">
                  <Link href="/#courses">Explore Courses</Link>
                </Button>
              </div>
            )}
          </section>

          <section>
            <h2 className="font-headline text-2xl font-semibold mb-4">Recent Activity</h2>
             <Card>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                    <div>
                      <p className="font-medium">Assignment "HTML & CSS Basics" graded: 92%</p>
                      <p className="text-sm text-muted-foreground">In "Introduction to Web Development"</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <Clock className="h-5 w-5 text-yellow-500 mt-1" />
                    <div>
                      <p className="font-medium">New assignment "JavaScript Fundamentals" posted</p>
                       <p className="text-sm text-muted-foreground">Due in 5 days in "Introduction to Web Development"</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="lg:col-span-1">
          <PersonalizedLearning />
        </div>
      </div>
    </div>
  );
}
