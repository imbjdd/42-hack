'use client'

import { memo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { PreviewMessage } from './message-improved'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface MessagesProps {
  messages: Message[]
  isLoading?: boolean
}

export const Messages = memo(({ messages, isLoading = false }: MessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 bg-muted-foreground/20 rounded-full flex items-center justify-center">
              <span className="text-lg">Chat</span>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Welcome to the Chat
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Start a conversation by typing a message below. Once you send your first message, the map will appear to help you explore locations.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {messages.map((message, index) => (
            <PreviewMessage
              key={message.id}
              message={message}
              isLoading={isLoading && message.role === 'assistant' && index === messages.length - 1}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
})

Messages.displayName = 'Messages'