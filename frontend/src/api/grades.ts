import { apiFetch } from './client'

export interface Grade {
  id: number
  exam_id: number
  subject_name: string
  student_id: number
  student_matricule: string
  student_name: string
  score: number
  published: boolean
}

export interface GradeStats {
  count: number
  average: number
  highest: number
  pass_rate: number
}

export function getGrades(params?: { exam_id?: number; student_id?: number; published_only?: boolean }) {
  const q = new URLSearchParams()
  if (params?.exam_id) q.set('exam_id', String(params.exam_id))
  if (params?.student_id) q.set('student_id', String(params.student_id))
  if (params?.published_only) q.set('published_only', 'true')
  const qs = q.toString()
  return apiFetch<Grade[]>(`/grades${qs ? `?${qs}` : ''}`)
}

export function getGradeStats(params?: { exam_id?: number; student_id?: number; published_only?: boolean }) {
  const q = new URLSearchParams()
  if (params?.exam_id) q.set('exam_id', String(params.exam_id))
  if (params?.student_id) q.set('student_id', String(params.student_id))
  if (params?.published_only) q.set('published_only', 'true')
  const qs = q.toString()
  return apiFetch<GradeStats>(`/grades/stats${qs ? `?${qs}` : ''}`)
}

export function updateGradeScore(id: number, score: number) {
  return apiFetch<Grade>(`/grades/${id}`, { method: 'PUT', body: JSON.stringify({ score }) })
}

export function publishGrades(exam_id?: number) {
  return apiFetch<{ published_count: number; subjects: string[] }>('/grades/publish', {
    method: 'POST',
    body: JSON.stringify({ exam_id: exam_id ?? null }),
  })
}

export function importGradesCsv(exam_id: number, subject_name: string, file: File) {
  const form = new FormData()
  form.append('exam_id', String(exam_id))
  form.append('subject_name', subject_name)
  form.append('file', file)
  return apiFetch<Grade[]>('/grades/import-csv', { method: 'POST', body: form })
}
