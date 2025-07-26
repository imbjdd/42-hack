'use client'

import { useState } from 'react'
import { generateUUID } from '@/lib/utils'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'
import { toast } from './ui/toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export function Chat({
  id,
  initialMessages = [],
}: {
  id: string
  initialMessages?: Message[]
}) {
  const [sessionId] = useState<string>(id)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'submitted' | 'streaming'>('idle')

  const handleInputChange = (value: string) => {
    setInput(value)
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || status !== 'idle') return

    setStatus('submitted')
    
    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Créer le message assistant vide pour le streaming
    const assistantMessageId = generateUUID()
    
    try {
      // Utiliser l'endpoint streaming
      const response = await fetch('http://localhost:8000/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setStatus('streaming') // Commencer le streaming

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessageCreated = false

      if (reader) {
        let buffer = ''
        
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Garder la ligne incomplète
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const chunk = JSON.parse(line.slice(6))
                console.log('Received chunk:', chunk) // Debug
                
                // Le backend envoie {type: "chunk", chunk: "text"} ou {type: "final", message: "..."}
                const content = chunk.chunk || chunk.message || ''
                
                if (chunk.type === 'chunk' && content) {
                  if (!assistantMessageCreated) {
                    // Créer le message assistant au premier chunk
                    const assistantMessage: Message = {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: content,
                      timestamp: new Date().toISOString(),
                    }
                    setMessages(prev => [...prev, assistantMessage])
                    assistantMessageCreated = true
                  } else {
                    // Mettre à jour le contenu du message
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, content: msg.content + content }
                        : msg
                    ))
                  }
                } else if (chunk.type === 'final') {
                  // Message final, arrêter le streaming
                  console.log('Streaming finished')
                  setStatus('idle')
                } else if (chunk.type === 'error') {
                  throw new Error(chunk.error || 'Streaming error')
                }
              } catch (e) {
                console.error('Error parsing chunk:', e)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast({
        type: 'error',
        description: 'Une erreur est survenue lors de l\'envoi du message.',
      })
      
      // Supprimer le message assistant en cas d'erreur si il a été créé
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
    } finally {
      setStatus('idle')
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const stop = () => {
    setStatus('idle')
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-900">
      <div className="flex-1 overflow-y-auto">
        <Messages 
          messages={messages} 
          status={status}
        />
      </div>
      
      <div className="border-t border-zinc-200 dark:border-zinc-700 p-4">
        <MultimodalInput
          input={input}
          setInput={handleInputChange}
          handleSubmit={onSubmit}
          isLoading={status !== 'idle'}
          stop={stop}
        />
      </div>
    </div>
  )
}