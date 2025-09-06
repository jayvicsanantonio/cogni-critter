/**
 * App Navigator
 * Handles conditional routing based on user status (first-time vs returning)
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { HatchingScreen } from './HatchingScreen';
import { GameScreen } from './GameScreen';
import { UserPreferencesService } from '@services/UserPreferencesService';
import { AppColors } from '@assets/index';

/**
 * Navigation parameter types
 */
export type RootStackParamList = {
  HatchingScreen: undefined;
  GameScreen: {
    critterColor?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Loading Screen Component
 * Displayed while checking user preferences
 */
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={AppColors.accent} />
  </View>
);

/**
 * App Navigator Component
 *
 * Features:
 * - Checks user preferences on app startup
 * - Routes first-time users to HatchingScreen
 * - Routes returning users directly to GameScreen with saved color
 * - Handles loading state during preference check
 * - Provides navigation structure for the entire app
 */
export const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const [savedCritterColor, setSavedCritterColor] =
    useState<string>('Cogni Green');

  useEffect(() => {
    checkUserStatus();
  }, []);

  /**
   * Check user status and load preferences
   */
  const checkUserStatus = async () => {
    try {
      setIsLoading(true);

      // Check if user is first-time or returning
      const firstTime =
        await UserPreferencesService.isFirstTimeUser();
      setIsFirstTimeUser(firstTime);

      // If returning user, load their saved critter color
      if (!firstTime) {
        const critterColor =
          await UserPreferencesService.getCritterColor();
        setSavedCritterColor(critterColor);
      }

      console.log('User status checked:', {
        isFirstTime: firstTime,
        savedColor: firstTime ? 'N/A' : savedCritterColor,
      });
    } catch (error) {
      console.error('Error checking user status:', error);
      // Default to first-time user experience on error
      setIsFirstTimeUser(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking preferences
  if (isLoading) {
    return (
      <NavigationContainer>
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Hide navigation header for immersive experience
          gestureEnabled: false, // Disable swipe gestures for controlled flow
          animation: 'fade', // Smooth fade transition between screens
          animationDuration: 500, // Slightly longer for smooth feel
        }}
        initialRouteName={
          isFirstTimeUser ? 'HatchingScreen' : 'GameScreen'
        }
      >
        <Stack.Screen
          name="HatchingScreen"
          component={HatchingScreen}
          options={{
            title: 'Hatch Your Critter',
          }}
        />
        <Stack.Screen
          name="GameScreen"
          component={GameScreen}
          initialParams={{
            critterColor: isFirstTimeUser
              ? undefined
              : savedCritterColor,
          }}
          options={{
            title: 'Sorter Machine',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
});
