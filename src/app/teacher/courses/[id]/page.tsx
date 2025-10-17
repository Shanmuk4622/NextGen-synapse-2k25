
"use client";

import { notFound, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, Users, BookOpen, FileText } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import React, { useState } from "react";
import type { User as AppUser, Course, Assignment } from "@/lib/types";
import { doc, collection, query } from "firebase/firestore";
import { CreateAssignmentForm } from "@/components/course/CreateAssignmentForm";

function StudentRow({ studentId }: { studentId: string }) {
    const firestore = useFirestore();

    const studentRef = useMemoFirebase(() => {
        if (!firestore || !studentId) return null;
        return doc(firestore, 'users', studentId);
    }, [firestore, studentId]);

    const { data: student, isLoading } = useDoc<AppUser>(studentRef);

    if (isLoading || !student) {
        return (
            <TableRow>
                <TableCell colSpan={2}>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                        <span className="h-4 bg-muted rounded w-24 animate-pulse"></span>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <span className="h-4 bg-muted rounded w-16 animate-pulse block"></span>
                </TableCell>
            </TableRow>
        );
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
                Enrolled
            </TableCell>
        </TableRow>
    );
}

function EnrolledStudents({ studentIds }: { studentIds: string[] }) {
  if (!studentIds || studentIds.length === 0) {
     return <p className="text-muted-foreground text-center py-4">No students are enrolled in this course yet.</p>
  }

  return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentIds.map(studentId => (
             <StudentRow key={studentId} studentId={studentId} />
          ))}
        </TableBody>
      </Table>
  );
}

function AssignmentList({ courseId }: { courseId: string }) {
  const firestore = useFirestore();

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, `courses/${courseId}/assignments`));
  }, [firestore, courseId]);

  const { data: assignments, isLoading } = useCollection<Assignment>(assignmentsQuery);

  if (isLoading) {
    return <p>Loading assignments...</p>
  }
  
  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <h3 className="text-md font-semibold">No Assignments Created</h3>
        <p className="mt-2 text-sm text-muted-foreground">Click "Add Assignment" to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map(assignment => (
        <Card key={assignment.id} className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            <CardDescription>
              Due: {format(new Date(assignment.dueDate), "PPP")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{assignment.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


export default function TeacherCoursePage() {
  const { id } = useParams<{ id: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, isAuthLoading } = useUser();
  const firestore = useFirestore();

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'courses', id);
  }, [firestore, id]);
  const { data: course, isLoading: isCourseLoading } = useDoc<Course>(courseRef);
  
  const appUserRef = useMemoFirebase(() => {
      if(!firestore || !user?.uid) return null;
      return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid])
  const { data: appUser, isLoading: isAppUserLoading } = useDoc<AppUser>(appUserRef);
  
  const isLoading = isAuthLoading || isAppUserLoading || isCourseLoading;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!course || !user || !appUser || appUser.role !== 'teacher' || course.teacherId !== user.uid) {
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
               <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add Assignment</Button></DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Create New Assignment</DialogTitle>
                    <DialogDescription>
                      Fill out the form below to add a new assignment to this course.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateAssignmentForm courseId={course.id} onSuccess={() => setIsDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <AssignmentList courseId={course.id} />
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
                <EnrolledStudents studentIds={course.enrolledStudentIds || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
