/**
 * Critter State Type
 * Represents the different emotional/activity states of the CogniCritter
 */
export type CritterState =
  | 'LOADING_MODEL'  // Displayed while TensorFlow model is loading
  | 'IDLE'           // Default state during teaching phase and waiting
  | 'THINKING'       // Displayed while processing ML predictions
  | 'HAPPY'          // Displayed when critter makes correct predictions
  | 'CONFUSED';      // Displayed when critter makes incorrect predictions

/**
 * Classification Result Type
 * Represents the confidence scores from the ML model
 * [apple_confidence, not_apple_confidence] - values between 0 and 1
 */
export type ClassificationResult = [number, number];

/**
 * Critter Color Type
 * Available color options for personalizing the critter
 */
export type CritterColor = 
  | 'cogni-green'    // #A2E85B
  | 'spark-blue'     // #4D96FF
  | 'glow-yellow'    // #FFD644
  | 'action-pink'    // #F037A5
  | 'white';         // #FFFFFF

/**
 * Game Phase Type
 * Represents the different phases of the game flow
 */
export type GamePhase = 
  | 'INITIALIZING'
  | 'LOADING_MODEL'
  | 'TEACHING_PHASE'
  | 'TESTING_PHASE'
  | 'RESULTS_SUMMARY';

/**
 * Image Label Type
 * The two classification categories for the sorter machine
 */
export type ImageLabel = 'apple' | 'not_apple';