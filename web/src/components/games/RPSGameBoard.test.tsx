import { vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RPSGameBoard } from './RPSGameBoard';
import type { RPSGameState, RPSChoice } from '@turn-based-mcp/shared';

const createMockGameState = (overrides: Partial<RPSGameState> = {}): RPSGameState => ({
  id: 'test-rps-game-1',
  players: [
    { id: 'player1', name: 'Player', isAI: false },
    { id: 'ai', name: 'AI', isAI: true }
  ],
  currentPlayerId: 'player1',
  status: 'playing',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:05:00Z'),
  rounds: [{}, {}, {}], // 3 empty rounds
  currentRound: 0,
  maxRounds: 3,
  scores: {
    player1: 0,
    ai: 0
  },
  ...overrides
});

describe('RPSGameBoard', () => {
  const mockOnMove = vi.fn();

  beforeEach(() => {
    mockOnMove.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render choice buttons', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('Rock')).toBeInTheDocument();
      expect(screen.getByText('Paper')).toBeInTheDocument();
      expect(screen.getByText('Scissors')).toBeInTheDocument();
    });

    it('should render choice emojis', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('🪨')).toBeInTheDocument();
      expect(screen.getByText('📄')).toBeInTheDocument();
      expect(screen.getByText('✂️')).toBeInTheDocument();
    });

    it('should display current round information', () => {
      const gameState = createMockGameState({ currentRound: 1 });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('Round 2 of 3')).toBeInTheDocument();
    });

    it('should show "Choose your move!" when player can move', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('Choose your move!')).toBeInTheDocument();
    });

    it('should show "Waiting for AI..." when player made choice', () => {
      const gameState = createMockGameState({
        rounds: [{ player1Choice: 'rock' }, {}, {}]
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('Waiting for AI...')).toBeInTheDocument();
    });
  });

  describe('choice interaction', () => {
    it('should call onMove when clicking rock', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const rockButton = screen.getByText('Rock').closest('button')!;
      fireEvent.click(rockButton);

      expect(mockOnMove).toHaveBeenCalledWith({ choice: 'rock' });
    });

    it('should call onMove when clicking paper', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const paperButton = screen.getByText('Paper').closest('button')!;
      fireEvent.click(paperButton);

      expect(mockOnMove).toHaveBeenCalledWith({ choice: 'paper' });
    });

    it('should call onMove when clicking scissors', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const scissorsButton = screen.getByText('Scissors').closest('button')!;
      fireEvent.click(scissorsButton);

      expect(mockOnMove).toHaveBeenCalledWith({ choice: 'scissors' });
    });

    it('should not call onMove when disabled', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} disabled />);

      const rockButton = screen.getByText('Rock').closest('button')!;
      fireEvent.click(rockButton);

      expect(mockOnMove).not.toHaveBeenCalled();
    });

    it('should not call onMove when player already made choice', () => {
      const gameState = createMockGameState({
        rounds: [{ player1Choice: 'rock' }, {}, {}]
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const paperButton = screen.getByText('Paper').closest('button')!;
      fireEvent.click(paperButton);

      expect(mockOnMove).not.toHaveBeenCalled();
    });

    it('should not call onMove when game finished', () => {
      const gameState = createMockGameState({
        status: 'finished',
        winner: 'player1'
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      // When game is finished, choice buttons should not be rendered
      expect(screen.queryByText('Rock')).not.toBeInTheDocument();
      expect(mockOnMove).not.toHaveBeenCalled();
    });

    it('should not call onMove when AI turn', () => {
      const gameState = createMockGameState({
        currentPlayerId: 'ai'
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const rockButton = screen.getByText('Rock').closest('button')!;
      fireEvent.click(rockButton);

      expect(mockOnMove).not.toHaveBeenCalled();
    });
  });

  describe('round display', () => {
    it('should show completed round result', async () => {
      const gameState = createMockGameState({
        rounds: [
          { player1Choice: 'rock', player2Choice: 'scissors', winner: 'player1' },
          {},
          {}
        ],
        currentRound: 0 // Still in round 0 to show the result
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      // Fast-forward past the AI choice reveal timeout (2000ms)
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getAllByText('🪨')).toHaveLength(3); // Rock emoji (in round result and button)
      expect(screen.getAllByText('✂️')).toHaveLength(3); // Scissors emoji (in round result and button)
      expect(screen.getByText('🎉 You win this round!')).toBeInTheDocument();
    });

    it('should show AI wins round', async () => {
      const gameState = createMockGameState({
        rounds: [
          { player1Choice: 'rock', player2Choice: 'paper', winner: 'ai' },
          {},
          {}
        ],
        currentRound: 0
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      // Fast-forward past the AI choice reveal timeout (2000ms)
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('🤖 AI wins this round!')).toBeInTheDocument();
    });

    it('should show draw round', async () => {
      const gameState = createMockGameState({
        rounds: [
          { player1Choice: 'rock', player2Choice: 'rock', winner: 'draw' },
          {},
          {}
        ],
        currentRound: 0
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      // Fast-forward past the AI choice reveal timeout (2000ms)
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('🤝 Draw!')).toBeInTheDocument();
    });

    it('should not show round result when round not complete', () => {
      const gameState = createMockGameState({
        rounds: [{ player1Choice: 'rock' }, {}, {}]
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.queryByText('You win this round!')).not.toBeInTheDocument();
      expect(screen.queryByText('AI wins this round!')).not.toBeInTheDocument();
      expect(screen.queryByText('Draw!')).not.toBeInTheDocument();
    });
  });

  describe('round history', () => {
    it('should show round history after first round', () => {
      const gameState = createMockGameState({
        rounds: [
          { player1Choice: 'rock', player2Choice: 'scissors', winner: 'player1' },
          {},
          {}
        ],
        currentRound: 1
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('Round History')).toBeInTheDocument();
      expect(screen.getByText('Round 1:')).toBeInTheDocument();
      expect(screen.getByText('🎉 You Win!')).toBeInTheDocument();
    });

    it('should show multiple rounds in history', () => {
      const gameState = createMockGameState({
        rounds: [
          { player1Choice: 'rock', player2Choice: 'scissors', winner: 'player1' },
          { player1Choice: 'paper', player2Choice: 'rock', winner: 'player1' },
          {}
        ],
        currentRound: 2
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('Round 1:')).toBeInTheDocument();
      expect(screen.getByText('Round 2:')).toBeInTheDocument();
      expect(screen.getAllByText('🎉 You Win!')).toHaveLength(2);
    });

    it('should show AI wins in history', () => {
      const gameState = createMockGameState({
        rounds: [
          { player1Choice: 'rock', player2Choice: 'paper', winner: 'player2' },
          {},
          {}
        ],
        currentRound: 1
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('🤖 AI Wins')).toBeInTheDocument();
    });

    it('should show draws in history', () => {
      const gameState = createMockGameState({
        rounds: [
          { player1Choice: 'rock', player2Choice: 'rock', winner: 'draw' },
          {},
          {}
        ],
        currentRound: 1
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('🤝 Draw')).toBeInTheDocument();
    });

    it('should not show history when no rounds completed', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.queryByText('Round History')).not.toBeInTheDocument();
    });
  });

  describe('game end states', () => {
    it('should show player victory message', () => {
      const gameState = createMockGameState({
        status: 'finished',
        winner: 'player1'
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('🎉 You won the match!')).toBeInTheDocument();
    });

    it('should show AI victory message', () => {
      const gameState = createMockGameState({
        status: 'finished',
        winner: 'ai'
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('🤖 AI won the match!')).toBeInTheDocument();
    });

    it('should show draw match message', () => {
      const gameState = createMockGameState({
        status: 'finished',
        winner: 'draw'
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('🤝 The match is a draw!')).toBeInTheDocument();
    });

    it('should not show choice buttons when game finished', () => {
      const gameState = createMockGameState({
        status: 'finished',
        winner: 'player1',
        currentRound: 3
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      // Buttons should not be present in DOM when game is finished
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('visual states', () => {
    it('should show AI overlay when disabled and AI turn', () => {
      const gameState = createMockGameState({ currentPlayerId: 'ai' });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} disabled />);

      expect(screen.getByText("🤖 AI's Turn - Choices Locked")).toBeInTheDocument();
    });

    it('should not show AI overlay when not AI turn', () => {
      const gameState = createMockGameState({ currentPlayerId: 'player1' });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} disabled />);

      expect(screen.queryByText("🤖 AI's Turn - Choices Locked")).not.toBeInTheDocument();
    });

    it('should highlight selected choice', () => {
      const gameState = createMockGameState({
        rounds: [{ player1Choice: 'rock' }, {}, {}]
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const rockButton = screen.getByText('Rock').closest('button')!;
      expect(rockButton).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('should not highlight unselected choices', () => {
      const gameState = createMockGameState({
        rounds: [{ player1Choice: 'rock' }, {}, {}]
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const paperButton = screen.getByText('Paper').closest('button')!;
      expect(paperButton).not.toHaveClass('border-blue-500', 'bg-blue-50');
    });
  });

  describe('accessibility', () => {
    it('should have accessible button elements', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should disable buttons when appropriate', () => {
      const gameState = createMockGameState({
        rounds: [{ player1Choice: 'rock' }, {}, {}]
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should enable buttons when player can move', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should have proper semantic structure', () => {
      const gameState = createMockGameState({
        rounds: [
          { player1Choice: 'rock', player2Choice: 'scissors', winner: 'player1' },
          {},
          {}
        ],
        currentRound: 1
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Round 2 of 3');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Round History');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined round data', () => {
      const gameState = createMockGameState({
        rounds: [undefined as unknown as { player1Choice?: RPSChoice; player2Choice?: RPSChoice; winner?: string | 'draw'; }, {}, {}]
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      // Should render without crashing
      expect(screen.getByText('Round 1 of 3')).toBeInTheDocument();
    });

    it('should handle zero max rounds', () => {
      const gameState = createMockGameState({
        maxRounds: 0,
        currentRound: 0
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      expect(screen.getByText('Round 1 of 0')).toBeInTheDocument();
    });

    it('should handle rapid consecutive clicks', () => {
      const gameState = createMockGameState();
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      const rockButton = screen.getByText('Rock').closest('button')!;
      
      // Rapidly click the same button
      fireEvent.click(rockButton);
      fireEvent.click(rockButton);
      fireEvent.click(rockButton);

      // Should only register one move
      expect(mockOnMove).toHaveBeenCalledTimes(3); // All clicks register at component level
      expect(mockOnMove).toHaveBeenCalledWith({ choice: 'rock' });
    });

    it('should handle empty scores object', () => {
      const gameState = createMockGameState({
        scores: {}
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      // Should render without errors
      expect(screen.getByText('Round 1 of 3')).toBeInTheDocument();
    });

    it('should handle missing player choices in rounds', () => {
      const gameState = createMockGameState({
        rounds: [
          { winner: 'draw' }, // Missing choices but has winner
          {},
          {}
        ],
        currentRound: 1
      });
      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      // Should handle gracefully
      expect(screen.getByText('Round History')).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should handle large number of rounds', () => {
      const gameState = createMockGameState({
        maxRounds: 100,
        currentRound: 50,
        rounds: Array.from({ length: 100 }, (_, i) => 
          i < 50 ? { player1Choice: 'rock' as RPSChoice, player2Choice: 'scissors' as RPSChoice, winner: 'player1' } : {}
        )
      });

      render(<RPSGameBoard gameState={gameState} onMove={mockOnMove} />);

      // Should render without performance issues
      expect(screen.getByText('Round 51 of 100')).toBeInTheDocument();
    });
  });
});