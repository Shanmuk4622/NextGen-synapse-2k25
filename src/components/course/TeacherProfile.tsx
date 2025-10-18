
'use client';

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { User } from "@/lib/types";
import { doc } from "firebase/firestore";
import { UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function TeacherProfile({ teacherId }: { teacherId: string }) {
    const firestore = useFirestore();
    
    const teacherRef = useMemoFirebase(() => {
        if (!firestore || !teacherId) return null;
        return doc(firestore, 'users', teacherId);
    }, [firestore, teacherId]);

    const { data: teacher, isLoading } = useDoc<User>(teacherRef);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 animate-pulse">
                <div className="h-4 w-4 rounded-full bg-muted-foreground/50"></div>
                <div className="h-4 w-20 rounded-md bg-muted-foreground/50"></div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span>N/A</span>
            </div>
        );
    }
  
    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
                <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{teacher.name}</span>
        </div>
  );
}
