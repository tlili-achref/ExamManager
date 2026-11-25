import { apiFetch } from './client'

export interface Group {
  id: number
  code: string
  name: string
  student_count: number
  academic_year: string
  status: string
}

export interface Teacher {
  id: number
  auth_user_id: number | null
  full_name: string
  email: string
  department: string
}

export interface Student {
  id: number
  auth_user_id: number | null
  matricule: string
  full_name: string
  email: string
  group_id: number | null
}

export interface Subject {
  id: number
  code: string
  name: string
  teacher_id: number | null
  teacher_name: string
  level: string
  credits: number
}

export interface SupervisorAssignment {
  id: number
  exam_id: number
  teacher_id: number
  teacher_name: string
}

export const getGroups = () => apiFetch<Group[]>('/users/groups')
export const getTeachers = () => apiFetch<Teacher[]>('/users/teachers')
export const getStudents = (authUserId?: number) =>
  apiFetch<Student[]>(`/users/students${authUserId ? `?auth_user_id=${authUserId}` : ''}`)
export const getSubjects = () => apiFetch<Subject[]>('/users/subjects')
export const getSupervisors = (examId?: number) =>
  apiFetch<SupervisorAssignment[]>(`/users/supervisors${examId ? `?exam_id=${examId}` : ''}`)
export const assignSupervisor = (exam_id: number, teacher_id: number) =>
  apiFetch<SupervisorAssignment>('/users/supervisors', {
    method: 'POST',
    body: JSON.stringify({ exam_id, teacher_id }),
  })
export const removeSupervisor = (id: number) =>
  apiFetch<void>(`/users/supervisors/${id}`, { method: 'DELETE' })
