import { CritterState } from '../types/coreTypes';

/**
 * Asset paths for critter sprites
 * All sprites are grayscale and will be tinted with user's chosen color
 */
export const CRITTER_SPRITES = {
  LOADING_MODEL: require('../../assets/images/critter_thinking_grayscale.png'),
  IDLE: require('../../assets/images/critter_idle_grayscale.png'),
  THINKING: require('../../assets/images/critter_thinking_grayscale.png'),
  HAPPY: require('../../assets/images/critter_happy_grayscale.png'),
  CONFUSED: require('../../assets/images/critter_confused_grayscale.png'),
} as const;

/**
 * Color palette for the app
 */
export const COLORS = {
  // Critter color options
  COGNI_GREEN: '#A2E85B',
  SPARK_BLUE: '#4D96FF',
  GLOW_YELLOW: '#FFD644',
  ACTION_PINK: '#F037A5',
  WHITE: '#FFFFFF',
  
  // UI colors
  DEEP_SPACE_NAVY: '#0B132B',
  BRIGHT_CLOUD: '#F5F5F5',
} as const;

/**
 * Get the sprite source for a given critter state
 * @param state The critter state
 * @returns The require() result for the sprite image
 */
export const getCritterSprite = (state: CritterState) => {
  return CRITTER_SPRITES[state];
};

/**
 * Get hex color code for critter color name
 * @param colorName The color name (e.g., 'cogni-green')
 * @returns Hex color code
 */
export const getCritterColor = (colorName: string): string => {
  switch (colorName) {
    case 'cogni-green':
      return COLORS.COGNI_GREEN;
    case 'spark-blue':
      return COLORS.SPARK_BLUE;
    case 'glow-yellow':
      return COLORS.GLOW_YELLOW;
    case 'action-pink':
      return COLORS.ACTION_PINK;
    case 'white':
      return COLORS.WHITE;
    default:
      return COLORS.COGNI_GREEN; // Default fallback
  }
};

/**
 * Sample image dataset for apple/not-apple classification
 * In a real implementation, these would be actual image files
 */
export const SAMPLE_IMAGES = {
  APPLES: [
    { id: 'apple_1', uri: 'https://example.com/red_apple.jpg', label: 'apple' as const },
    { id: 'apple_2', uri: 'https://example.com/green_apple.jpg', label: 'apple' as const },
    { id: 'apple_3', uri: 'https://example.com/yellow_apple.jpg', label: 'apple' as const },
    { id: 'apple_4', uri: 'https://example.com/apple_slice.jpg', label: 'apple' as const },
    { id: 'apple_5', uri: 'https://example.com/apple_tree.jpg', label: 'apple' as const },
  ],
  NOT_APPLES: [
    { id: 'orange_1', uri: 'https://example.com/orange.jpg', label: 'not_apple' as const },
    { id: 'banana_1', uri: 'https://example.com/banana.jpg', label: 'not_apple' as const },
    { id: 'car_1', uri: 'https://example.com/car.jpg', label: 'not_apple' as const },
    { id: 'dog_1', uri: 'https://example.com/dog.jpg', label: 'not_apple' as const },
    { id: 'house_1', uri: 'https://example.com/house.jpg', label: 'not_apple' as const },
  ],
} as const;

/**
 * Get a mixed array of sample images for training/testing
 * @param count Number of images to return
 * @returns Array of sample images
 */
export const getSampleImages = (count: number = 10) => {
  const allImages = [...SAMPLE_IMAGES.APPLES, ...SAMPLE_IMAGES.NOT_APPLES];
  
  // Shuffle array and return requested count
  const shuffled = allImages.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};