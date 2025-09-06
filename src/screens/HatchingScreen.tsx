/**
 * HatchingScreen Component
 * First-time user experience for critter personalization
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ViewStyle,
  TextStyle,
  Alert,
  Animated,
} from 'react-native';
import { CritterColor } from '@types/coreTypes';
import { HatchingScreenProps } from '@types/uiTypes';
import { AnimatedCritter } from '@components/AnimatedCritter';
import { ColorPicker } from '@components/ColorPicker';
import { AppColors } from '@assets/index';
import { UserPreferencesService } from '@services/UserPreferencesService';

/**
 * HatchingScreen Component
 *
 * Features:
 * - Live preview of CogniCritter with selected color
 * - Color selection interface with predefined options
 * - "Start Game" button to proceed to gameplay
 * - Child-friendly design with rounded corners and soft shadows
 * - Accessibility support for screen readers
 */
export const HatchingScreen: React.FC<HatchingScreenProps> = ({
  navigation,
}) => {
  const [selectedColor, setSelectedColor] =
    useState<CritterColor>('Cogni Green');
  const [isStarting, setIsStarting] = useState(false);

  // Animation values for smooth transition
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleStartGame = async () => {
    try {
      setIsStarting(true);

      // Start transition animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Save the selected color and mark user as no longer first-time
      await UserPreferencesService.completeFirstTimeSetup(
        selectedColor
      );

      // Small delay for smooth transition feel
      setTimeout(() => {
        // Navigate to GameScreen with selected critter color
        navigation.navigate('GameScreen', {
          critterColor: selectedColor,
        });
      }, 400);
    } catch (error) {
      console.error('Error starting game:', error);

      // Reset animations on error
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert(
        'Error',
        'There was a problem saving your preferences. Please try again.',
        [{ text: 'OK' }]
      );
      setIsStarting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Hatch Your Critter!</Text>
          <Text style={styles.subtitle}>
            Choose a color to personalize your AI learning companion
          </Text>
        </View>

        {/* Critter Preview */}
        <View style={styles.critterPreview}>
          <AnimatedCritter
            state="IDLE"
            critterColor={selectedColor}
          />
        </View>

        {/* Color Selection */}
        <View style={styles.colorSection}>
          <ColorPicker
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
          />
        </View>

        {/* Start Game Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.startButton,
              isStarting && styles.startButtonDisabled,
            ]}
            onPress={handleStartGame}
            disabled={isStarting}
            accessibilityRole="button"
            accessibilityLabel="Start Game"
            accessibilityHint="Begin playing the Sorter Machine game with your personalized critter"
          >
            <Text style={styles.startButtonText}>
              {isStarting ? 'Starting...' : 'Start Game'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  } as ViewStyle,
  header: {
    alignItems: 'center',
    marginTop: 20,
  } as ViewStyle,
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 10,
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  } as TextStyle,
  critterPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 20,
  } as ViewStyle,
  colorSection: {
    marginVertical: 20,
  } as ViewStyle,
  buttonSection: {
    alignItems: 'center',
    marginBottom: 20,
  } as ViewStyle,
  startButton: {
    backgroundColor: AppColors.accent,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
    // Soft shadow for tactile feel
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  } as ViewStyle,
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.deepSpaceNavy,
  } as TextStyle,
  startButtonDisabled: {
    opacity: 0.6,
  } as ViewStyle,
});
