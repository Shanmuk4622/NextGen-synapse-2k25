
'use client';

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User } from "@/lib/types";
import { UserCircle } from "lucide-react";

export function TeacherProfile({ teacherId }: { teacherId: string }) {
    const firestore = useFirestore();
    
    const teacherRef = useMemoFirebase(() => {
      if (!firestore || !teacherId) return null;
      return doc(firestore, 'users', teacherId);
    }, [firestore, teacherId]);
  
    const { data: teacher, isLoading } = useDoc<User>(teacherRef);
  
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
  