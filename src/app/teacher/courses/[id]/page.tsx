
"use client";

import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, Users, BookOpen, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import React, { useEffect, useState } from "react";
import type { User as AppUser, Course, Enrollment } from "@/lib/types";
import { doc, getDoc, collection, query, where, collectionGroup } from "firebase/firestore";

function StudentRow({ studentId, enrollmentDate }: { studentId: string; enrollmentDate: any }) {
    const firestore = useFirestore();

    // DEFENSIVE CHECK: Only create reference if studentId is valid
    const studentRef = useMemoFirebase(() => {
        if (!firestore || !studentId) return null;
        return doc(firestore, 'users', studentId);
    }, [firestore, studentId]);

    const { data: student, isLoading } = useDoc<AppUser>(studentRef);

    if (isLoading) {
        return (
            <TableRow>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-muted animate-pulse" />
                        <span className="h-4 bg-muted rounded w-24 animate-pulse"></span>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <span className="h-4 bg-muted rounded w-16 animate-pulse"></span>
                </TableCell>
            </TableRow>
        );
    }
    
    if (!student) {
        return null;
    }

    return (
        <TableRow>
            <TableCell className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{student.name}</span>
            </TableCell>
            <TableCell className="text-right text-muted-foreground text-sm">
                {enrollmentDate?.toDate().toLocaleDateString() || 'N/A'}
            </TableCell>
        </TableRow>
    );
}

function EnrolledStudents({ courseId }: { courseId: string }) {
  const firestore = useFirestore();

  // DEFENSIVE CHECK: Only create query if courseId is valid
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collectionGroup(firestore, 'enrollments'), where('courseId', '==', courseId));
  }, [firestore, courseId]);

  const { data: enrollments, isLoading: areEnrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  if (areEnrollmentsLoading) {
    return <p className="text-muted-foreground text-center py-4">Loading students...</p>;
  }

  if (!enrollments || enrollments.length === 0) {
     return <p className="text-muted-foreground text-center py-4">No students are enrolled in this course yet.</p>
  }

  return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead className="text-right">Enrolled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map(enrollment => (
             // RENDER GUARD: Only render if we have a valid enrollment and studentId
             enrollment && enrollment.studentId && <StudentRow key={enrollment.id} studentId={enrollment.studentId} enrollmentDate={enrollment.enrollmentDate} />
          ))}
        </TableBody>
      </Table>
  );
}


export default function TeacherCoursePage({ params }: { params: { id: string } }) {
  const id = React.use(params).id;
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'courses', id);
  }, [firestore, id]);
  const { data: course, isLoading: isCourseLoading } = useDoc<Course>(courseRef);
  
  const [isAppUserLoading, setIsAppUserLoading] = useState(true);
  useEffect(() => {
    if (isAuthLoading || !user || !firestore) {
      if (!isAuthLoading) setIsAppUserLoading(false);
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
    })
    .catch(() => setAppUser(null))
    .finally(() => setIsAppUserLoading(false));
  }, [user, isAuthLoading, firestore]);

  
  const isLoading = isAuthLoading || isAppUserLoading || isCourseLoading;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!course || !user || !appUser || (appUser.role === 'teacher' && course.teacherId !== user.uid)) {
    notFound();
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <p className="text-primary font-semibold">Manage Course</p>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">{course.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Assignments Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                 <BookOpen className="h-6 w-6 text-primary" />
                <CardTitle className="font-headline text-2xl">Assignments</CardTitle>
              </div>
               <Dialog>
                <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add Assignment</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                      This is a placeholder to show where the form to create a new assignment would go.
                    </DialogDescription>
                  </DialogHeader>
                  <p>Assignment creation form would be here.</p>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <h3 className="text-md font-semibold">No Assignments Created</h3>
                <p className="mt-2 text-sm text-muted-foreground">Click "Add Assignment" to get started.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Students Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex items-center flex-row gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Enrolled Students</CardTitle>
            </CardHeader>
            <CardContent>
                {/* RENDER GUARD: Only render when course is loaded */}
                {course && id && <EnrolledStudents courseId={id} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
