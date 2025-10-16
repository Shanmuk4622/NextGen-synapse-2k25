
"use client";

import Link from 'next/link';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import { PersonalizedLearning } from '@/components/dashboard/PersonalizedLearning';
import { getTeacherById, getAssignmentsByCourse, getCourseById } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useEffect, useState, useMemo } from 'react';
import type { User as AppUser, Course, Enrollment, Submission, Assignment } from '@/lib/types';
import { doc, getDoc, collection, query, where, documentId, collectionGroup } from 'firebase/firestore';

// NEW, DEDICATED COMPONENT FOR FETCHING AND DISPLAYING ENROLLED COURSES
function EnrolledCourses({ appUser }: { appUser: AppUser }) {
  const firestore = useFirestore();

  // Step 1: Get user's enrollments. This is safe because appUser is guaranteed to exist.
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `users/${appUser.id}/enrollments`));
  }, [firestore, appUser.id]);
  const { data: enrollments, isLoading: areEnrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  // Step 2: Get the course IDs from the enrollments.
  const enrolledCourseIds = useMemo(() => {
    if (!enrollments) return [];
    return enrollments.map(e => e.courseId);
  }, [enrollments]);

  // Step 3: Get the actual course documents. This is safe because we check for non-empty IDs.
  const coursesQuery = useMemoFirebase(() => {
    if (!firestore || enrolledCourseIds.length === 0) return null;
    return query(collection(firestore, 'courses'), where(documentId(), 'in', enrolledCourseIds));
  }, [firestore, enrolledCourseIds]);
  const { data: enrolledCourses, isLoading: areCoursesLoading } = useCollection<Course>(coursesQuery);

  const isLoading = areEnrollmentsLoading || (enrolledCourseIds.length > 0 && areCoursesLoading);

  if (isLoading) {
    return <div>Loading your courses...</div>;
  }
  
  if (!enrolledCourses || enrolledCourses.length === 0) {
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

  return (
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
  );
}


function RecentActivity({ appUser }: { appUser: AppUser }) {
  const firestore = useFirestore();

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `users/${appUser.id}/submissions`)
    );
  }, [firestore, appUser.id]);
  const { data: submissions, isLoading: areSubmissionsLoading } = useCollection<Submission>(submissionsQuery);

  const courseIds = useMemo(() => {
      if (!submissions) return [];
      // This gets unique courseIds from submissions
      return [...new Set(submissions.map(s => s.courseId))];
  }, [submissions]);

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore || courseIds.length === 0) return null;
    return query(collection(firestore, 'courses'), where(documentId(), 'in', courseIds));
  }, [firestore, courseIds]);
  const { data: courses, isLoading: areCoursesLoading } = useCollection<Course>(coursesQuery);
  
  const assignmentsQuery = useMemoFirebase(() => {
      if (!firestore || courseIds.length === 0) return null;
      return query(collectionGroup(firestore, 'assignments'), where('courseId', 'in', courseIds));
  }, [firestore, courseIds]);
  const { data: assignments, isLoading: areAssignmentsLoading } = useCollection<Assignment>(assignmentsQuery);

  const isLoading = areSubmissionsLoading || areCoursesLoading || areAssignmentsLoading;

  if (isLoading) {
    return <p>Loading recent activity...</p>;
  }

  if (!submissions || submissions.length === 0) {
    return <p>No recent activity to display.</p>;
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <ul className="space-y-4">
          {submissions.map(submission => {
            const assignment = assignments?.find(a => a.id === submission.assignmentId);
            const course = courses?.find(c => c.id === assignment?.courseId);

            if (!assignment || !course) return null;

            return (
              <li key={submission.id} className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <p className="font-medium">
                    {submission.grade ?
                      `Assignment "${assignment.title}" graded: ${submission.grade}%` :
                      `Assignment "${assignment.title}" submitted`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    In "{course.title}" on {new Date(submission.submissionDate).toLocaleDateString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAppUserLoading, setIsAppUserLoading] = useState(true);

  // PARENT COMPONENT'S ONLY JOB IS TO GET THE APP USER
  useEffect(() => {
    if (isAuthLoading || !user || !firestore) {
      if (!isAuthLoading) setIsAppUserLoading(false);
      return;
    }
    
    setIsAppUserLoading(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    getDoc(userDocRef)
      .then(docSnap => {
        if (docSnap.exists()) {
          setAppUser(docSnap.data() as AppUser);
        } else {
          setAppUser(null);
        }
      })
      .catch(() => setAppUser(null))
      .finally(() => setIsAppUserLoading(false));

  }, [user, isAuthLoading, firestore]);

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
            {/* RENDER THE NEW COMPONENT ONLY WHEN appUser IS READY */}
            {appUser && <EnrolledCourses appUser={appUser} />}
          </section>

          <section>
            <h2 className="font-headline text-2xl font-semibold mb-4">Recent Activity</h2>
            {appUser && <RecentActivity appUser={appUser} />}
          </section>
        </div>

        <div className="lg:col-span-1">
          <PersonalizedLearning />
        </div>
      </div>
    </div>
  );
}
