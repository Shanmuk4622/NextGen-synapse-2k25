
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, BookOpen } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { useEffect, useState } from "react";
import type { User as AppUser, Course } from "@/lib/types";
import { doc, getDoc, collection, query, where } from "firebase/firestore";

export default function TeacherDashboardPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAppUserLoading, setIsAppUserLoading] = useState(true);

  // Step 1: Get the App User object
  useEffect(() => {
    if (isAuthLoading || !user || !firestore) {
      if (!isAuthLoading) {
        setIsAppUserLoading(false);
      }
      return;
    };
    
    setIsAppUserLoading(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    getDoc(userDocRef).then(docSnap => {
      if (docSnap.exists()) {
        setAppUser(docSnap.data() as AppUser);
      } else {
        setAppUser(null);
      }
      setIsAppUserLoading(false);
    }).catch(() => setIsAppUserLoading(false));
  }, [user, isAuthLoading, firestore]);
  
  // Step 2: Get the courses for the current teacher. This query depends on having a valid user.
  const teacherCoursesQuery = useMemoFirebase(() => {
    // Only build the query if we have a firestore instance and a user ID.
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'courses'), where('teacherId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: teacherCourses, isLoading: areCoursesLoading } = useCollection<Course>(teacherCoursesQuery);

  // Master loading state: true until all user data and course data is loaded.
  const isLoading = isAuthLoading || isAppUserLoading || areCoursesLoading;
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !appUser || appUser.role !== 'teacher') {
    return (
        <div className="container text-center py-12">
            <h2 className="font-headline text-2xl">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You must be logged in as a teacher to view this page.</p>
            <Button asChild className="mt-4">
                <Link href="/login">Log In</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage your courses and students.</p>
        </div>
        <Button asChild>
          <Link href="/teacher/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Course
          </Link>
        </Button>
      </div>

      <section>
        <h2 className="font-headline text-2xl font-semibold mb-4">My Courses</h2>
        {teacherCourses && teacherCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teacherCourses.map(course => {
              const studentCount = course.studentCount || 0;
              return (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
                    <CardDescription>{course.duration}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{studentCount} student{studentCount !== 1 && 's'} enrolled</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/teacher/courses/${course.id}`}>Manage Course</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">You haven't created any courses</h3>
            <p className="mt-2 text-sm text-muted-foreground">Get started by creating your first course.</p>
            <Button asChild className="mt-4">
              <Link href="/teacher/courses/new">Create a Course</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
