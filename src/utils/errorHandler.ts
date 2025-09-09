/**
 * Error Handler Utility
 * Provides centralized error handling with user-friendly messages
 * Requirements: 1.8, 3.3, 8.6
 */

import { Alert } from 'react-native'

export interface ErrorInfo {
  code: string
  message: string
  userMessage: string
  recoverable: boolean
  retryable: boolean
}

export type ErrorType =
  | 'MODEL_LOAD_ERROR'
  | 'PREDICTION_TIMEOUT'
  | 'MEMORY_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'APP_STATE_ERROR'
  | 'TENSOR_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Error definitions with user-friendly messages for children aged 8-12
 */
const ERROR_DEFINITIONS: Record<ErrorType, Omit<ErrorInfo, 'message'>> = {
  MODEL_LOAD_ERROR: {
    code: 'MODEL_LOAD_ERROR',
    userMessage:
      "Oops! Your critter is having trouble waking up. Let's try again!",
    recoverable: true,
    retryable: true,
  },
  PREDICTION_TIMEOUT: {
    code: 'PREDICTION_TIMEOUT',
    userMessage:
      "Your critter is thinking really hard! Let's help it make a guess.",
    recoverable: true,
    retryable: true,
  },
  MEMORY_ERROR: {
    code: 'MEMORY_ERROR',
    userMessage: "Your critter needs a quick rest. Let's restart the game!",
    recoverable: true,
    retryable: false,
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    userMessage:
      'No internet? No problem! Your critter can still play offline.',
    recoverable: true,
    retryable: true,
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    userMessage:
      "Something doesn't look right. Let's try a different approach!",
    recoverable: true,
    retryable: true,
  },
  APP_STATE_ERROR: {
    code: 'APP_STATE_ERROR',
    userMessage:
      'Welcome back! Your critter missed you while the app was away.',
    recoverable: true,
    retryable: false,
  },
  TENSOR_ERROR: {
    code: 'TENSOR_ERROR',
    userMessage: "Your critter got a bit confused. Let's help it focus!",
    recoverable: true,
    retryable: true,
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    userMessage:
      "Something unexpected happened, but don't worry - we can fix it!",
    recoverable: true,
    retryable: true,
  },
}

/**
 * Enhanced error class with context and recovery information
 */
export class GameError extends Error {
  public readonly errorInfo: ErrorInfo
  public readonly originalError?: Error
  public readonly context?: Record<string, unknown>
  public readonly timestamp: number

  constructor(
    type: ErrorType,
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    const errorDef = ERROR_DEFINITIONS[type]
    const message = originalError?.message || `${type} occurred`

    super(message)

    this.name = 'GameError'
    this.errorInfo = {
      ...errorDef,
      message,
    }
    this.originalError = originalError
    this.context = context
    this.timestamp = Date.now()
  }
}

