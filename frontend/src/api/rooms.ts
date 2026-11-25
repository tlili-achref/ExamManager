import { apiFetch } from './client'

export interface Room {
  id: number
  name: string
  building: string
  floor: string
  capacity: number
  available: boolean
  usage_rate: number
}

export function getRooms(search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiFetch<Room[]>(`/rooms${qs}`)
}

export function createRoom(payload: Omit<Room, 'id'>) {
  return apiFetch<Room>('/rooms', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateRoom(id: number, payload: Partial<Room>) {
  return apiFetch<Room>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteRoom(id: number) {
  return apiFetch<void>(`/rooms/${id}`, { method: 'DELETE' })
}
