'use client'

import { Chat } from '@/components/chat'
import MapInterface from '@/components/MapInterface'
import { generateUUID } from '@/lib/utils'
import { Toaster } from 'sonner'
import { useState } from 'react'

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
  const [hasMessages, setHasMessages] = useState(true)
  const [mapActions, setMapActions] = useState<any[]>([])

  const handleAreaSelect = (areaData: { coordinates: number[][]; locationInfo: LocationInfo }) => {
    setSelectedArea(areaData)
    console.log('Area selected in main page:', areaData)
  }

  const handleFirstMessage = () => {
    // No longer needed since we show split view by default
  }

  const handleMapActions = (actions: any[]) => {
    console.log('Received map actions in main page:', actions)
    setMapActions(actions)
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Hood.AI Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
        <div className="p-6 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Hood.AI
          </h1>
          <p className="text-muted-foreground text-sm mt-1">AI-powered neighborhood analysis</p>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 border-r border-border h-full">
          <Chat id={id} selectedArea={selectedArea} onMapActions={handleMapActions} onFirstMessage={handleFirstMessage} />
        </div>
        <div className="w-1/2 h-full">
          <MapInterface onAreaSelect={handleAreaSelect} mapActions={mapActions} />
        </div>
      </div>
      
      <Toaster position="top-center" />
    </div>
  )
}