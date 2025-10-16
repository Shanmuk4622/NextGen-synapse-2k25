
"use client";

import { notFound } from "next/navigation";
import { getStudentById, getAssignmentsByCourse, getSubmissionsForAssignment } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, Users, BookOpen, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { useEffect, useState } from "react";
import type { User as AppUser, Course, Enrollment } from "@/lib/types";
import { doc, getDoc, collection, query, where } from "firebase/firestore";
import Link from "next/link";


export default function TeacherCoursePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );

  const courseRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'courses', id);
  }, [firestore, id]);
  const { data: course, isLoading: isCourseLoading } = useDoc<Course>(courseRef);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'enrollments'), where('courseId', '==', id));
  }, [firestore, id]);
  
  const { data: enrollments, isLoading: areEnrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

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

  if (isUserLoading || (user && !appUser) || isCourseLoading || areEnrollmentsLoading) {
    return <div>Loading...</div>;
  }

  if (!course || !appUser || (appUser.role === 'teacher' && course.teacherId !== user?.uid)) {
    notFound();
  }

  const students = (enrollments || []).map(e => getStudentById(e.studentId)).filter(Boolean);
  const assignments = getAssignmentsByCourse(course.id);

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
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map(assignment => {
                    const submissions = getSubmissionsForAssignment(assignment.id);
                    return (
                      <Card key={assignment.id} className="hover:bg-background/80 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-start gap-4">
                            <FileText className="h-5 w-5 mt-1 text-primary" />
                            <div>
                              <h3 className="font-semibold">{assignment.title}</h3>
                              <p className="text-xs text-muted-foreground">Due: {assignment.dueDate.toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{submissions.length}</p>
                            <p className="text-sm text-muted-foreground">Submissions</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                 <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <h3 className="text-md font-semibold">No Assignments Created</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Click "Add Assignment" to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Students Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex items-center flex-row gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Enrolled Students</CardTitle>
              <Badge className="ml-auto">{students.length}</Badge>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-right">Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => {
                      const enrollment = enrollments?.find(e => e.studentId === student!.id);
                      return(
                        <TableRow key={student!.id}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{student!.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student!.name}</span>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {enrollment?.enrollmentDate.toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No students are enrolled in this course yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
