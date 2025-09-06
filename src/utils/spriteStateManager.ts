/**
 * Sprite State Manager
 * Manages critter sprite states and transitions with validation
 */

import { CritterState } from '@types/coreTypes';
import {
  getSpriteForState,
  hasSprite,
  SpriteMetadata,
} from '@assets/index';

/**
 * Sprite State Manager Class
 * Provides utilities for managing critter sprite states and transitions
 */
export class SpriteStateManager {
  private static currentState: CritterState = 'IDLE';
  private static stateHistory: CritterState[] = [];
  private static maxHistoryLength = 10;

  /**
   * Get the current critter state
   * @returns Current CritterState
   */
  static getCurrentState(): CritterState {
    return this.currentState;
  }

  /**
   * Set the current critter state with validation
   * @param newState New CritterState to set
   * @returns True if state was successfully set
   */
  static setState(newState: CritterState): boolean {
    if (!hasSprite(newState)) {
      console.warn(`Invalid critter state: ${newState}`);
      return false;
    }

    // Add current state to history before changing
    this.addToHistory(this.currentState);
    this.currentState = newState;

    if (__DEV__) {
      console.log(
        `[SpriteStateManager] State changed to: ${newState}`
      );
    }

    return true;
  }

  /**
   * Get the sprite asset for the current state
   * @returns Sprite asset
   */
  static getCurrentSprite() {
    return getSpriteForState(this.currentState);
  }

  /**
   * Get the sprite asset for a specific state
   * @param state CritterState
   * @returns Sprite asset
   */
  static getSpriteForState(state: CritterState) {
    return getSpriteForState(state);
  }

  /**
   * Get the previous state from history
   * @returns Previous CritterState or null if no history
   */
  static getPreviousState(): CritterState | null {
    return this.stateHistory.length > 0
      ? this.stateHistory[this.stateHistory.length - 1]
      : null;
  }

  /**
   * Revert to the previous state
   * @returns True if successfully reverted
   */
  static revertToPreviousState(): boolean {
    const previousState = this.stateHistory.pop();
    if (previousState) {
      this.currentState = previousState;
      if (__DEV__) {
        console.log(
          `[SpriteStateManager] Reverted to state: ${previousState}`
        );
      }
      return true;
    }
    return false;
  }

  /**
   * Get state history
   * @returns Array of previous states
   */
  static getStateHistory(): CritterState[] {
    return [...this.stateHistory];
  }

  /**
   * Clear state history
   */
  static clearHistory(): void {
    this.stateHistory = [];
  }

  /**
   * Get metadata for a specific state
   * @param state CritterState
   * @returns State metadata
   */
  static getStateMetadata(state: CritterState) {
    return SpriteMetadata[state];
  }

  /**
   * Validate a state transition
   * @param fromState Current state
   * @param toState Target state
   * @returns True if transition is valid
   */
  static isValidTransition(
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
    };

    return validTransitions[fromState]?.includes(toState) ?? false;
  }

  /**
   * Attempt a state transition with validation
   * @param newState Target state
   * @param force Force transition even if invalid
   * @returns True if transition was successful
   */
  static transitionTo(
    newState: CritterState,
    force: boolean = false
  ): boolean {
    if (
      !force &&
      !this.isValidTransition(this.currentState, newState)
    ) {
      console.warn(
        `Invalid state transition from ${this.currentState} to ${newState}`
      );
      return false;
    }

    return this.setState(newState);
  }

  /**
   * Get suggested next states based on current state
   * @returns Array of valid next states
   */
  static getSuggestedNextStates(): CritterState[] {
    const transitions: Record<CritterState, CritterState[]> = {
      LOADING_MODEL: ['IDLE'],
      IDLE: ['THINKING'],
      THINKING: ['HAPPY', 'CONFUSED'],
      HAPPY: ['IDLE', 'THINKING'],
      CONFUSED: ['IDLE', 'THINKING'],
    };

    return transitions[this.currentState] || [];
  }

  /**
   * Reset to initial state
   */
  static reset(): void {
    this.currentState = 'IDLE';
    this.clearHistory();
    if (__DEV__) {
      console.log('[SpriteStateManager] Reset to initial state');
    }
  }

  /**
   * Add state to history (private method)
   * @param state State to add to history
   */
  private static addToHistory(state: CritterState): void {
    this.stateHistory.push(state);

    // Limit history length
    if (this.stateHistory.length > this.maxHistoryLength) {
      this.stateHistory.shift();
    }
  }

  /**
   * Get debug information
   * @returns Debug info object
   */
  static getDebugInfo() {
    return {
      currentState: this.currentState,
      stateHistory: this.stateHistory,
      suggestedNextStates: this.getSuggestedNextStates(),
      hasSprite: hasSprite(this.currentState),
    };
  }
}
