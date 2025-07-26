'use client'

import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface MessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 group">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          {isUser ? (
            <div className="w-5 h-5 bg-zinc-600 dark:bg-zinc-300 rounded-full"></div>
          ) : (
            <div className="w-5 h-5 bg-blue-600 rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
            {isUser ? 'You' : 'RevAgent'}
          </div>
          
          <div className="text-zinc-800 dark:text-zinc-200">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-zinc">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}