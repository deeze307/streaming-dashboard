import React, { createContext, useContext, ReactNode } from 'react'
import { useStreamStats } from '@/hooks/useStreamStats'
import { StreamStats } from '@/types'

interface StreamContextValue {
  stats: StreamStats
  loading: boolean
  error: string | null
  lastUpdate: Date | null
  refresh: () => Promise<void>
  totalViewers: number
}

const StreamContext = createContext<StreamContextValue | undefined>(undefined)

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const streamStats = useStreamStats()

  return (
    <StreamContext.Provider value={streamStats}>
      {children}
    </StreamContext.Provider>
  )
}

export const useStream = () => {
  const context = useContext(StreamContext)
  if (!context) {
    throw new Error('useStream must be used within a StreamProvider')
  }
  return context
}