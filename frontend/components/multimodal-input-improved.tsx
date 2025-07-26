'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface MultimodalInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (message: string) => void
  isLoading?: boolean
  onStop?: () => void
  placeholder?: string
}

export function MultimodalInput({
  input,
  setInput,
  onSubmit,
  isLoading = false,
  onStop,
  placeholder = "Type your message here..."
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [rows, setRows] = useState(1)

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = textarea.scrollHeight
      const lineHeight = 24 // approximate line height in pixels
      const maxRows = 6
      const newRows = Math.min(Math.max(Math.ceil(newHeight / lineHeight), 1), maxRows)
      setRows(newRows)
      textarea.style.height = `${Math.min(newHeight, lineHeight * maxRows)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSubmit(input.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleStop = () => {
    onStop?.()
  }

  return (
    <motion.div
      className="border-t bg-background p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "min-h-[48px] resize-none border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring",
              "rounded-2xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground"
            )}
            style={{ height: `${rows * 24 + 24}px` }}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex gap-2">
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleStop}
              className="h-12 w-12 rounded-full"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="h-12 w-12 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-start mt-2 px-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </motion.div>
  )
}