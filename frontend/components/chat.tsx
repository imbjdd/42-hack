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

    setStatus('submitted')
    
    // Construire le contenu du message
    let messageContent = content.trim()
    
    // Toujours inclure les données de zone si disponibles (pour le contexte)
    if (selectedArea) {
      const areaInfo = `

CONTEXTE - ZONE DESSINÉE SUR LA CARTE:
- Adresse: ${selectedArea.locationInfo.address}
- Centre: [${selectedArea.locationInfo.center[1]}, ${selectedArea.locationInfo.center[0]}] (lat, lng)
- Superficie: ${(selectedArea.locationInfo.area / 1000000).toFixed(2)} km²
- Coordonnées: ${selectedArea.coordinates.length} points
- Limites: SW[${selectedArea.locationInfo.bounds[0][1]}, ${selectedArea.locationInfo.bounds[0][0]}] NE[${selectedArea.locationInfo.bounds[1][1]}, ${selectedArea.locationInfo.bounds[1][0]}]

${forceAnalysis ? 'INSTRUCTION: Utilise analyze_drawn_area avec ces données pour analyser cette zone.' : 'INFO: Ces données sont disponibles si tu as besoin d\'analyser cette zone.'}`
      
      messageContent += areaInfo
    }
    
    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: content.trim(), // Afficher seulement le message original à l'utilisateur
      timestamp: new Date().toISOString(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Si c'est le premier message, déclencher l'affichage de la carte
    if (messages.length === 0) {
      onFirstMessage?.()
    }

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
          message: messageContent, // Envoyer le message complet avec les données de zone
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
                  
                  // Récupérer les actions de carte après la réponse complète
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
        description: 'Une erreur est survenue lors de l\'envoi du message.',
      })
      
      // Supprimer le message assistant en cas d'erreur si il a été créé
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
      const analysisMessage = "Analyse cette zone dessinée sur la carte et identifie les éléments proches, les points d'intérêt, et les opportunités immobilières."
      sendMessage(analysisMessage, true)
    }
  }

  // Track selected area changes without auto-analyzing
  useEffect(() => {
    if (selectedArea && selectedArea !== previousAreaRef.current) {
      console.log('New area selected:', selectedArea.locationInfo.address)
      // La zone est maintenant disponible pour analyse si l'utilisateur le demande
    }
    previousAreaRef.current = selectedArea
  }, [selectedArea])

  const stop = () => {
    setStatus('idle')
  }

  return (
    <div className="flex flex-col bg-background h-full">
      <Messages 
        messages={messages} 
        isLoading={status === 'streaming'}
      />
      
      <div className="border-t border-zinc-200 dark:border-zinc-700 p-4">
        {/* Area context indicator */}
        {selectedArea && (
          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  Zone disponible: {selectedArea.locationInfo.address}
                </span>
              </div>
              <Button
                onClick={analyzeSelectedArea}
                size="sm"
                variant="outline"
                disabled={status !== 'idle'}
                className="text-green-600 border-green-300 hover:bg-green-100 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/40"
              >
                Analyser cette zone
              </Button>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Surface: {(selectedArea.locationInfo.area / 1000000).toFixed(2)} km² • {selectedArea.coordinates.length} points • Données envoyées au LLM
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