/**
 * 3D Tic-Tac-Toe game page - redirects to unified page with 3D mode
 */

'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function TicTacToe3DPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Redirect to the unified page with 3D mode and preserve join parameter
    const joinParam = searchParams.get('join')
    const url = new URL('/games/tic-tac-toe', window.location.origin)
    url.searchParams.set('mode', '3d')
    if (joinParam) {
      url.searchParams.set('join', joinParam)
    }
    
    router.replace(url.toString())
  }, [router, searchParams])

  // Show loading while redirecting
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🎮</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Loading 3D Mode...
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Redirecting you to the unified tic-tac-toe experience in 3D mode.
        </p>
        
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  )
}

export default function TicTacToe3DPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TicTacToe3DPageContent />
    </Suspense>
  )
}