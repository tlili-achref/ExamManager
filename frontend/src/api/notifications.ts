import { apiFetch } from './client'

export interface NotificationItem {
  id: number
  event_type: string
  title: string
  message: string
  icon: string
  target_role: string
  is_read: boolean
  created_at: string
}

export const getNotifications = (unreadOnly = false) =>
  apiFetch<NotificationItem[]>(`/notifications${unreadOnly ? '?unread_only=true' : ''}`)

export const markNotificationRead = (id: number) =>
  apiFetch<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' })

export const markAllNotificationsRead = () =>
  apiFetch<{ updated: number }>('/notifications/read-all', { method: 'POST' })
