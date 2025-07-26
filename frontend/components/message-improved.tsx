'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

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
          'w-full rounded-lg p-4',
          message.role === 'user' ? 'bg-muted/30' : 'bg-background'
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full space-y-2">
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
              <ReactMarkdown 
                className="text-foreground leading-relaxed"
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold mb-1">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                    ) : (
                      <code className="block bg-muted p-2 rounded text-sm font-mono overflow-x-auto">{children}</code>
                    );
                  },
                  pre: ({ children }) => <pre className="bg-muted p-2 rounded mb-2 overflow-x-auto">{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-muted-foreground pl-4 italic mb-2">{children}</blockquote>,
                  a: ({ children, href }) => <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
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