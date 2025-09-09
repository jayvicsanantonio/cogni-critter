/**
 * Sprite State Manager
 * Manages critter sprite states and transitions with validation
 */

import { getSpriteForState, hasSprite, SpriteMetadata } from '@assets/index'
import type { CritterState } from '@/types/coreTypes'

// Internal state management
let currentState: CritterState = 'IDLE'
let stateHistory: CritterState[] = []
const maxHistoryLength = 10

/**
 * Add state to history (private function)
 * @param state State to add to history
 */
function addToHistory(state: CritterState): void {
  stateHistory.push(state)

  // Limit history length
  if (stateHistory.length > maxHistoryLength) {
    stateHistory.shift()
  }
}

/**
 * Get the current critter state
 * @returns Current CritterState
 */
export function getCurrentState(): CritterState {
  return currentState
}

/**
 * Set the current critter state with validation
 * @param newState New CritterState to set
 * @returns True if state was successfully set
 */
export function setState(newState: CritterState): boolean {
  if (!hasSprite(newState)) {
    console.warn(`Invalid critter state: ${newState}`)
    return false
  }

  // Add current state to history before changing
  addToHistory(currentState)
  currentState = newState

  if (__DEV__) {
    console.log(`[SpriteStateManager] State changed to: ${newState}`)
  }

  return true
}

/**
 * Get the sprite asset for the current state
 * @returns Sprite asset
 */
export function getCurrentSprite() {
  return getSpriteForState(currentState)
}

/**
 * Get the sprite asset for a specific state
 * @param state CritterState
 * @returns Sprite asset
 */
export function getSpriteForSpecificState(state: CritterState) {
  return getSpriteForState(state)
}

/**
 * Get the previous state from history
 * @returns Previous CritterState or null if no history
 */
export function getPreviousState(): CritterState | null {
  return stateHistory.length > 0 ? stateHistory[stateHistory.length - 1] : null
}

/**
 * Revert to the previous state
 * @returns True if successfully reverted
 */
export function revertToPreviousState(): boolean {
  const previousState = stateHistory.pop()
  if (previousState) {
    currentState = previousState
    if (__DEV__) {
      console.log(`[SpriteStateManager] Reverted to state: ${previousState}`)
    }
    return true
  }
  return false
}

/**
 * Get state history
 * @returns Array of previous states
 */
export function getStateHistory(): CritterState[] {
  return [...stateHistory]
}

/**
 * Clear state history
 */
export function clearHistory(): void {
  stateHistory = []
}

/**
 * Get metadata for a specific state
 * @param state CritterState
 * @returns State metadata
 */
export function getStateMetadata(state: CritterState) {
  return SpriteMetadata[state]
}

/**
 * Validate a state transition
 * @param fromState Current state
 * @param toState Target state
 * @returns True if transition is valid
 */
export function isValidTransition(
  fromState: CritterState,
  toState: CritterState
): boolean {
  // Define valid state transitions based on game flow
  const validTransitions: Record<CritterState, CritterState[]> = {
    LOADING_MODEL: ['IDLE', 'CONFUSED'], // Can go to idle when loaded, or confused if error
    IDLE: ['THINKING', 'LOADING_MODEL'], // Can start thinking or reload model
    THINKING: ['HAPPY', 'CONFUSED', 'IDLE'], // Can succeed, fail, or be interrupted
    HAPPY: ['IDLE', 'THINKING'], // Can return to idle or start new prediction
    CONFUSED: ['IDLE', 'THINKING'], // Can return to idle or try again
  }

  return validTransitions[fromState]?.includes(toState) ?? false
}

/**
 * Attempt a state transition with validation
 * @param newState Target state
 * @param force Force transition even if invalid
 * @returns True if transition was successful
 */
export function transitionTo(
  newState: CritterState,
  force: boolean = false
): boolean {
  if (!force && !isValidTransition(currentState, newState)) {
    console.warn(`Invalid state transition from ${currentState} to ${newState}`)
    return false
  }

  return setState(newState)
}

/**
 * Get suggested next states based on current state
 * @returns Array of valid next states
 */
export function getSuggestedNextStates(): CritterState[] {
  const transitions: Record<CritterState, CritterState[]> = {
    LOADING_MODEL: ['IDLE'],
    IDLE: ['THINKING'],
    THINKING: ['HAPPY', 'CONFUSED'],
    HAPPY: ['IDLE', 'THINKING'],
    CONFUSED: ['IDLE', 'THINKING'],
  }

  return transitions[currentState] || []
}

/**
 * Reset to initial state
 */
export function reset(): void {
  currentState = 'IDLE'
  clearHistory()
  if (__DEV__) {
    console.log('[SpriteStateManager] Reset to initial state')
  }
}

/**
 * Get debug information
 * @returns Debug info object
 */
export function getDebugInfo() {
  return {
    currentState: currentState,
    stateHistory: stateHistory,
    suggestedNextStates: getSuggestedNextStates(),
    hasSprite: hasSprite(currentState),
  }
}

/**
 * Sprite state manager service
 * Provides all sprite state management functions
 */
export const spriteStateManager = {
  getCurrentState,
  setState,
  getCurrentSprite,
  getSpriteForState: getSpriteForSpecificState,
  getPreviousState,
  revertToPreviousState,
  getStateHistory,
  clearHistory,
  getStateMetadata,
  isValidTransition,
  transitionTo,
  getSuggestedNextStates,
  reset,
  getDebugInfo,
}
