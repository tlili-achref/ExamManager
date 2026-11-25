import { API_BASE_URL, apiFetch, getToken } from './client'

export interface ServiceSummary {
  name: string
  description: string
  up: boolean
  latency: string
  uptime: string
}

export interface ServicesStatusResponse {
  summary: ServiceSummary[]
  services: { name: string; up: boolean; latency_ms: number | null }[]
}

export const getServicesStatus = () => apiFetch<ServicesStatusResponse>('/status')

export async function downloadConvocationPdf(studentId: number, examId: number) {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}/convocation/${studentId}/${examId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw new Error('Impossible de télécharger la convocation PDF.')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `convocation_${studentId}_${examId}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
