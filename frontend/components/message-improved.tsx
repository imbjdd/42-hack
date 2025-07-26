'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface MessageProps {
  message: Message
  isLoading?: boolean
}

export const PreviewMessage = memo(
  ({ message, isLoading = false }: MessageProps) => {
    return (
      <motion.div
        className={cn(
          'flex w-full gap-4 rounded-lg p-4',
          message.role === 'user' ? 'bg-muted/30' : 'bg-background'
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex-shrink-0">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {message.role === 'user' ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                </div>
                <span className="text-muted-foreground text-sm">Thinking...</span>
              </div>
            ) : (
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            )}
          </div>
          
          {!isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <time>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </div>
          )}
        </div>
      </motion.div>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.isLoading === nextProps.isLoading
    )
  }
)

PreviewMessage.displayName = 'PreviewMessage'