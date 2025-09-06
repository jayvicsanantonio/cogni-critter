/**
 * User Preferences Service
 * Handles storage and retrieval of user preferences including first-time user status
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CritterColor } from '@types/coreTypes';

/**
 * Storage keys for user preferences
 */
const STORAGE_KEYS = {
  IS_FIRST_TIME_USER: '@cognicritter:isFirstTimeUser',
  CRITTER_COLOR: '@cognicritter:critterColor',
  USER_PREFERENCES: '@cognicritter:userPreferences',
} as const;

/**
 * User preferences data structure
 */
export interface UserPreferences {
  isFirstTimeUser: boolean;
  critterColor: CritterColor;
  lastPlayedDate?: string;
  gamesPlayed?: number;
}

/**
 * Default user preferences for new users
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  isFirstTimeUser: true,
  critterColor: 'Cogni Green',
  gamesPlayed: 0,
};

/**
 * User Preferences Service
 *
 * Provides methods to:
 * - Check if user is first-time or returning
 * - Store and retrieve critter color preferences
 * - Track user engagement metrics
 * - Handle preference persistence across app sessions
 */
export class UserPreferencesService {
  /**
   * Check if the current user is a first-time user
   * @returns Promise<boolean> True if first-time user, false if returning user
   */
  static async isFirstTimeUser(): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences();
      return preferences.isFirstTimeUser;
    } catch (error) {
      console.error('Error checking first-time user status:', error);
      // Default to first-time user if there's an error
      return true;
    }
  }

  /**
   * Mark user as no longer first-time and save their critter color
   * @param critterColor The selected critter color
   */
  static async completeFirstTimeSetup(
    critterColor: CritterColor
  ): Promise<void> {
    try {
      const preferences: UserPreferences = {
        isFirstTimeUser: false,
        critterColor,
        lastPlayedDate: new Date().toISOString(),
        gamesPlayed: 0,
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(preferences)
      );

      console.log(
        'First-time setup completed with color:',
        critterColor
      );
    } catch (error) {
      console.error('Error completing first-time setup:', error);
      throw new Error('Failed to save user preferences');
    }
  }

  /**
   * Get the user's saved critter color
   * @returns Promise<CritterColor> The saved critter color or default
   */
  static async getCritterColor(): Promise<CritterColor> {
    try {
      const preferences = await this.getUserPreferences();
      return preferences.critterColor;
    } catch (error) {
      console.error('Error getting critter color:', error);
      return DEFAULT_PREFERENCES.critterColor;
    }
  }

  /**
   * Update the user's critter color preference
   * @param critterColor The new critter color
   */
  static async updateCritterColor(
    critterColor: CritterColor
  ): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      const updatedPreferences: UserPreferences = {
        ...preferences,
        critterColor,
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(updatedPreferences)
      );

      console.log('Critter color updated to:', critterColor);
    } catch (error) {
      console.error('Error updating critter color:', error);
      throw new Error('Failed to update critter color');
    }
  }

  /**
   * Increment the games played counter
   */
  static async incrementGamesPlayed(): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      const updatedPreferences: UserPreferences = {
        ...preferences,
        gamesPlayed: (preferences.gamesPlayed || 0) + 1,
        lastPlayedDate: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(updatedPreferences)
      );
    } catch (error) {
      console.error('Error incrementing games played:', error);
    }
  }

  /**
   * Get all user preferences
   * @returns Promise<UserPreferences> Complete user preferences object
   */
  static async getUserPreferences(): Promise<UserPreferences> {
    try {
      const preferencesJson = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_PREFERENCES
      );

      if (preferencesJson) {
        const preferences = JSON.parse(
          preferencesJson
        ) as UserPreferences;
        // Ensure all required fields exist with defaults
        return {
          ...DEFAULT_PREFERENCES,
          ...preferences,
        };
      }

      // Return default preferences for new users
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Reset all user preferences (useful for testing or user reset)
   */
  static async resetUserPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
      console.log('User preferences reset');
    } catch (error) {
      console.error('Error resetting user preferences:', error);
      throw new Error('Failed to reset user preferences');
    }
  }

  /**
   * Check if user preferences exist in storage
   * @returns Promise<boolean> True if preferences exist, false otherwise
   */
  static async hasStoredPreferences(): Promise<boolean> {
    try {
      const preferencesJson = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_PREFERENCES
      );
      return preferencesJson !== null;
    } catch (error) {
      console.error('Error checking stored preferences:', error);
      return false;
    }
  }
}
