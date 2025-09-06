/**
 * Asset Management System
 * Central location for all app assets including sprites and images
 */

import { CritterState } from '@types/coreTypes';

/**
 * Critter sprite assets (grayscale for color tinting)
 */
export const CritterSprites = {
  LOADING_MODEL: require('./critter_thinking_grayscale.png'),
  IDLE: require('./critter_idle_grayscale.png'),
  THINKING: require('./critter_thinking_grayscale.png'),
  HAPPY: require('./critter_happy_grayscale.png'),
  CONFUSED: require('./critter_confused_grayscale.png'),
} as const;

/**
 * Get sprite asset for a given critter state
 * @param state CritterState
 * @returns Asset require statement
 */
export const getSpriteForState = (state: CritterState) => {
  const sprite = CritterSprites[state];
  if (!sprite) {
    console.warn(
      `No sprite found for state: ${state}, falling back to IDLE`
    );
    return CritterSprites.IDLE;
  }
  return sprite;
};

/**
 * Validate if a critter state has a corresponding sprite
 * @param state CritterState to validate
 * @returns True if sprite exists for the state
 */
export const hasSprite = (state: CritterState): boolean => {
  return state in CritterSprites;
};

/**
 * Get all available critter states that have sprites
 * @returns Array of CritterState values
 */
export const getAvailableStates = (): CritterState[] => {
  return Object.keys(CritterSprites) as CritterState[];
};

/**
 * Sprite metadata for debugging and development
 */
export const SpriteMetadata = {
  LOADING_MODEL: {
    description: 'Displayed when TensorFlow model is loading',
    expectedUsage: 'App initialization phase',
    sprite: 'critter_thinking_grayscale.png',
  },
  IDLE: {
    description: 'Default state, waiting for user input',
    expectedUsage: 'Teaching phase, between interactions',
    sprite: 'critter_idle_grayscale.png',
  },
  THINKING: {
    description: 'Processing ML prediction',
    expectedUsage: 'Testing phase during image classification',
    sprite: 'critter_thinking_grayscale.png',
  },
  HAPPY: {
    description: 'Correct prediction made',
    expectedUsage: 'Testing phase after successful classification',
    sprite: 'critter_happy_grayscale.png',
  },
  CONFUSED: {
    description: 'Incorrect prediction made',
    expectedUsage: 'Testing phase after failed classification',
    sprite: 'critter_confused_grayscale.png',
  },
} as const;

/**
 * Color palette for critter personalization
 */
export const CritterColors = {
  'Cogni Green': '#A2E85B',
  'Spark Blue': '#4D96FF',
  'Glow Yellow': '#FFD644',
  'Action Pink': '#F037A5',
  White: '#FFFFFF',
} as const;

/**
 * App color theme
 */
export const AppColors = {
  // Primary colors
  cogniGreen: '#A2E85B',
  sparkBlue: '#4D96FF',
  glowYellow: '#FFD644',
  actionPink: '#F037A5',

  // Neutral colors
  deepSpaceNavy: '#0B132B',
  brightCloud: '#F5F5F5',

  // Semantic colors
  background: '#0B132B',
  text: '#F5F5F5',
  primary: '#A2E85B',
  accent: '#A2E85B',
  secondary: '#4D96FF',
  surface: 'rgba(245, 245, 245, 0.1)',
} as const;

/**
 * Sample image dataset for apple/not-apple classification
 * In a real app, these would be bundled assets or downloaded content
 */
export const SampleImages = {
  apples: [
    // Placeholder - in real implementation, these would be actual image assets
    {
      id: 'apple_1',
      uri: 'apple_red_1.jpg',
      label: 'apple' as const,
    },
    {
      id: 'apple_2',
      uri: 'apple_green_1.jpg',
      label: 'apple' as const,
    },
    {
      id: 'apple_3',
      uri: 'apple_yellow_1.jpg',
      label: 'apple' as const,
    },
    {
      id: 'apple_4',
      uri: 'apple_red_2.jpg',
      label: 'apple' as const,
    },
    {
      id: 'apple_5',
      uri: 'apple_green_2.jpg',
      label: 'apple' as const,
    },
  ],
  notApples: [
    // Placeholder - in real implementation, these would be actual image assets
    {
      id: 'orange_1',
      uri: 'orange_1.jpg',
      label: 'not_apple' as const,
    },
    {
      id: 'banana_1',
      uri: 'banana_1.jpg',
      label: 'not_apple' as const,
    },
    { id: 'pear_1', uri: 'pear_1.jpg', label: 'not_apple' as const },
    {
      id: 'grape_1',
      uri: 'grape_1.jpg',
      label: 'not_apple' as const,
    },
    {
      id: 'strawberry_1',
      uri: 'strawberry_1.jpg',
      label: 'not_apple' as const,
    },
  ],
} as const;
