
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
};

export type Course = {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g., "8 weeks"
  teacherId: string;
  teacherName: string;
  imageId: string;
  enrolledStudentIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: Date;
};
