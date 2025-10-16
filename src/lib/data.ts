import type { User, Course, Enrollment, Assignment, Submission } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', role: 'student' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob@example.com', role: 'student' },
  { id: 'user-3', name: 'Dr. Carol Davis', email: 'carol@example.com', role: 'teacher' },
  { id: 'user-4', name: 'David Brown', email: 'david@example.com', role: 'student' },
  { id: 'user-5', name: 'Dr. Eve Miller', email: 'eve@example.com', role: 'teacher' },
];

export const courses: Course[] = [
  {
    id: 'course-1',
    title: 'Introduction to Web Development',
    description: 'Learn the fundamentals of HTML, CSS, and JavaScript to build modern websites. This course covers everything from basic syntax to responsive design.',
    duration: '10 weeks',
    teacherId: 'user-3',
    imageId: 'course-web-dev',
  },
  {
    id: 'course-2',
    title: 'Advanced React Patterns',
    description: 'Dive deep into React and learn advanced patterns for building scalable and maintainable applications. Topics include hooks, state management, and performance optimization.',
    duration: '8 weeks',
    teacherId: 'user-3',
    imageId: 'course-react',
  },
  {
    id: 'course-3',
    title: 'Data Science with Python',
    description: 'Explore the world of data science using Python. You will learn to work with libraries like Pandas, NumPy, and Scikit-learn to analyze and visualize data.',
    duration: '12 weeks',
    teacherId: 'user-5',
    imageId: 'course-data-science',
  },
  {
    id: 'course-4',
    title: 'UI/UX Design Principles',
    description: 'Master the principles of user interface and user experience design. This course focuses on creating intuitive, accessible, and beautiful digital products.',
    duration: '6 weeks',
    teacherId: 'user-5',
    imageId: 'course-ui-ux',
  },
];

export const enrollments: Enrollment[] = [
  { id: 'enroll-1', studentId: 'user-1', courseId: 'course-1', enrollmentDate: new Date('2023-09-01') },
  { id: 'enroll-2', studentId: 'user-1', courseId: 'course-3', enrollmentDate: new Date('2023-09-05') },
  { id: 'enroll-3', studentId: 'user-2', courseId: 'course-1', enrollmentDate: new Date('2023-09-02') },
  { id: 'enroll-4', studentId: 'user-4', courseId: 'course-4', enrollmentDate: new Date('2023-09-10') },
];

export const assignments: Assignment[] = [
  {
    id: 'assign-1',
    courseId: 'course-1',
    title: 'HTML & CSS Basics',
    description: 'Create a personal portfolio website using HTML and CSS.',
    dueDate: new Date('2023-09-20'),
  },
  {
    id: 'assign-2',
    courseId: 'course-1',
    title: 'JavaScript Fundamentals',
    description: 'Build a simple calculator application using JavaScript.',
    dueDate: new Date('2023-10-05'),
  },
  {
    id: 'assign-3',
    courseId: 'course-3',
    title: 'Data Analysis Project',
    description: 'Analyze the provided dataset and present your findings in a Jupyter notebook.',
    dueDate: new Date('2023-10-15'),
  },
];

export const submissions: Submission[] = [
  {
    id: 'sub-1',
    assignmentId: 'assign-1',
    studentId: 'user-1',
    submissionDate: new Date('2023-09-18'),
    content: 'https://example.com/alice-portfolio',
    grade: 92,
  },
  {
    id: 'sub-2',
    assignmentId: 'assign-1',
    studentId: 'user-2',
    submissionDate: new Date('2023-09-19'),
    content: 'https://example.com/bob-portfolio',
    grade: 88,
  },
  {
    id: 'sub-3',
    assignmentId: 'assign-3',
    studentId: 'user-1',
    submissionDate: new Date('2023-10-14'),
    content: 'https://example.com/alice-data-project',
    grade: 95,
  },
];

// Helper functions to query mock data
export const getTeacherById = (id: string) => users.find(u => u.id === id && u.role === 'teacher');
export const getStudentById = (id: string) => users.find(u => u.id === id && u.role === 'student');
export const getCourseById = (id: string) => courses.find(c => c.id === id);
export const getAssignmentsByCourse = (courseId: string) => assignments.filter(a => a.courseId === courseId);
export const getSubmissionsForAssignment = (assignmentId: string) => submissions.filter(s => s.assignmentId === assignmentId);
export const getEnrollmentsByStudent = (studentId: string) => enrollments.filter(e => e.studentId === studentId);
export const getEnrollmentsByCourse = (courseId: string) => enrollments.filter(e => e.courseId === courseId);
export const getStudentCourses = (studentId: string) => {
  const studentEnrollments = getEnrollmentsByStudent(studentId);
  return courses.filter(course => studentEnrollments.some(e => e.courseId === course.id));
};
