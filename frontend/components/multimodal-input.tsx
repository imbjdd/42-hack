'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultimodalInputProps {
  input: string
  setInput: (value: string) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  stop: () => void
}

export function MultimodalInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
}: MultimodalInputProps) {
  const [rows, setRows] = useState(1)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && input.trim()) {
        handleSubmit(e as any)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    
    // Auto-resize textarea
    const lineCount = value.split('\n').length
    setRows(Math.min(Math.max(lineCount, 1), 4))
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Décrivez votre bien immobilier ou posez une question..."
            className={cn(
              'resize-none pr-12 min-h-[52px] rounded-2xl border-zinc-200 dark:border-zinc-700 focus:border-zinc-300 dark:focus:border-zinc-600 focus:ring-0 bg-white dark:bg-zinc-900',
              `rows-${rows}`
            )}
            rows={rows}
            disabled={isLoading}
          />
          
          <Button
            type={isLoading ? 'button' : 'submit'}
            size="icon"
            disabled={!input.trim() && !isLoading}
            onClick={isLoading ? stop : undefined}
            className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-black"
          >
            {isLoading ? (
              <Square className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}