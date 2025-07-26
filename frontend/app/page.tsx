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
  const id = generateUUID()
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

  return (
    <div className="h-screen bg-background text-black flex">
      <div className={hasMessages ? "flex-1 border-r border-border" : "w-full"}>
        <Chat id={id} selectedArea={selectedArea} onFirstMessage={handleFirstMessage} onMapActions={handleMapActions} />
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