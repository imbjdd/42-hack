'use client'

import { Message } from './message'

interface MessageType {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface MessagesProps {
  messages: MessageType[]
  status: 'idle' | 'submitted' | 'streaming'
}

export function Messages({ messages, status }: MessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center">
        <div className="text-2xl font-semibold mb-2">Hello there!</div>
        <div className="text-2xl text-zinc-500 mb-8">How can I help you today?</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
          <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors">
            <p className="text-sm">Évaluer une propriété immobilière</p>
          </div>
          <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors">
            <p className="text-sm">Analyser le marché local</p>
          </div>
          <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors">
            <p className="text-sm">Conseils d'investissement</p>
          </div>
          <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors">
            <p className="text-sm">Tendances du marché</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-w-0 gap-0 flex-1 overflow-y-scroll relative">
      {messages.map((message, index) => (
        <Message
          key={message.id || index}
          message={message}
        />
      ))}
      
      {status === 'submitted' && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
        <div className="w-full max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <div className="w-5 h-5 bg-blue-600 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                RevAgent
              </div>
              <div className="flex items-center space-x-2 text-zinc-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-500"></div>
                <span>Réfléchit...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}