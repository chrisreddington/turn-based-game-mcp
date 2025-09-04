import { Game, Player, PlayerId, GameResult } from '../types/game';
import { RPSGameState, RPSMove, RPSChoice } from '../types/games';

/**
 * Implementation of the classic Rock Paper Scissors game
 * 
 * A best-of-N rounds game where players simultaneously choose rock, paper, or scissors.
 * Rock beats scissors, scissors beats paper, paper beats rock.
 * The first player to win the majority of rounds wins the match.
 * 
 * @example
 * ```typescript
 * const game = new RockPaperScissorsGame();
 * const players = [
 *   { id: 'player1', name: 'Human', isAI: false },
 *   { id: 'ai', name: 'Computer', isAI: true }
 * ];
 * const initialState = game.getInitialState(players); // Creates best-of-3 game
 * ```
 */
export class RockPaperScissorsGame implements Game<RPSGameState, RPSMove> {
  /**
   * Validates whether a move is legal in the current game state
   * 
   * @param gameState - The current state of the rock-paper-scissors game
   * @param move - The move to validate (choice of rock, paper, or scissors)
   * @param playerId - The ID of the player attempting the move
   * @returns true if the move is valid, false otherwise
   * 
   * @description
   * A move is valid if:
   * - The choice is one of: 'rock', 'paper', 'scissors'
   * - The game status is 'playing'
   * - The current round hasn't exceeded max rounds
   * - The player hasn't already made a choice in the current round
   */
  validateMove(gameState: RPSGameState, move: RPSMove, playerId: PlayerId): boolean {
    const { choice } = move;
    
    // Check if it's a valid choice
    if (!['rock', 'paper', 'scissors'].includes(choice)) {
      return false;
    }
    
    // Check if game is still ongoing
    if (gameState.status !== 'playing') {
      return false;
    }
    
    // Check if current round is valid
    if (gameState.currentRound >= gameState.maxRounds) {
      return false;
    }
    
    const currentRound = gameState.rounds[gameState.currentRound];
    
    // Check if player hasn't made a choice yet in this round
    if (playerId === gameState.players[0].id) {
      return !currentRound.player1Choice;
    } else {
      return !currentRound.player2Choice;
    }
  }

  /**
   * Applies a validated move to the game state and returns the new state
   * 
   * @param gameState - The current state of the rock-paper-scissors game
   * @param move - The move to apply (must be valid)
   * @param playerId - The ID of the player making the move
   * @returns A new game state with the move applied
   * @throws Error if the move is invalid
   * 
   * @description
   * This method handles both partial and complete rounds:
   * - If first player choice: records choice and switches to other player
   * - If second player choice: records choice, determines round winner,
   *   updates scores, and advances to next round or ends game
   */
  applyMove(gameState: RPSGameState, move: RPSMove, playerId: PlayerId): RPSGameState {
    if (!this.validateMove(gameState, move, playerId)) {
      throw new Error('Invalid move');
    }

    const newRounds = [...gameState.rounds];
    const currentRound = { ...newRounds[gameState.currentRound] };
    
    // Apply the move
    if (playerId === gameState.players[0].id) {
      currentRound.player1Choice = move.choice;
    } else {
      currentRound.player2Choice = move.choice;
    }
    
    newRounds[gameState.currentRound] = currentRound;
    
    let newCurrentRound = gameState.currentRound;
    const newScores = { ...gameState.scores };
    let newCurrentPlayerId = gameState.currentPlayerId;
    
    // If both players have made their choices, resolve the round
    if (currentRound.player1Choice && currentRound.player2Choice) {
      const roundWinner = this.determineRoundWinner(
        currentRound.player1Choice,
        currentRound.player2Choice
      );
      
      currentRound.winner = roundWinner;
      
      // Update scores
      if (roundWinner !== 'draw') {
        const winnerId = roundWinner === 'player1' ? gameState.players[0].id : gameState.players[1].id;
        newScores[winnerId] = (newScores[winnerId] || 0) + 1;
      }
      
      // Move to next round
      newCurrentRound++;
      newCurrentPlayerId = gameState.players[0].id; // Reset to first player
    } else {
      // Switch to other player
      newCurrentPlayerId = gameState.players.find(p => p.id !== playerId)?.id || gameState.players[0].id;
    }

    return {
      ...gameState,
      rounds: newRounds,
      currentRound: newCurrentRound,
      scores: newScores,
      currentPlayerId: newCurrentPlayerId,
      updatedAt: new Date(),
    };
  }

