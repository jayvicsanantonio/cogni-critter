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
  return CritterSprites[state];
};

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
  accent: '#A2E85B',
  secondary: '#4D96FF',
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
