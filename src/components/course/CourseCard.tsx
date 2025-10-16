
import Image from "next/image";
import Link from "next/link";
import type { Course, User } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Clock, UserCircle } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useEffect } from "react";

type CourseCardProps = {
  course: Course;
};

function TeacherProfile({ teacherId }: { teacherId: string }) {
  const firestore = useFirestore();
  
  const teacherRef = useMemoFirebase(() => {
    if (!firestore || !teacherId) return null;
    return doc(firestore, 'users', teacherId);
  }, [firestore, teacherId]);

  const { data: teacher, isLoading, refetch } = useDoc<User>(teacherRef);

  useEffect(() => {
    if(teacherRef) {
      refetch();
    }
  }, [teacherRef, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-16 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <UserCircle className="h-4 w-4" />
      <span>{teacher?.name || 'N/A'}</span>
    </div>
  );
}

export function CourseCard({ course }: CourseCardProps) {
  const placeholder = PlaceHolderImages.find(p => p.id === course.imageId);

  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <Card className="h-full flex flex-col transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            {placeholder && (
              <Image
                src={placeholder.imageUrl}
                alt={placeholder.description}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={placeholder.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <CardTitle className="absolute bottom-0 p-4">
              <h3 className="font-headline text-2xl text-primary-foreground">{course.title}</h3>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <p className="text-muted-foreground text-sm line-clamp-3">{course.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4 pt-0 text-sm text-muted-foreground">
          {course.teacherId && <TeacherProfile teacherId={course.teacherId} />}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{course.duration}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