  /**
   * Checks if the game has ended and determines the winner
   * 
   * @param gameState - The current state of the rock-paper-scissors game
   * @returns GameResult with winner and reason if game ended, null if game continues
   * 
   * @description
   * The game ends when all rounds are complete (currentRound >= maxRounds).
   * Winner is determined by comparing final scores:
   * - Player with higher score wins
   * - Equal scores result in a draw
   * - Reason includes the final score (e.g., "Won 2-1")
   */
  checkGameEnd(gameState: RPSGameState): GameResult | null {
    // Game ends when all rounds are complete
    if (gameState.currentRound >= gameState.maxRounds) {
      const player1Score = gameState.scores[gameState.players[0].id] || 0;
      const player2Score = gameState.scores[gameState.players[1].id] || 0;
      
      if (player1Score > player2Score) {
        return {
          winner: gameState.players[0].id,
          reason: `Won ${player1Score}-${player2Score}`
        };
      } else if (player2Score > player1Score) {
        return {
          winner: gameState.players[1].id,
          reason: `Won ${player2Score}-${player1Score}`
        };
      } else {
        return {
          winner: 'draw',
          reason: `Tied ${player1Score}-${player2Score}`
        };
      }
    }
    
    return null; // Game continues
  }

  /**
   * Gets all valid moves for a player in the current game state
   * 
   * @param gameState - The current state of the rock-paper-scissors game
   * @param playerId - The ID of the player to get moves for
   * @returns Array of valid RPSMove objects (all choices if player can move)
   * 
   * @description
   * Returns all three choices [rock, paper, scissors] if:
   * - Game is still playing
   * - Current round is within max rounds
   * - Player hasn't made a choice in the current round
   * Otherwise returns an empty array.
   */
  getValidMoves(gameState: RPSGameState, playerId: PlayerId): RPSMove[] {
    if (gameState.status !== 'playing' || gameState.currentRound >= gameState.maxRounds) {
      return [];
    }
    
    const currentRound = gameState.rounds[gameState.currentRound];
    
    // Check if player can make a move in current round
    const canMove = (playerId === gameState.players[0].id && !currentRound.player1Choice) ||
                   (playerId === gameState.players[1].id && !currentRound.player2Choice);
    
    if (!canMove) {
      return [];
    }
    
    return [
      { choice: 'rock' },
      { choice: 'paper' },
      { choice: 'scissors' }
    ];
  }

  /**
   * Creates the initial game state for a new rock-paper-scissors game
   * 
   * @param players - Array of exactly 2 players
   * @param options - Optional configuration including maxRounds
   * @returns Initial RPSGameState set up for a configurable number of rounds
   * 
   * @description
   * Sets up a new game with:
   * - Configurable number of rounds (default: 3 for best-of-3 format)
   * - All scores initialized to 0
   * - First player goes first
   * - Game status set to 'playing'
   * - Current round set to 0
   */
  getInitialState(players: Player[], options?: { maxRounds?: number }): RPSGameState {
    const maxRounds = options?.maxRounds || 3; // Default to best of 3
    const rounds = Array.from({ length: maxRounds }, () => ({}));
    
    const scores: Record<string, number> = {};
    players.forEach(player => {
      scores[player.id] = 0;
    });

    return {
      id: crypto.randomUUID(),
      players,
      currentPlayerId: players[0].id,
      status: 'playing',
      createdAt: new Date(),
      updatedAt: new Date(),
      rounds,
      currentRound: 0,
      maxRounds,
      scores,
    };
  }

  /**
   * Determines the winner of a single round based on the classic RPS rules
   * 
   * @param choice1 - First player's choice
   * @param choice2 - Second player's choice
   * @returns 'player1' if choice1 wins, 'player2' if choice2 wins, 'draw' if same
   * 
   * @private
   * @description
   * Implements the classic rules:
   * - Rock beats Scissors
   * - Paper beats Rock  
   * - Scissors beats Paper
   * - Same choices result in a draw
   */
  private determineRoundWinner(choice1: RPSChoice, choice2: RPSChoice): string {
    if (choice1 === choice2) {
      return 'draw';
    }
    
    const winConditions: Record<RPSChoice, RPSChoice> = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    };
    
    return winConditions[choice1] === choice2 ? 'player1' : 'player2';
  }
}
