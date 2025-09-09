/**
 * App State Manager
 * Handles app state changes (background/foreground) and manages game state accordingly
 * Requirements: 8.6
 */

import { AppState, type AppStateStatus } from 'react-native'
import type { GameState } from '@/types/gameTypes'
import { mlService } from '../services/MLService'
import { errorHandler } from './errorHandler'

export interface AppStateChangeHandler {
  onBackground?: () => void
  onForeground?: () => void
  onInactive?: () => void
}

export interface GameStateSnapshot {
  phase: string
  currentImageIndex: number
  trainingDataCount: number
  testResultsCount: number
  timestamp: number
}

/**
 * App State Manager Class
 * Manages app lifecycle events and preserves game state
 */
export class AppStateManager {
  private static instance: AppStateManager
  private currentState: AppStateStatus = AppState.currentState
  private handlers: AppStateChangeHandler[] = []
  private listenerSub: { remove: () => void } | null = null
  private gameStateSnapshot: GameStateSnapshot | null = null
  private backgroundTime: number | null = null
  private isInitialized = false

  // Configuration
  private readonly MAX_BACKGROUND_TIME = 5 * 60 * 1000 // 5 minutes
  private readonly CLEANUP_DELAY = 30 * 1000 // 30 seconds

  private constructor() {}