/**
 * Error Handler Class
 * Provides centralized error handling with user-friendly messages and recovery options
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: GameError[] = []
  private readonly MAX_ERROR_LOG_SIZE = 50

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle model loading errors with retry mechanism
   */
  public handleModelLoadError(
    error: Error,
    context?: Record<string, unknown>
  ): GameError {
    const gameError = new GameError('MODEL_LOAD_ERROR', error, context)
    this.logError(gameError)

    console.error('Model loading error:', {
      message: error.message,
      context,
      timestamp: gameError.timestamp,
    })

    return gameError
  }

  /**
   * Handle prediction timeout with fallback mechanism
   */
  public handlePredictionTimeout(context?: Record<string, unknown>): GameError {
    const gameError = new GameError('PREDICTION_TIMEOUT', undefined, context)
    this.logError(gameError)

    console.warn('Prediction timeout occurred:', {
      context,
      timestamp: gameError.timestamp,
    })

    return gameError
  }

  /**
   * Handle memory-related errors
   */
  public handleMemoryError(
    error: Error,
    context?: Record<string, unknown>
  ): GameError {
    const gameError = new GameError('MEMORY_ERROR', error, context)
    this.logError(gameError)

    console.error('Memory error:', {
      message: error.message,
      context,
      timestamp: gameError.timestamp,
    })

    return gameError
  }

  /**
   * Handle app state change errors
   */
  public handleAppStateError(
    error: Error,
    context?: Record<string, unknown>
  ): GameError {
    const gameError = new GameError('APP_STATE_ERROR', error, context)
    this.logError(gameError)

    console.warn('App state error:', {
      message: error.message,
      context,
      timestamp: gameError.timestamp,
    })

    return gameError
  }

  /**
   * Handle tensor operation errors
   */
  public handleTensorError(
    error: Error,
    context?: Record<string, unknown>
  ): GameError {
    const gameError = new GameError('TENSOR_ERROR', error, context)
    this.logError(gameError)

    console.error('Tensor operation error:', {
      message: error.message,
      context,
      timestamp: gameError.timestamp,
    })

    return gameError
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(
    error: Error,
    context?: Record<string, unknown>
  ): GameError {
    const gameError = new GameError('VALIDATION_ERROR', error, context)
    this.logError(gameError)

    console.warn('Validation error:', {
      message: error.message,
      context,
      timestamp: gameError.timestamp,
    })

    return gameError
  }

  /**
   * Handle network-related errors
   */
  public handleNetworkError(
    error: Error,
    context?: Record<string, unknown>
  ): GameError {
    const gameError = new GameError('NETWORK_ERROR', error, context)
    this.logError(gameError)

    console.warn('Network error:', {
      message: error.message,
      context,
      timestamp: gameError.timestamp,
    })

    return gameError
  }

  /**
   * Handle unknown errors
   */
  public handleUnknownError(
    error: Error,
    context?: Record<string, unknown>
  ): GameError {
    const gameError = new GameError('UNKNOWN_ERROR', error, context)
    this.logError(gameError)

    console.error('Unknown error:', {
      message: error.message,
      context,
      timestamp: gameError.timestamp,
    })

    return gameError
  }

  /**
   * Show user-friendly error message with optional retry action
   */
  public showUserFriendlyError(
    gameError: GameError,
    onRetry?: () => void,
    onCancel?: () => void
  ): void {
    const { errorInfo } = gameError

    if (errorInfo.retryable && onRetry) {
      Alert.alert(
        'Oops!',
        errorInfo.userMessage,
        [
          {
            text: 'Try Again',
            onPress: onRetry,
            style: 'default',
          },
          {
            text: 'Cancel',
            onPress: onCancel,
            style: 'cancel',
          },
        ],
        { cancelable: false }
      )
    } else {
      Alert.alert(
        'Oops!',
        errorInfo.userMessage,
        [
          {
            text: 'OK',
            onPress: onCancel,
            style: 'default',
          },
        ],
        { cancelable: false }
      )
    }
  }

  /**
   * Get recovery suggestions for an error
   */
  public getRecoverySuggestions(gameError: GameError): string[] {
    const { errorInfo } = gameError
    const suggestions: string[] = []

    switch (errorInfo.code) {
      case 'MODEL_LOAD_ERROR':
        suggestions.push('Check your internet connection')
        suggestions.push('Restart the app')
        suggestions.push('Try again in a few moments')
        break

      case 'PREDICTION_TIMEOUT':
        suggestions.push('The image will be skipped automatically')
        suggestions.push('Try with a different image')
        break

      case 'MEMORY_ERROR':
        suggestions.push('Close other apps to free up memory')
        suggestions.push('Restart the game')
        break

      case 'APP_STATE_ERROR':
        suggestions.push('The game will resume automatically')
        suggestions.push('Your progress has been saved')
        break

      case 'TENSOR_ERROR':
        suggestions.push('Try with a different image')
        suggestions.push('Restart the current phase')
        break

      default:
        suggestions.push('Try restarting the game')
        suggestions.push('Contact support if the problem persists')
    }

    return suggestions
  }

  /**
   * Check if error is recoverable
   */
  public isRecoverable(gameError: GameError): boolean {
    return gameError.errorInfo.recoverable
  }

  /**
   * Check if error is retryable
   */
  public isRetryable(gameError: GameError): boolean {
    return gameError.errorInfo.retryable
  }

  /**
   * Log error to internal error log
   */
  private logError(gameError: GameError): void {
    this.errorLog.push(gameError)

    // Keep log size manageable
    if (this.errorLog.length > this.MAX_ERROR_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(-this.MAX_ERROR_LOG_SIZE)
    }
  }

  /**
   * Get recent errors for debugging
   */
  public getRecentErrors(count: number = 10): GameError[] {
    return this.errorLog.slice(-count)
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {}

    this.errorLog.forEach((error) => {
      const code = error.errorInfo.code
      stats[code] = (stats[code] || 0) + 1
    })

    return stats
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()
