/**
 * Error Handler Tests
 * Tests for error handling and recovery mechanisms
 * Requirements: 1.8, 3.3
 */

import {
  errorHandler,
  GameError,
  ErrorHandler,
} from '../errorHandler';

// Mock React Native Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    // Clear error log before each test
    errorHandler.clearErrorLog();
  });

  describe('Model Loading Errors', () => {
    it('should handle model loading errors with retry information', () => {
      const originalError = new Error('Network timeout');
      const context = { attempt: 1, maxAttempts: 3 };

      const gameError = errorHandler.handleModelLoadError(
        originalError,
        context
      );

      expect(gameError).toBeInstanceOf(GameError);
      expect(gameError.errorInfo.code).toBe('MODEL_LOAD_ERROR');
      expect(gameError.errorInfo.retryable).toBe(true);
      expect(gameError.errorInfo.recoverable).toBe(true);
      expect(gameError.originalError).toBe(originalError);
      expect(gameError.context).toEqual(context);
    });

    it('should provide user-friendly message for model loading errors', () => {
      const originalError = new Error('Model file not found');
      const gameError =
        errorHandler.handleModelLoadError(originalError);

      expect(gameError.errorInfo.userMessage).toBe(
        "Oops! Your critter is having trouble waking up. Let's try again!"
      );
    });

    it('should log model loading errors', () => {
      const originalError = new Error('Connection failed');
      errorHandler.handleModelLoadError(originalError);

      const recentErrors = errorHandler.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].errorInfo.code).toBe('MODEL_LOAD_ERROR');
    });
  });

  describe('Prediction Timeout Errors', () => {
    it('should handle prediction timeouts', () => {
      const context = { imageUri: 'test.jpg', timeoutMs: 1000 };
      const gameError = errorHandler.handlePredictionTimeout(context);

      expect(gameError.errorInfo.code).toBe('PREDICTION_TIMEOUT');
      expect(gameError.errorInfo.retryable).toBe(true);
      expect(gameError.context).toEqual(context);
    });

    it('should provide appropriate user message for prediction timeouts', () => {
      const gameError = errorHandler.handlePredictionTimeout();

      expect(gameError.errorInfo.userMessage).toBe(
        "Your critter is thinking really hard! Let's help it make a guess."
      );
    });
  });

  describe('Memory Errors', () => {
    it('should handle memory errors', () => {
      const originalError = new Error('Out of memory');
      const context = { tensors: 150, bytes: 200000000 };

      const gameError = errorHandler.handleMemoryError(
        originalError,
        context
      );

      expect(gameError.errorInfo.code).toBe('MEMORY_ERROR');
      expect(gameError.errorInfo.recoverable).toBe(true);
      expect(gameError.errorInfo.retryable).toBe(false);
    });

    it('should suggest restart for memory errors', () => {
      const originalError = new Error('Memory leak detected');
      const gameError = errorHandler.handleMemoryError(originalError);

      expect(gameError.errorInfo.userMessage).toBe(
        "Your critter needs a quick rest. Let's restart the game!"
      );
    });
  });

  describe('App State Errors', () => {
    it('should handle app state change errors', () => {
      const originalError = new Error('State transition failed');
      const context = {
        currentState: 'active',
        nextState: 'background',
      };

      const gameError = errorHandler.handleAppStateError(
        originalError,
        context
      );

      expect(gameError.errorInfo.code).toBe('APP_STATE_ERROR');
      expect(gameError.context).toEqual(context);
    });
  });

  describe('Tensor Errors', () => {
    it('should handle tensor operation errors', () => {
      const originalError = new Error('Invalid tensor shape');
      const context = {
        operation: 'reshape',
        shape: [1, 224, 224, 3],
      };

      const gameError = errorHandler.handleTensorError(
        originalError,
        context
      );

      expect(gameError.errorInfo.code).toBe('TENSOR_ERROR');
      expect(gameError.errorInfo.retryable).toBe(true);
    });
  });

  describe('Recovery Suggestions', () => {
    it('should provide recovery suggestions for model loading errors', () => {
      const gameError = errorHandler.handleModelLoadError(
        new Error('Test')
      );
      const suggestions =
        errorHandler.getRecoverySuggestions(gameError);

      expect(suggestions).toContain('Check your internet connection');
      expect(suggestions).toContain('Restart the app');
      expect(suggestions).toContain('Try again in a few moments');
    });

    it('should provide recovery suggestions for prediction timeouts', () => {
      const gameError = errorHandler.handlePredictionTimeout();
      const suggestions =
        errorHandler.getRecoverySuggestions(gameError);

      expect(suggestions).toContain(
        'The image will be skipped automatically'
      );
      expect(suggestions).toContain('Try with a different image');
    });

    it('should provide recovery suggestions for memory errors', () => {
      const gameError = errorHandler.handleMemoryError(
        new Error('Test')
      );
      const suggestions =
        errorHandler.getRecoverySuggestions(gameError);

      expect(suggestions).toContain(
        'Close other apps to free up memory'
      );
      expect(suggestions).toContain('Restart the game');
    });
  });

  describe('Error Statistics', () => {
    it('should track error statistics', () => {
      errorHandler.handleModelLoadError(new Error('Test 1'));
      errorHandler.handleModelLoadError(new Error('Test 2'));
      errorHandler.handlePredictionTimeout();

      const stats = errorHandler.getErrorStats();

      expect(stats['MODEL_LOAD_ERROR']).toBe(2);
      expect(stats['PREDICTION_TIMEOUT']).toBe(1);
    });

    it('should maintain error log size limit', () => {
      // Generate more errors than the limit
      for (let i = 0; i < 60; i++) {
        errorHandler.handleUnknownError(new Error(`Test ${i}`));
      }

      const recentErrors = errorHandler.getRecentErrors(100);
      expect(recentErrors.length).toBeLessThanOrEqual(50); // MAX_ERROR_LOG_SIZE
    });
  });

  describe('User-Friendly Error Display', () => {
    it('should show retryable errors with retry option', () => {
      const { Alert } = require('react-native');
      const mockOnRetry = jest.fn();
      const mockOnCancel = jest.fn();

      const gameError = errorHandler.handleModelLoadError(
        new Error('Test')
      );
      errorHandler.showUserFriendlyError(
        gameError,
        mockOnRetry,
        mockOnCancel
      );

      expect(Alert.alert).toHaveBeenCalledWith(
        'Oops!',
        gameError.errorInfo.userMessage,
        [
          {
            text: 'Try Again',
            onPress: mockOnRetry,
            style: 'default',
          },
          {
            text: 'Cancel',
            onPress: mockOnCancel,
            style: 'cancel',
          },
        ],
        { cancelable: false }
      );
    });

    it('should show non-retryable errors with OK button only', () => {
      const { Alert } = require('react-native');
      const mockOnCancel = jest.fn();

      const gameError = errorHandler.handleMemoryError(
        new Error('Test')
      );
      errorHandler.showUserFriendlyError(
        gameError,
        undefined,
        mockOnCancel
      );

      expect(Alert.alert).toHaveBeenCalledWith(
        'Oops!',
        gameError.errorInfo.userMessage,
        [
          {
            text: 'OK',
            onPress: mockOnCancel,
            style: 'default',
          },
        ],
        { cancelable: false }
      );
    });
  });

  describe('Error Classification', () => {
    it('should correctly identify recoverable errors', () => {
      const recoverableError = errorHandler.handleModelLoadError(
        new Error('Test')
      );
      const nonRecoverableError = errorHandler.handleUnknownError(
        new Error('Test')
      );

      expect(errorHandler.isRecoverable(recoverableError)).toBe(true);
      expect(errorHandler.isRecoverable(nonRecoverableError)).toBe(
        true
      ); // UNKNOWN_ERROR is recoverable
    });

    it('should correctly identify retryable errors', () => {
      const retryableError = errorHandler.handleModelLoadError(
        new Error('Test')
      );
      const nonRetryableError = errorHandler.handleMemoryError(
        new Error('Test')
      );

      expect(errorHandler.isRetryable(retryableError)).toBe(true);
      expect(errorHandler.isRetryable(nonRetryableError)).toBe(false);
    });
  });
});