  public static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager()
    }
    return AppStateManager.instance
  }

  /**
   * Initialize app state monitoring
   */
  public initialize(): void {
    if (this.isInitialized) {
      return
    }

    try {
      this.listenerSub = AppState.addEventListener('change', this.handleAppStateChange)
      this.isInitialized = true
      console.log('App state manager initialized')
    } catch (error) {
      errorHandler.handleAppStateError(error as Error, {
        action: 'initialize',
      })
    }
  }

  /**
   * Cleanup app state monitoring
   */
  public cleanup(): void {
    if (!this.isInitialized) {
      return
    }

    try {
      this.listenerSub?.remove()
      this.listenerSub = null
      this.handlers = []
      this.gameStateSnapshot = null
      this.backgroundTime = null
      this.isInitialized = false
      console.log('App state manager cleaned up')
    } catch (error) {
      errorHandler.handleAppStateError(error as Error, {
        action: 'cleanup',
      })
    }
  }

  /**
   * Register app state change handler
   */
  public registerHandler(handler: AppStateChangeHandler): () => void {
    this.handlers.push(handler)

    // Return unregister function
    return () => {
      const index = this.handlers.indexOf(handler)
      if (index > -1) {
        this.handlers.splice(index, 1)
      }
    }
  }

  /**
   * Save current game state snapshot
   */
  public saveGameState(gameState: GameState): void {
    try {
      this.gameStateSnapshot = {
        phase: gameState.phase,
        currentImageIndex: gameState.currentImageIndex || 0,
        trainingDataCount: gameState.trainingData?.length || 0,
        testResultsCount: gameState.testResults?.length || 0,
        timestamp: Date.now(),
      }

      console.log('Game state snapshot saved:', this.gameStateSnapshot)
    } catch (error) {
      errorHandler.handleAppStateError(error as Error, {
        action: 'saveGameState',
        gameState,
      })
    }
  }

  /**
   * Get saved game state snapshot
   */
  public getGameStateSnapshot(): GameStateSnapshot | null {
    return this.gameStateSnapshot
  }

  /**
   * Check if app was in background too long
   */
  public wasInBackgroundTooLong(): boolean {
    if (!this.backgroundTime) {
      return false
    }

    const backgroundDuration = Date.now() - this.backgroundTime
    return backgroundDuration > this.MAX_BACKGROUND_TIME
  }

  /**
   * Get background duration in milliseconds
   */
  public getBackgroundDuration(): number {
    if (!this.backgroundTime) {
      return 0
    }

    return Date.now() - this.backgroundTime
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    try {
      console.log(`App state changed: ${this.currentState} -> ${nextAppState}`)

      if (
        this.currentState === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        this.handleAppGoingBackground()
      } else if (
        this.currentState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        this.handleAppComingForeground()
      } else if (nextAppState === 'inactive') {
        this.handleAppInactive()
      }

      this.currentState = nextAppState
    } catch (error) {
      errorHandler.handleAppStateError(error as Error, {
        currentState: this.currentState,
        nextState: nextAppState,
      })
    }
  }

  /**
   * Handle app going to background
   */
  private handleAppGoingBackground(): void {
    console.log('App going to background')
    this.backgroundTime = Date.now()

    // Notify handlers
    this.handlers.forEach((handler) => {
      try {
        handler.onBackground?.()
      } catch (error) {
        errorHandler.handleAppStateError(error as Error, {
          action: 'onBackground',
        })
      }
    })

    // Schedule cleanup after delay
    setTimeout(() => {
      this.performBackgroundCleanup()
    }, this.CLEANUP_DELAY)
  }

  /**
   * Handle app coming to foreground
   */
  private handleAppComingForeground(): void {
    console.log('App coming to foreground')

    const wasInBackgroundTooLong = this.wasInBackgroundTooLong()
    const backgroundDuration = this.getBackgroundDuration()

    console.log(`Background duration: ${backgroundDuration}ms`)

    // Notify handlers
    this.handlers.forEach((handler) => {
      try {
        handler.onForeground?.()
      } catch (error) {
        errorHandler.handleAppStateError(error as Error, {
          action: 'onForeground',
        })
      }
    })

    // Handle long background scenarios
    if (wasInBackgroundTooLong) {
      this.handleLongBackgroundReturn()
    }

    this.backgroundTime = null
  }

  /**
   * Handle app becoming inactive
   */
  private handleAppInactive(): void {
    console.log('App becoming inactive')

    // Notify handlers
    this.handlers.forEach((handler) => {
      try {
        handler.onInactive?.()
      } catch (error) {
        errorHandler.handleAppStateError(error as Error, {
          action: 'onInactive',
        })
      }
    })
  }

  /**
   * Perform cleanup when app is in background
   */
  private performBackgroundCleanup(): void {
    // Only cleanup if still in background
    if (this.currentState !== 'background') {
      return
    }

    try {
      console.log('Performing background cleanup')

      // Clean up ML service resources
      if (mlService && typeof mlService.cleanup === 'function') {
        // Don't fully cleanup, just optimize memory
        console.log('Optimizing ML service for background')
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
    } catch (error) {
      errorHandler.handleAppStateError(error as Error, {
        action: 'performBackgroundCleanup',
      })
    }
  }

  /**
   * Handle return from long background period
   */
  private handleLongBackgroundReturn(): void {
    try {
      console.log('Handling return from long background period')

      // Show user-friendly message about returning
      const appStateError = errorHandler.handleAppStateError(
        new Error('App was in background for extended period'),
        {
          backgroundDuration: this.getBackgroundDuration(),
          maxBackgroundTime: this.MAX_BACKGROUND_TIME,
        }
      )

      // The game should handle this gracefully by checking model state
      // and potentially reloading if necessary
      console.log(
        'Long background return handled:',
        appStateError.errorInfo.userMessage
      )
    } catch (error) {
      errorHandler.handleAppStateError(error as Error, {
        action: 'handleLongBackgroundReturn',
      })
    }
  }

  /**
   * Get current app state
   */
  public getCurrentState(): AppStateStatus {
    return this.currentState
  }

  /**
   * Check if app is currently active
   */
  public isActive(): boolean {
    return this.currentState === 'active'
  }

  /**
   * Check if app is currently in background
   */
  public isInBackground(): boolean {
    return this.currentState === 'background'
  }

  /**
   * Check if app is currently inactive
   */
  public isInactive(): boolean {
    return this.currentState === 'inactive'
  }
}

// Export singleton instance
export const appStateManager = AppStateManager.getInstance()
