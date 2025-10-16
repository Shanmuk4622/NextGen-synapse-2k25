
import type { User, Course } from './types';

// This file provides mock data for local development.
// In a real application, this data would come from Firestore.

export const users: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', role: 'student' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob@example.com', role: 'student' },
  { id: 'user-3', name: 'Dr. Carol Davis', email: 'carol@example.com', role: 'teacher' },
  { id: 'user-4', name: 'David Brown', email: 'david@example.com', role: 'student' },
  { id: 'user-5', name: 'Dr. Eve Miller', email: 'eve@example.com', role: 'teacher' },
];

export const getTeacherById = (id: string) => users.find(u => u.id === id && u.role === 'teacher');
export const getStudentById = (id: string) => users.find(u => u.id === id && u.role === 'student');

// Fallback assignments and submissions data for components that might still reference them.
// This will be removed in subsequent steps as we clean up the UI.
export const assignments: any[] = [];
export const submissions: any[] = [];
export const getAssignmentsByCourse = (courseId: string) => [];
export const getSubmissionsForAssignment = (assignmentId: string) => [];
