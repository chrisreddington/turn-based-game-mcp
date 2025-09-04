'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { UnifiedTicTacToe } from '../../../components/games/UnifiedTicTacToe'

function TicTacToePageContent() {
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

export default function TicTacToePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TicTacToePageContent />
    </Suspense>
  )
}
