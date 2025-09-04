import Link from 'next/link'
import { getGameDisplayName } from '@turn-based-mcp/shared'
import type { GameType } from '@turn-based-mcp/shared'

const AVAILABLE_GAMES: { type: GameType; description: string }[] = [
  {
    type: 'tic-tac-toe',
    description: 'Classic 3x3 grid game. Get three in a row to win!'
  },
  {
    type: 'rock-paper-scissors',
    description: 'Best of 3 rounds. Rock beats scissors, scissors beats paper, paper beats rock!'
  }
]

export default function HomePage() {
  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent leading-tight">
            Welcome to Turn-Based Games
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Challenge yourself against our AI opponents in classic turn-based games. 
            Experience intelligent gameplay powered by cutting-edge AI technology.
          </p>
        </div>
        
        {/* CTA Badge */}
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10 border border-blue-200 dark:border-blue-800 rounded-full">
          <span className="flex w-2 h-2 bg-green-400 rounded-full mr-2"></span>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI Ready • Choose Your Game</span>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
        {AVAILABLE_GAMES.map((game) => (
          <div
            key={game.type}
            className={`group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/20 dark:border-slate-700/50 hover:-translate-y-1 md:hover:scale-105`}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-400/5 dark:to-indigo-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-6 sm:p-8">
              {/* Game Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                {game.type === 'tic-tac-toe' ? (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM7 15h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
                  </svg>
                ) : game.type === 'rock-paper-scissors' ? (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm0 2c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm0 2c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5zm0 2c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                )}
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {getGameDisplayName(game.type)}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {game.description}
              </p>
              
              <Link
                href={`/games/${game.type}`}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl group-hover:scale-105"
              >
                Play Now
                <svg
                  className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 3D Games Section */}
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
          🎮 Experience in 3D
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
          Take your gaming to the next dimension! Play in immersive 3D environments with interactive camera controls, 
          realistic lighting, and stunning visual effects.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {AVAILABLE_GAMES.map((game) => (
            <div
              key={`${game.type}-3d`}
              className="group bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl mb-4 mx-auto">
                {game.type === 'tic-tac-toe' ? (
                  <span className="text-2xl">🎯</span>
                ) : (
                  <span className="text-2xl">⚔️</span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                3D {getGameDisplayName(game.type)}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                {game.type === 'tic-tac-toe' 
                  ? 'Rotate around a 3D board, click cells to play, and watch pieces animate in real-time!'
                  : 'Watch animated 3D hands battle it out with dramatic reveals and victory effects!'
                }
              </p>
              
              <div className="space-y-3">
                <Link
                  href={`/games/${game.type}/3d`}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Play in 3D
                  <span className="ml-2 text-lg">🎮</span>
                </Link>
                
                <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>• Camera Controls</span>
                  <span>• Realistic Physics</span>
                  <span>• 3D Animations</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-2 text-amber-700 dark:text-amber-300">
            <span className="text-lg">💡</span>
            <span className="text-sm font-medium">Requires WebGL-enabled browser</span>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="text-center">
        <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 sm:p-10 max-w-4xl mx-auto border border-white/20 dark:border-slate-700/50">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
              </svg>
            </div>
          </div>
          
          <div className="pt-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Play against an AI opponent powered by a Model Context Protocol (MCP) server. 
              When it&apos;s the AI&apos;s turn, the game will pause and wait for you to use your AI assistant 
              (configured with our MCP server) to make strategic moves. Experience intelligent 
              gameplay that adapts to different difficulty levels and strategies.
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Powered</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Real-time</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Strategic</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
