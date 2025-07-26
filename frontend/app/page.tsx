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

  const handleAreaSelect = (areaData: { coordinates: number[][]; locationInfo: LocationInfo }) => {
    setSelectedArea(areaData)
    console.log('Area selected in main page:', areaData)
  }

  const handleFirstMessage = () => {
    setHasMessages(true)
  }

  return (
    <div className="h-screen bg-background text-black flex">
      <div className={hasMessages ? "flex-1 border-r border-border" : "w-full"}>
        <Chat id={id} selectedArea={selectedArea} onFirstMessage={handleFirstMessage} />
      </div>
      {hasMessages && (
        <div className="w-1/2">
          <MapInterface onAreaSelect={handleAreaSelect} />
        </div>
      )}
      <Toaster position="top-center" />
    </div>
  )
}