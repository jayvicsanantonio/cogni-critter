/**
 * GameScreen Component
 * Main game screen with integrated teaching phase and game state management
 */

import React, {
  useEffect,
  useState,
  useRef,
  useReducer,
} from 'react';
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
import { TeachingPhase } from '@components/TeachingPhase';
import { UserPreferencesService } from '@services/UserPreferencesService';
import { ImageDatasetService } from '@services/ImageDatasetService';
import { TrainingDataService } from '@services/TrainingDataService';
import {
  gameReducer,
  initialGameState,
  gameActions,
  DEFAULT_GAME_CONFIG,
} from '@utils/gameStateManager';
import {
  createGameStateHook,
  gameStateEffects,
} from '@utils/gameStateIntegration';
import { ImageLabel } from '@types/coreTypes';

/**
 * GameScreen Component
 *
 * Main game screen that manages the complete game flow including
 * teaching phase, testing phase, and results. Integrates with
 * game state management system.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export const GameScreen: React.FC<GameScreenProps> = ({ route }) => {
  // Game state management
  const [gameState, dispatch] = useReducer(gameReducer, {
    ...initialGameState,
    phase: 'TEACHING_PHASE', // Start directly in teaching phase for this task
  });

  // UI state
  const [critterColor, setCritterColor] = useState(
    route.params?.critterColor || 'Cogni Green'
  );
  const [teachingImages, setTeachingImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Services
  const [imageDatasetService] = useState(() =>
    ImageDatasetService.getInstance()
  );
  const [trainingDataService] = useState(() =>
    TrainingDataService.getInstance()
  );

  // Game state integration
  const gameStateHook = createGameStateHook(gameState, dispatch);

  // Animation values for smooth entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Initialize game
    const initializeGame = async () => {
      try {
        // Load saved critter color if not provided via navigation params
        if (!route.params?.critterColor) {
          const savedColor =
            await UserPreferencesService.getCritterColor();
          setCritterColor(savedColor);
        }

        // Load teaching images
        const images =
          imageDatasetService.getTeachingSetWithFallback(8);
        setTeachingImages(images);

        // Initialize game state
        dispatch(gameActions.initializeGame());
        dispatch(gameActions.startTeachingPhase());

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
      } catch (error) {
        console.error('Error initializing game:', error);
      }
    };

    initializeGame();
  }, [route.params?.critterColor, fadeAnim, slideAnim]);

  // Handle game state effects
  useEffect(() => {
    // Handle automatic transitions and critter state updates
    gameStateHook.effects.handleAutoTransitions(
      gameState,
      dispatch,
      DEFAULT_GAME_CONFIG
    );
    gameStateHook.effects.handleCritterStateUpdates(
      gameState,
      dispatch
    );
    gameStateHook.effects.handleDataPersistence(gameState);
  }, [gameState]);

  // Handle user sorting action
  const handleSort = (
    imageUri: string,
    label: ImageLabel,
    imageId: string
  ) => {
    // Create training example
    const trainingExample = trainingDataService.createTrainingExample(
      imageUri,
      label,
      imageId
    );

    // Update game state using integration utilities
    gameStateHook.actions.handleUserSort(dispatch, trainingExample);

    // Move to next image
    setCurrentImageIndex((prev) => prev + 1);
  };

  // Handle teaching phase completion
  const handleTeachingComplete = () => {
    gameStateHook.actions.transitionToTesting(
      dispatch,
      gameState,
      DEFAULT_GAME_CONFIG
    );
    // TODO: Implement testing phase in next tasks
  };

  // Render different phases based on game state
  const renderGamePhase = () => {
    switch (gameState.phase) {
      case 'TEACHING_PHASE':
        return (
          <TeachingPhase
            images={teachingImages}
            currentImageIndex={currentImageIndex}
            trainingData={gameState.trainingData}
            critterColor={critterColor}
            onSort={handleSort}
            onComplete={handleTeachingComplete}
            minImages={DEFAULT_GAME_CONFIG.teachingPhase.minImages}
            maxImages={DEFAULT_GAME_CONFIG.teachingPhase.maxImages}
          />
        );

      case 'TESTING_PHASE':
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Testing Phase</Text>
            <Text style={styles.subtitle}>
              Testing phase implementation coming in next tasks...
            </Text>
            <View style={styles.critterContainer}>
              <AnimatedCritter
                state={gameState.critterState}
                critterColor={critterColor}
              />
            </View>
          </View>
        );

      case 'RESULTS_SUMMARY':
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Results</Text>
            <Text style={styles.subtitle}>
              Results phase implementation coming in next tasks...
            </Text>
            <View style={styles.critterContainer}>
              <AnimatedCritter
                state={gameState.critterState}
                critterColor={critterColor}
              />
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Sorter Machine Game</Text>
            <Text style={styles.subtitle}>
              Your critter color: {critterColor}
            </Text>
            <View style={styles.critterContainer}>
              <AnimatedCritter
                state={gameState.critterState}
                critterColor={critterColor}
              />
            </View>
            <Text style={styles.placeholder}>
              Initializing game...
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.gameContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {renderGamePhase()}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  gameContainer: {
    flex: 1,
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  critterContainer: {
    marginVertical: 40,
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.7,
    textAlign: 'center',
  },
});
