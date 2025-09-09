/**
 * Core Type Definitions
 * Essential types used throughout the application
 */

/**
 * Critter emotional and functional states
 */
export type CritterState =
  | 'LOADING_MODEL' // When TensorFlow model is loading
  | 'IDLE' // Default state, waiting for user input
  | 'THINKING' // Processing ML prediction
  | 'HAPPY' // Correct prediction made
  | 'CONFUSED' // Incorrect prediction made

/**
 * ML Classification result as confidence scores
 * [apple_confidence, not_apple_confidence]
 * Values range from 0 to 1, sum should equal 1
 */
export type ClassificationResult = [number, number]

/**
 * Available critter colors for personalization
 */
export type CritterColor =
  | 'Cogni Green' // #A2E85B
  | 'Spark Blue' // #4D96FF
  | 'Glow Yellow' // #FFD644
  | 'Action Pink' // #F037A5
  | 'White' // #FFFFFF

/**
 * Image classification labels
 */
export type ImageLabel = 'apple' | 'not_apple'

/**
 * Game phase progression
 */
export type GamePhase =
  | 'INITIALIZING' // App startup
  | 'LOADING_MODEL' // TensorFlow model loading
  | 'TEACHING_PHASE' // User teaches by sorting images
  | 'TRAINING_MODEL' // AI trains on user's examples
  | 'TESTING_PHASE' // AI attempts to classify images
  | 'RESULTS_SUMMARY' // Show final results and insights
