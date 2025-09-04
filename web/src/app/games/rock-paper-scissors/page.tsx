'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { UnifiedRockPaperScissors } from '../../../components/games/UnifiedRockPaperScissors'

function RockPaperScissorsPageContent() {
  const searchParams = useSearchParams()
  const joinGameId = searchParams.get('join')
  const viewMode = searchParams.get('mode') as '2d' | '3d' | null

  return (
    <UnifiedRockPaperScissors 
      initialViewMode={viewMode || '2d'}
      autoJoinGameId={joinGameId}
    />
  )
}

export default function RockPaperScissorsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RockPaperScissorsPageContent />
    </Suspense>
  )
}
