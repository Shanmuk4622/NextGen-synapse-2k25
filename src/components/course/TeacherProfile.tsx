
'use client';

import { UserCircle } from "lucide-react";

export function TeacherProfile({ teacherName }: { teacherName: string }) {
  return (
    <div className="flex items-center gap-2">
      <UserCircle className="h-4 w-4" />
      <span>{teacherName || 'N/A'}</span>
    </div>
  );
}
