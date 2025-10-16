
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
  imageId: string;
  studentCount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: Date;
};
