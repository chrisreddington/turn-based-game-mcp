'use client'

import { useSearchParams } from 'next/navigation'
import { UnifiedTicTacToe } from '../../../components/games/UnifiedTicTacToe'

export default function TicTacToePage() {
  const searchParams = useSearchParams()
  const joinGameId = searchParams.get('join')
  const viewMode = searchParams.get('mode') as '2d' | '3d' | null

  return (
    <UnifiedTicTacToe 
      initialViewMode={viewMode || '2d'}
      autoJoinGameId={joinGameId}
    />
  )
}
