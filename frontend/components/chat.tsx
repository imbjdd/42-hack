'use client'

import { useState, useEffect, useRef } from 'react'
import { generateUUID } from '@/lib/utils'
import { Messages } from './messages-improved'
import { MultimodalInput } from './multimodal-input-improved'
import { toast } from './ui/toast'
import { Button } from './ui/button'
import { MapPin } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface LocationInfo {
  center: [number, number];
  address: string;
  bounds: [[number, number], [number, number]];
  area: number;
}

export function Chat({
  id,
  initialMessages = [],
  selectedArea,
  onFirstMessage,
  onMapActions,
}: {
  id: string
  initialMessages?: Message[]
  selectedArea?: {
    coordinates: number[][];
    locationInfo: LocationInfo;
  } | null
  onFirstMessage?: () => void
  onMapActions?: (actions: any[]) => void
}) {
  const [sessionId] = useState<string>(id)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'submitted' | 'streaming'>('idle')
  const previousAreaRef = useRef<typeof selectedArea>(null)

  const handleInputChange = (value: string) => {
    setInput(value)
  }

  const sendMessage = async (content: string, forceAnalysis: boolean = false) => {
    if (!content.trim() || status !== 'idle') return

    // Build message content
    let messageContent = content.trim()
    
    // Always include area data if available (for context)
    if (selectedArea) {
      const areaInfo = `

CONTEXT - AREA DRAWN ON MAP:
- Address: ${selectedArea.locationInfo.address}
- Center: [${selectedArea.locationInfo.center[1]}, ${selectedArea.locationInfo.center[0]}] (lat, lng)
- Area: ${(selectedArea.locationInfo.area / 1000000).toFixed(2)} km²
- Coordinates: ${selectedArea.coordinates.length} points
- Bounds: SW[${selectedArea.locationInfo.bounds[0][1]}, ${selectedArea.locationInfo.bounds[0][0]}] NE[${selectedArea.locationInfo.bounds[1][1]}, ${selectedArea.locationInfo.bounds[1][0]}]

${forceAnalysis ? 'INSTRUCTION: Use analyze_drawn_area with this data to analyze this area.' : 'INFO: This data is available if you need to analyze this area.'}`
      
      messageContent += areaInfo
    }
    
    // Add user message IMMEDIATELY (without loading state)
    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: content.trim(), // Display only the original message to user
      timestamp: new Date().toISOString(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // If this is the first message, trigger map display
    if (messages.length === 0) {
      onFirstMessage?.()
    }

    // Create empty assistant message for streaming
    const assistantMessageId = generateUUID()
    
    try {
      // Use streaming endpoint
      const response = await fetch('http://localhost:8000/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent, // Send complete message with area data
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setStatus('streaming') // Start streaming

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
          buffer = lines.pop() || '' // Keep incomplete line
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const chunk = JSON.parse(line.slice(6))
                console.log('Received chunk:', chunk) // Debug
                
                // Backend sends {type: "chunk", chunk: "text"} or {type: "final", message: "..."}
                const content = chunk.chunk || chunk.message || ''
                
                if (chunk.type === 'chunk' && content) {
                  if (!assistantMessageCreated) {
                    // Create assistant message on first chunk
                    const assistantMessage: Message = {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: content,
                      timestamp: new Date().toISOString(),
                    }
                    setMessages(prev => [...prev, assistantMessage])
                    assistantMessageCreated = true
                  } else {
                    // Update message content
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, content: msg.content + content }
                        : msg
                    ))
                  }
                } else if (chunk.type === 'final') {
                  // Final message, stop streaming
                  console.log('Streaming finished')
                  setStatus('idle')
                  
                  // Get map actions after complete response
                  console.log('Final chunk metadata:', chunk.metadata)
                  if (chunk.metadata?.map_actions && chunk.metadata.map_actions.length > 0) {
                    console.log('Map actions received:', chunk.metadata.map_actions)
                    onMapActions?.(chunk.metadata.map_actions)
                  } else {
                    console.log('No map actions found in metadata')
                  }
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
        description: 'An error occurred while sending the message.',
      })
      
      // Remove assistant message on error if it was created
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
    } finally {
      setStatus('idle')
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    sendMessage(input)
  }

  const analyzeSelectedArea = () => {
    if (selectedArea) {
      const analysisMessage = "Analyze this area drawn on the map and identify nearby elements, points of interest, and real estate opportunities."
      sendMessage(analysisMessage, true)
    }
  }

  // Track selected area changes without auto-analyzing
  useEffect(() => {
    if (selectedArea && selectedArea !== previousAreaRef.current) {
      console.log('New area selected:', selectedArea.locationInfo.address)
      // The area is now available for analysis if the user requests it
    }
    previousAreaRef.current = selectedArea
  }, [selectedArea])

  const stop = () => {
    setStatus('idle')
  }

  return (
    <div className="flex flex-col bg-background h-full">
      <div className="flex-1 min-h-0">
        <Messages 
          messages={messages} 
          isLoading={status === 'streaming'}
        />
      </div>
      
      <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 flex-shrink-0">
        {/* Area context indicator */}
        {selectedArea && (
          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  Available area: {selectedArea.locationInfo.address}
                </span>
              </div>
              <Button
                onClick={analyzeSelectedArea}
                size="sm"
                variant="outline"
                disabled={status !== 'idle'}
                className="text-green-600 border-green-300 hover:bg-green-100 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/40"
              >
                Analyze this area
              </Button>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Area: {(selectedArea.locationInfo.area / 1000000).toFixed(2)} km² • {selectedArea.coordinates.length} points • Data sent to LLM
            </p>
          </div>
        )}
        
        <MultimodalInput
          input={input}
          setInput={handleInputChange}
          onSubmit={onSubmit}
          isLoading={status !== 'idle'}
          stop={stop}
        />
      </div>
    </div>
  )
}