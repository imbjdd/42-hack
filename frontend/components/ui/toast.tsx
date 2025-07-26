'use client'

import { toast as sonnerToast } from 'sonner'

interface ToastProps {
  type?: 'success' | 'error' | 'info'
  title?: string
  description?: string
}

export function toast({ type = 'info', title, description }: ToastProps) {
  switch (type) {
    case 'success':
      return sonnerToast.success(title || description)
    case 'error':
      return sonnerToast.error(title || description)
    default:
      return sonnerToast(title || description)
  }
}