'use client'

import { Chat } from '@/components/chat'
import MapInterface from '@/components/MapInterface'
import { generateUUID } from '@/lib/utils'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface LocationInfo {
  center: [number, number];
  address: string;
  bounds: [[number, number], [number, number]];
  area: number;
}

export default function Page() {
  const [id, setId] = useState(generateUUID())
  const [selectedArea, setSelectedArea] = useState<{
    coordinates: number[][];
    locationInfo: LocationInfo;
  } | null>(null)
  const [hasMessages, setHasMessages] = useState(false)
  const [mapActions, setMapActions] = useState<any[]>([])

  const handleAreaSelect = (areaData: { coordinates: number[][]; locationInfo: LocationInfo }) => {
    setSelectedArea(areaData)
    console.log('Area selected in main page:', areaData)
  }

  const handleFirstMessage = () => {
    setHasMessages(true)
  }

  const handleMapActions = (actions: any[]) => {
    console.log('Received map actions in main page:', actions)
    setMapActions(actions)
  }
  const handleGoBack = () => {
    setHasMessages(false)
    setSelectedArea(null)
    // Generate new ID to reset chat
    setId(generateUUID())
  }

  return (
    <div className="h-screen bg-background text-black flex">
      <div className={hasMessages ? "flex-1 border-r border-border" : "w-full flex justify-center"}>
        <div className={hasMessages ? "w-full h-full flex flex-col" : "w-full max-w-4xl h-full"}>
          {hasMessages && (
            <div className="flex items-center gap-2 p-4 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Button>
            </div>
          )}
          <div className="flex-1">
            <Chat id={id} selectedArea={selectedArea} onMapActions={handleMapActions}  onFirstMessage={handleFirstMessage} />
          </div>
        </div>
      </div>
      {hasMessages && (
        <div className="w-1/2">
          <MapInterface onAreaSelect={handleAreaSelect} mapActions={mapActions} />
        </div>
      )}
      <Toaster position="top-center" />
    </div>
  )
}