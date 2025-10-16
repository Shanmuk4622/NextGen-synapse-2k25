
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, BookOpen } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { useEffect, useState, useMemo } from "react";
import type { User as AppUser, Course, Enrollment } from "@/lib/types";
import { doc, getDoc, collection, query, where } from "firebase/firestore";

export default function TeacherDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  
  const teacherCoursesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'courses'), where('teacherId', '==', user.uid));
  }, [firestore, user]);

  const { data: teacherCourses, isLoading: coursesLoading } = useCollection<Course>(teacherCoursesQuery);

  const courseIds = useMemo(() => {
    if (!teacherCourses) return [];
    return teacherCourses.map(c => c.id);
  }, [teacherCourses]);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !courseIds || courseIds.length === 0) return null;
    // This query is now correctly structured to fetch enrollments only for the teacher's courses.
    return query(collection(firestore, 'enrollments'), where('courseId', 'in', courseIds));
  }, [firestore, courseIds]);

  const { data: allEnrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

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
  
  if (isUserLoading || (user && !appUser)) {
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
        {(coursesLoading || enrollmentsLoading) && <p>Loading courses...</p>}
        {teacherCourses && teacherCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teacherCourses.map(course => {
              const enrollments = allEnrollments?.filter(e => e.courseId === course.id) || [];
              return (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
                    <CardDescription>{course.duration}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{enrollments.length} student{enrollments.length !== 1 && 's'} enrolled</span>
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
          !(coursesLoading || enrollmentsLoading) && <div className="text-center py-12 border-2 border-dashed rounded-lg">
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
