
import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Clock } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherProfile } from "./TeacherProfile";

type CourseCardProps = {
  course: Course;
};

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
          <TeacherProfile teacherId={course.teacherId} />
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{course.duration}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
