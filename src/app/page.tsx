
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/course/CourseCard';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { collection } from 'firebase/firestore';
import type { Course } from '@/lib/types';
import { useEffect } from 'react';

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-image');
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'courses');
  }, [firestore]);

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 lg:py-40 bg-card">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-primary/80"></div>
        <div className="container relative z-10 mx-auto flex flex-col items-center justify-center text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Unlock Your Potential with Course Central
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-primary-foreground/90 md:text-xl">
            Your journey to knowledge begins here. Explore expert-led courses and achieve your learning goals.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="#courses">
                Explore Courses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-accent text-accent hover:bg-accent/10">
              <Link href="/register">Become a Member</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="w-full py-16 md:py-24 lg:py-32">
        <div className="container mx-auto">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
              Featured Courses
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
              Hand-picked courses designed to help you master new skills and advance your career.
            </p>
          </div>
          {isLoading && <p>Loading courses...</p>}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses && courses.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
