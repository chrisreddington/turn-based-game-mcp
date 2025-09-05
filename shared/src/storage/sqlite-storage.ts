import sqlite3 from 'sqlite3'
import path from 'path'
import type { GameSession } from '../types/game'
import type { TicTacToeGameState, RPSGameState } from '../types/games'

// SQLite parameter types
type SqliteValue = string | number | boolean | null | Buffer
type SqliteParams = SqliteValue[]

// SQLite result types
interface SqliteRunResult {
  lastID?: number
  changes: number
}

// Row data from database queries
interface DbRow {
  [key: string]: SqliteValue
}

// SQLite database instance
let db: sqlite3.Database | null = null
let initializationPromise: Promise<sqlite3.Database> | null = null

// Database file path - store in project root so both web app and MCP server can access
// Use environment variable if set, otherwise use a path in the current working directory
// During tests, use an in-memory database for speed and isolation
const DB_PATH = process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined
  ? ':memory:' 
  : process.env.GAMES_DB_PATH || path.join(process.cwd(), 'games.db')

// Initialize database and create tables if they don't exist
async function initializeDatabase(): Promise<sqlite3.Database> {
  if (db) {
    return db
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return initializationPromise
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('Initializing database at:', DB_PATH)
  }

  initializationPromise = new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        if (process.env.NODE_ENV !== 'test') {
          console.error('Failed to open database:', err)
        }
        initializationPromise = null
        reject(err)
        return
      }

      if (process.env.NODE_ENV !== 'test') {
        console.log('Database opened successfully')
      }

      // Create tables if they don't exist - use Promise.all to wait for both tables
      const createTicTacToeTable = new Promise<void>((resolveTable, rejectTable) => {
        if (!db) {
          rejectTable(new Error('Database connection lost during table creation'))
          return
        }
        db.serialize(() => {
          db!.run(`
            CREATE TABLE IF NOT EXISTS tic_tac_toe_games (
              id TEXT PRIMARY KEY,
              game_session TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              if (process.env.NODE_ENV !== 'test') {
                console.error('Failed to create tic_tac_toe_games table:', err)
              }
              rejectTable(err)
            } else {
              if (process.env.NODE_ENV !== 'test') {
                console.log('tic_tac_toe_games table created/verified')
              }
              resolveTable()
            }
          })
        })
      })

      const createRPSTable = new Promise<void>((resolveTable, rejectTable) => {
        if (!db) {
          rejectTable(new Error('Database connection lost during table creation'))
          return
        }
        db.serialize(() => {
          db!.run(`
            CREATE TABLE IF NOT EXISTS rps_games (
              id TEXT PRIMARY KEY,
              game_session TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              if (process.env.NODE_ENV !== 'test') {
                console.error('Failed to create rps_games table:', err)
              }
              rejectTable(err)
            } else {
              if (process.env.NODE_ENV !== 'test') {
                console.log('rps_games table created/verified')
              }
              resolveTable()
            }
          })
        })
      })

      // Wait for all tables to be created before resolving
      Promise.all([createTicTacToeTable, createRPSTable])
        .then(() => {
          if (process.env.NODE_ENV !== 'test') {
            console.log('Database initialized successfully')
          }
          initializationPromise = null
          resolve(db!)
        })
        .catch((err) => {
          if (process.env.NODE_ENV !== 'test') {
            console.error('Failed to initialize database tables:', err)
          }
          initializationPromise = null
          reject(err)
        })
    })
  })

  return initializationPromise
}

// Helper function to run database queries
async function runQuery(sql: string, params: SqliteParams = []): Promise<SqliteRunResult> {
  try {
    const database = await initializeDatabase()
    if (!database) {
      throw new Error('Database connection not available')
    }
    return new Promise((resolve, reject) => {
      database.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ lastID: this.lastID, changes: this.changes })
        }
      })
    })
  } catch (error) {
    // In test environment, don't throw for certain SQLite errors
    if (process.env.NODE_ENV === 'test' && error instanceof Error && error.message.includes('no such table')) {
      return { lastID: undefined, changes: 0 }
    }
    throw error
  }
}

// Helper function to get single row
async function getRow(sql: string, params: SqliteParams = []): Promise<DbRow | undefined> {
  try {
    const database = await initializeDatabase()
    if (!database) {
      throw new Error('Database connection not available')
    }
    return new Promise((resolve, reject) => {
      database.get(sql, params, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row as DbRow | undefined)
        }
      })
    })
  } catch (error) {
    // In test environment, don't throw for certain SQLite errors
    if (process.env.NODE_ENV === 'test' && error instanceof Error && error.message.includes('no such table')) {
      return undefined
    }
    throw error
  }
}

