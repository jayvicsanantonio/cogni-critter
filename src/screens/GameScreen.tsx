/**
 * GameScreen Component (Placeholder)
 * Main game screen - will be implemented in later tasks
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import { GameScreenProps } from '@types/uiTypes';
import { AppColors } from '@assets/index';
import { AnimatedCritter } from '@components/AnimatedCritter';
import { UserPreferencesService } from '@services/UserPreferencesService';

/**
 * GameScreen Component (Placeholder)
 *
 * This is a temporary placeholder that will be fully implemented
 * in later tasks. Currently shows the critter with the selected color.
 */
export const GameScreen: React.FC<GameScreenProps> = ({ route }) => {
  const [critterColor, setCritterColor] = useState(
    route.params?.critterColor || 'Cogni Green'
  );

  // Animation values for smooth entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Load saved critter color if not provided via navigation params
    const loadCritterColor = async () => {
      if (!route.params?.critterColor) {
        try {
          const savedColor =
            await UserPreferencesService.getCritterColor();
          setCritterColor(savedColor);
        } catch (error) {
          console.error('Error loading critter color:', error);
          // Keep default color on error
        }
      }
    };

    loadCritterColor();

    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [route.params?.critterColor, fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Sorter Machine Game</Text>
        <Text style={styles.subtitle}>
          Your critter color: {critterColor}
        </Text>

        <View style={styles.critterContainer}>
          <AnimatedCritter state="IDLE" critterColor={critterColor} />
        </View>

        <Text style={styles.placeholder}>
          Game implementation coming in later tasks...
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    marginBottom: 30,
  },
  critterContainer: {
    marginVertical: 40,
  },
  placeholder: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.7,
    textAlign: 'center',
  },
});
