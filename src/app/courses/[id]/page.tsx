"use client";

import Image from "next/image";
import { notFound } from "next/navigation";
import { getCourseById, getTeacherById, getAssignmentsByCourse, enrollments } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, UserCircle, BookOpen, FileText, CheckCircle } from "lucide-react";
import { useUser } from "@/firebase";

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const course = getCourseById(params.id);

  if (!course) {
    notFound();
  }

  const teacher = getTeacherById(course.teacherId);
  const placeholder = PlaceHolderImages.find(p => p.id === course.imageId);
  const assignments = getAssignmentsByCourse(course.id);
  const isEnrolled = user ? enrollments.some(e => e.courseId === course.id && e.studentId === user.uid) : false;

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
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              <span>{teacher?.name}</span>
            </div>
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
              {isEnrolled ? (
                 <div className="space-y-4">
                  {assignments.map(assignment => (
                    <Card key={assignment.id} className="hover:bg-background/80 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-start gap-4">
                           <FileText className="h-5 w-5 mt-1 text-primary" />
                          <div>
                            <h3 className="font-semibold">{assignment.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
                             <p className="text-xs text-muted-foreground mt-1">Due: {assignment.dueDate.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={Math.random() > 0.5 ? "default" : "secondary"}>{Math.random() > 0.5 ? "Submitted" : "Not Submitted"}</Badge>
                          <Button size="sm" variant="outline">View</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                 </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <h3 className="text-lg font-semibold">Enroll to view assignments</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Once you enroll, all course materials and assignments will be available here.</p>
                </div>
              )}
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
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg">Enroll in Course</Button>
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
