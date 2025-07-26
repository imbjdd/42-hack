'use client'

import { Chat } from '@/components/chat'
import { generateUUID } from '@/lib/utils'
import { Toaster } from 'sonner'

export default function Page() {
  const id = generateUUID()

  return (
    <div className="h-screen bg-background">
      <Chat id={id} />
      <Toaster position="top-center" />
    </div>
  )
}