// Helper function to get all rows
async function getAllRows(sql: string, params: SqliteParams = []): Promise<DbRow[]> {
  try {
    const database = await initializeDatabase()
    if (!database) {
      throw new Error('Database connection not available')
    }
    return new Promise((resolve, reject) => {
      database.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve((rows || []) as DbRow[])
        }
      })
    })
  } catch (error) {
    // In test environment, don't throw for certain SQLite errors
    if (process.env.NODE_ENV === 'test' && error instanceof Error && error.message.includes('no such table')) {
      return []
    }
    throw error
  }
}

// Tic-tac-toe game operations
export async function getTicTacToeGame(gameId: string): Promise<GameSession<TicTacToeGameState> | undefined> {
  try {
    const row = await getRow('SELECT game_session FROM tic_tac_toe_games WHERE id = ?', [gameId])
    if (row && typeof row.game_session === 'string') {
      return JSON.parse(row.game_session)
    }
    return undefined
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error getting tic-tac-toe game:', error)
    }
    return undefined
  }
}

export async function setTicTacToeGame(gameId: string, gameSession: GameSession<TicTacToeGameState>): Promise<void> {
  try {
    const gameSessionJson = JSON.stringify(gameSession)
    await runQuery(`
      INSERT OR REPLACE INTO tic_tac_toe_games (id, game_session, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [gameId, gameSessionJson])
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error setting tic-tac-toe game:', error)
    }
    throw error
  }
}

export async function getAllTicTacToeGames(): Promise<GameSession<TicTacToeGameState>[]> {
  try {
    const rows = await getAllRows('SELECT game_session FROM tic_tac_toe_games ORDER BY updated_at DESC')
    return rows
      .filter(row => typeof row.game_session === 'string')
      .map(row => JSON.parse(row.game_session as string))
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error getting all tic-tac-toe games:', error)
    }
    return []
  }
}

export async function deleteTicTacToeGame(gameId: string): Promise<boolean> {
  try {
    const result = await runQuery('DELETE FROM tic_tac_toe_games WHERE id = ?', [gameId])
    return result.changes > 0
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error deleting tic-tac-toe game:', error)
    }
    return false
  }
}

// Rock-paper-scissors game operations
export async function getRPSGame(gameId: string): Promise<GameSession<RPSGameState> | undefined> {
  try {
    const row = await getRow('SELECT game_session FROM rps_games WHERE id = ?', [gameId])
    if (row && typeof row.game_session === 'string') {
      return JSON.parse(row.game_session)
    }
    return undefined
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error getting RPS game:', error)
    }
    return undefined
  }
}

export async function setRPSGame(gameId: string, gameSession: GameSession<RPSGameState>): Promise<void> {
  try {
    const gameSessionJson = JSON.stringify(gameSession)
    await runQuery(`
      INSERT OR REPLACE INTO rps_games (id, game_session, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [gameId, gameSessionJson])
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error setting RPS game:', error)
    }
    throw error
  }
}

export async function getAllRPSGames(): Promise<GameSession<RPSGameState>[]> {
  try {
    const rows = await getAllRows('SELECT game_session FROM rps_games ORDER BY updated_at DESC')
    return rows
      .filter(row => typeof row.game_session === 'string')
      .map(row => JSON.parse(row.game_session as string))
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error getting all RPS games:', error)
    }
    return []
  }
}

export async function deleteRPSGame(gameId: string): Promise<boolean> {
  try {
    const result = await runQuery('DELETE FROM rps_games WHERE id = ?', [gameId])
    return result.changes > 0
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error deleting RPS game:', error)
    }
    return false
  }
}

/**
 * Reset database instance - primarily for testing
 * Forces re-initialization on next database operation
 */
export async function resetDatabaseInstance(): Promise<void> {
  // Clear initialization promise first
  initializationPromise = null
  
  if (db) {
    return new Promise<void>((resolve) => {
      try {
        db!.close((err) => {
          if (err && process.env.NODE_ENV !== 'test') {
            console.error('Error closing database during reset:', err)
          }
          db = null
          resolve()
        })
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.error('Error closing database during reset:', error)
        }
        db = null
        resolve()
      }
    })
  } else {
    // No database to close, just resolve immediately
    return Promise.resolve()
  }
}


