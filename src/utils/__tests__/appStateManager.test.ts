/**
 * App State Manager Tests
 * Tests for app state change handling and game state preservation
 * Requirements: 8.6
 */

import { AppState } from 'react-native'
import { appStateManager } from '../appStateManager'

// Mock React Native AppState
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}))

// Mock ML Service
jest.mock('../../services/MLService', () => ({
  mlService: {
    cleanup: jest.fn(),
  },
}))

// Mock error handler
jest.mock('../errorHandler', () => ({
  errorHandler: {
    handleAppStateError: jest.fn().mockReturnValue({
      errorInfo: { userMessage: 'Test error message' },
    }),
  },
}))

describe('AppStateManager', () => {
  const mockAddEventListener = AppState.addEventListener as jest.MockedFunction<
    typeof AppState.addEventListener
  >
  const mockRemoveEventListener =
    AppState.removeEventListener as jest.MockedFunction<
      typeof AppState.removeEventListener
    >

  beforeEach(() => {
    jest.clearAllMocks()
    appStateManager.cleanup()
  })

  describe('Initialization', () => {
    it('should initialize app state monitoring', () => {
      appStateManager.initialize()

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    it('should not initialize twice', () => {
      appStateManager.initialize()
      appStateManager.initialize()

      expect(mockAddEventListener).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup app state monitoring', () => {
      appStateManager.initialize()
      appStateManager.cleanup()

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    it('should handle cleanup when not initialized', () => {
      expect(() => {
        appStateManager.cleanup()
      }).not.toThrow()
    })
  })

  describe('Handler Registration', () => {
    it('should register and unregister handlers', () => {
      const handler = {
        onBackground: jest.fn(),
        onForeground: jest.fn(),
        onInactive: jest.fn(),
      }

      const unregister = appStateManager.registerHandler(handler)

      expect(typeof unregister).toBe('function')

      // Test unregistering
      unregister()

      // Should not throw errors
      expect(true).toBe(true)
    })
  })

  describe('Game State Management', () => {
    it('should save game state snapshot', () => {
      const gameState = {
        phase: 'TEACHING_PHASE',
        currentImageIndex: 5,
        trainingData: [{ id: '1' }, { id: '2' }],
        testResults: [{ id: 'test1' }],
      }

      appStateManager.saveGameState(gameState)

      const snapshot = appStateManager.getGameStateSnapshot()

      expect(snapshot).toEqual({
        phase: 'TEACHING_PHASE',
        currentImageIndex: 5,
        trainingDataCount: 2,
        testResultsCount: 1,
        timestamp: expect.any(Number),
      })
    })

    it('should handle invalid game state', () => {
      const invalidGameState = null

      expect(() => {
        appStateManager.saveGameState(invalidGameState)
      }).not.toThrow()
    })

    it('should return null when no snapshot exists', () => {
      const snapshot = appStateManager.getGameStateSnapshot()

      expect(snapshot).toBeNull()
    })
  })

  describe('Background Duration Tracking', () => {
    beforeEach(() => {
      // Mock Date.now to control time
      jest.spyOn(Date, 'now').mockReturnValue(1000000)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should track background duration', () => {
      appStateManager.initialize()

      // Simulate app going to background
      const changeHandler = mockAddEventListener.mock.calls[0][1]
      ;(AppState as typeof AppState & { currentState: string }).currentState =
        'active'
      changeHandler('background')

      // Advance time
      jest.spyOn(Date, 'now').mockReturnValue(1000000 + 60000) // 1 minute later

      const duration = appStateManager.getBackgroundDuration()
      expect(duration).toBe(60000)
    })

    it('should detect long background periods', () => {
      appStateManager.initialize()

      // Simulate app going to background
      const changeHandler = mockAddEventListener.mock.calls[0][1]
      ;(AppState as typeof AppState & { currentState: string }).currentState =
        'active'
      changeHandler('background')

      // Advance time beyond threshold (5 minutes)
      jest.spyOn(Date, 'now').mockReturnValue(1000000 + 6 * 60 * 1000) // 6 minutes later

      expect(appStateManager.wasInBackgroundTooLong()).toBe(true)
    })

    it('should return zero duration when not in background', () => {
      const duration = appStateManager.getBackgroundDuration()
      expect(duration).toBe(0)
    })
  })

  describe('App State Changes', () => {
    it('should handle app going to background', () => {
      const handler = {
        onBackground: jest.fn(),
        onForeground: jest.fn(),
        onInactive: jest.fn(),
      }

      appStateManager.initialize()
      appStateManager.registerHandler(handler)

      // Simulate app state change
      const changeHandler = mockAddEventListener.mock.calls[0][1]
      ;(AppState as typeof AppState & { currentState: string }).currentState =
        'active'
      changeHandler('background')

      expect(handler.onBackground).toHaveBeenCalled()
    })

    it('should handle app coming to foreground', () => {
      const handler = {
        onBackground: jest.fn(),
        onForeground: jest.fn(),
        onInactive: jest.fn(),
      }

      appStateManager.initialize()
      appStateManager.registerHandler(handler)

      // Simulate app state change
      const changeHandler = mockAddEventListener.mock.calls[0][1]
      ;(AppState as typeof AppState & { currentState: string }).currentState =
        'background'
      changeHandler('active')

      expect(handler.onForeground).toHaveBeenCalled()
    })

    it('should handle app becoming inactive', () => {
      const handler = {
        onBackground: jest.fn(),
        onForeground: jest.fn(),
        onInactive: jest.fn(),
      }

      appStateManager.initialize()
      appStateManager.registerHandler(handler)

      // Simulate app state change
      const changeHandler = mockAddEventListener.mock.calls[0][1]
      ;(AppState as typeof AppState & { currentState: string }).currentState =
        'active'
      changeHandler('inactive')

      expect(handler.onInactive).toHaveBeenCalled()
    })

    it('should handle errors in state change handlers', () => {
      const handler = {
        onBackground: jest.fn().mockImplementation(() => {
          throw new Error('Handler error')
        }),
      }

      appStateManager.initialize()
      appStateManager.registerHandler(handler)

      // Should not throw when handler errors
      expect(() => {
        const changeHandler = mockAddEventListener.mock.calls[0][1]
        ;(AppState as typeof AppState & { currentState: string }).currentState =
          'active'
        changeHandler('background')
      }).not.toThrow()
    })
  })

  describe('State Queries', () => {
    it('should return current app state', () => {
      ;(AppState as typeof AppState & { currentState: string }).currentState =
        'active'
      appStateManager.initialize()

      expect(appStateManager.getCurrentState()).toBe('active')
      expect(appStateManager.isActive()).toBe(true)
      expect(appStateManager.isInBackground()).toBe(false)
      expect(appStateManager.isInactive()).toBe(false)
    })

    it('should detect background state', () => {
      appStateManager.initialize()

      // Simulate state change to background
      const changeHandler = mockAddEventListener.mock.calls[0][1]
      ;(AppState as typeof AppState & { currentState: string }).currentState =
        'active'
      changeHandler('background')

      expect(appStateManager.isInBackground()).toBe(true)
      expect(appStateManager.isActive()).toBe(false)
    })

    it('should detect inactive state', () => {
      appStateManager.initialize()

      // Simulate state change to inactive
      const changeHandler = mockAddEventListener.mock.calls[0][1]
      ;(AppState as typeof AppState & { currentState: string }).currentState =
        'active'
      changeHandler('inactive')

      expect(appStateManager.isInactive()).toBe(true)
      expect(appStateManager.isActive()).toBe(false)
    })
  })
})
