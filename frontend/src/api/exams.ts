import { apiFetch } from './client'

export interface Exam {
  id: number
  subject_id: number | null
  subject_name: string
  department: string
  exam_date: string
  start_time: string
  duration_minutes: number
  status: string
  room_id: number | null
  room_name: string
  group_id: number | null
  group_name: string
  supervisor_ids: number[]
}

export interface ConflictItem {
  type: string
  message: string
  exam_a_id: number
  exam_b_id: number
  exam_date: string
  start_time: string
  resource: string
}

export interface PlanningResponse {
  exams: Exam[]
  conflicts: ConflictItem[]
}

export function getExams(params?: { search?: string; status?: string; department?: string; group_name?: string }) {
  const q = new URLSearchParams()
  if (params?.search) q.set('search', params.search)
  if (params?.status && params.status !== 'Tous les statuts') q.set('status', params.status)
  if (params?.department && params.department !== 'Tous les départements') q.set('department', params.department)
  if (params?.group_name) q.set('group_name', params.group_name)
  const qs = q.toString()
  return apiFetch<Exam[]>(`/exams${qs ? `?${qs}` : ''}`)
}

export function createExam(payload: Partial<Exam>) {
  return apiFetch<Exam>('/exams', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateExam(id: number, payload: Partial<Exam>) {
  return apiFetch<Exam>(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteExam(id: number) {
  return apiFetch<void>(`/exams/${id}`, { method: 'DELETE' })
}

export function getPlanning() {
  return apiFetch<PlanningResponse>('/exams/planning')
}
