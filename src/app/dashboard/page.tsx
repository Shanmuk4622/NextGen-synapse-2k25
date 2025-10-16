
"use client";

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { PersonalizedLearning } from '@/components/dashboard/PersonalizedLearning';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { useMemo, useState, useEffect } from 'react';
import type { User as AppUser, Course, Enrollment } from '@/lib/types';
import { doc, collection, query, where, documentId } from 'firebase/firestore';

function EnrolledCourseCard({ course }: { course: Course }) {
  const firestore = useFirestore();

  const teacherRef = useMemoFirebase(() => {
    if (!firestore || !course?.teacherId) return null;
    return doc(firestore, 'users', course.teacherId);
  }, [firestore, course?.teacherId]);

  const { data: teacher, isLoading: isTeacherLoading } = useDoc<AppUser>(teacherRef);
  
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setProgress(Math.floor(Math.random() * 81) + 20); // Mock progress
  }, []);

  if (isTeacherLoading || !course) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-2"></div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
        </CardContent>
        <CardFooter>
          <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
        </CardFooter>
      </Card>
    );
  }
  
  return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
          <CardDescription>by {teacher?.name || '...'}</CardDescription>
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
}

function EnrolledCoursesList({ enrollments }: { enrollments: Enrollment[] }) {
  const firestore = useFirestore();
  const courseIds = useMemo(() => enrollments.map(e => e.courseId), [enrollments]);

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore || courseIds.length === 0) return null;
    return query(collection(firestore, 'courses'), where(documentId(), 'in', courseIds.slice(0, 30)));
  }, [firestore, courseIds]);

  const { data: courses, isLoading: areCoursesLoading } = useCollection<Course>(coursesQuery);

  if (areCoursesLoading) {
    return <div>Loading course details...</div>
  }
  
  if (!courses || courses.length === 0) {
    return <div>You are enrolled in courses that could not be found.</div>
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map(course => (
          <EnrolledCourseCard key={course.id} course={course} />
        ))}
      </div>
  );
}

function StudentDashboard({ appUser }: { appUser: AppUser }) {
  const firestore = useFirestore();

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !appUser?.id) return null;
    return collection(firestore, `users/${appUser.id}/enrollments`);
  }, [firestore, appUser.id]);

  const { data: enrollments, isLoading: areEnrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  if (areEnrollmentsLoading) {
    return <div>Loading your courses...</div>;
  }
  
  if (!enrollments || enrollments.length === 0) {
     return (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Courses Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">You are not enrolled in any courses.</p>
            <Button asChild className="mt-4">
                <Link href="/#courses">Explore Courses</Link>
            </Button>
        </div>
     );
  }

  return <EnrolledCoursesList enrollments={enrollments} />;
}


export default function DashboardPage() {
  const { user, isAuthLoading } = useUser();
  const firestore = useFirestore();

  const appUserRef = useMemoFirebase(() => {
    if(!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: appUser, isLoading: isAppUserLoading } = useDoc<AppUser>(appUserRef);
  
  const isLoading = isAuthLoading || isAppUserLoading;
  
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
            <StudentDashboard appUser={appUser} />
          </section>

          <section>
            <h2 className="font-headline text-2xl font-semibold mb-4">Recent Activity</h2>
             <Card>
              <CardContent className="pt-6">
                 <p className="text-sm text-muted-foreground">No recent activity to display.</p>
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
