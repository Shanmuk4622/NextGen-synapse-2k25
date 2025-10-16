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
  createdAt?: Date;
  updatedAt?: Date;
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: Date;
};

export type Assignment = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
};

export type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionDate: Date;
  content: string; // Could be a URL to a file or text content
  grade: number | null; // e.g., 85
};
