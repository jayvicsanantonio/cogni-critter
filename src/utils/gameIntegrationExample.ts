/**
 * Example integration of training functionality with game state
 * This shows how to properly integrate the training call after teaching phase completion
 */

import React, { useReducer, useCallback, useEffect } from 'react';
import { TrainingExample } from '@types/mlTypes';
import {
  gameReducer,
  initialGameState,
  gameActions,
  phaseTransitions,
  GameAction,
} from './gameStateManager';
import {
  handleTrainingTransition,
  validateTrainingDataForML,
  createTrainingProgressCallback,
  estimateTrainingTime,
  formatTrainingTime,
} from './trainingIntegration';
import { createPhaseTransitionHook } from './phaseTransitionManager';

/**
 * Example hook that demonstrates proper integration of training
 * This would be used in the main GameScreen component
 */
export function useGameWithTraining() {
  const [gameState, dispatch] = useReducer(
    gameReducer,
    initialGameState
  );

  // Create phase transition manager with training integration
  const phaseTransition = createPhaseTransitionHook({
    autoTransitionEnabled: true,
    transitionDelay: 3000, // 3 seconds to show "critter is learning" message
  });

  /**
   * Handle the complete training workflow
   */
  const handleTraining = useCallback(
    async (trainingData: TrainingExample[]): Promise<boolean> => {
      // Validate training data first
      const validation = validateTrainingDataForML(trainingData);

      if (!validation.isValid) {
        console.error(
          'Training data validation failed:',
          validation.errors
        );
        dispatch(
          gameActions.trainingFailed(validation.errors.join(', '))
        );
        return false;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Training data warnings:', validation.warnings);
      }

      // Estimate and log training time
      const estimatedTime = estimateTrainingTime(trainingData.length);
      console.log(
        `Estimated training time: ${formatTrainingTime(
          estimatedTime
        )}`
      );

      // Start training phase
      dispatch(gameActions.startTrainingModel());

      // Perform the actual training
      const success = await handleTrainingTransition(
        trainingData,
        dispatch
      );

      return success;
    },
    []
  );

  /**
   * Handle teaching phase completion and automatic transition to training
   */
  const handleTeachingComplete = useCallback(
    (trainingData: TrainingExample[]) => {
      // Set up automatic transition with training integration
      phaseTransition.setupAutoTransition(
        trainingData,
        (nextPhase) => {
          // This callback handles the phase transition after training
          if (nextPhase === 'TESTING_PHASE') {
            dispatch(gameActions.startTestingPhase());
          }
        },
        handleTraining // This handles the training process
      );
    },
    [handleTraining, phaseTransition]
  );

  /**
   * Force immediate training and transition
   */
  const forceTrainingTransition = useCallback(
    async (trainingData: TrainingExample[]) => {
      const success = await phaseTransition.forceTransition(
        trainingData
      );
      if (!success) {
        console.error('Failed to force training transition');
      }
      return success;
    },
    [phaseTransition]
  );

  /**
   * Add training example and check for automatic transition
   */
  const addTrainingExample = useCallback(
    (example: TrainingExample) => {
      // Add the example to game state
      dispatch(gameActions.addTrainingExample(example));

      // Check if we should transition after adding this example
      const updatedTrainingData = [
        ...gameState.trainingData,
        example,
      ];
      const transitionResult = phaseTransition.evaluateTransition(
        updatedTrainingData
      );

      if (transitionResult.shouldTransition) {
        handleTeachingComplete(updatedTrainingData);
      }
    },
    [gameState.trainingData, phaseTransition, handleTeachingComplete]
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      phaseTransition.cleanup();
    };
  }, [phaseTransition]);

  return {
    gameState,
    dispatch,

    // Training-specific actions
    addTrainingExample,
    forceTrainingTransition,
    handleTeachingComplete,

    // Phase transition utilities
    phaseTransition,

    // Training status
    isTraining: gameState.phase === 'TRAINING_MODEL',
    canStartTraining:
      gameState.phase === 'TEACHING_PHASE' &&
      gameState.trainingData.length >= 5,

    // Helper functions
    validateTrainingData: (data: TrainingExample[]) =>
      validateTrainingDataForML(data),
    estimateTrainingTime: (dataSize: number) =>
      estimateTrainingTime(dataSize),
    formatTrainingTime: (ms: number) => formatTrainingTime(ms),
  };
}

/**
 * Example component usage
 */
export const GameScreenExample: React.FC = () => {
  const {
    gameState,
    addTrainingExample,
    forceTrainingTransition,
    isTraining,
    canStartTraining,
    validateTrainingData,
    estimateTrainingTime,
    formatTrainingTime,
  } = useGameWithTraining();

  // Handle user sorting an image during teaching phase
  const handleImageSort = useCallback(
    (imageUri: string, label: 'apple' | 'not_apple') => {
      const example: TrainingExample = {
        id: `training_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        imageUri,
        userLabel: label,
        timestamp: Date.now(),
      };

      addTrainingExample(example);
    },
    [addTrainingExample]
  );

  // Handle manual training start
  const handleStartTraining = useCallback(async () => {
    if (canStartTraining) {
      const success = await forceTrainingTransition(
        gameState.trainingData
      );
      if (!success) {
        console.error('Failed to start training');
      }
    }
  }, [
    canStartTraining,
    forceTrainingTransition,
    gameState.trainingData,
  ]);

  // Render training status
  const renderTrainingStatus = () => {
    if (isTraining) {
      const estimatedTime = estimateTrainingTime(
        gameState.trainingData.length
      );
      return (
        <div>
          <p>Your critter is learning from your examples...</p>
          <p>Estimated time: {formatTrainingTime(estimatedTime)}</p>
        </div>
      );
    }

    if (canStartTraining) {
      const validation = validateTrainingData(gameState.trainingData);
      return (
        <div>
          <p>
            Ready to train! ({gameState.trainingData.length} examples)
          </p>
          {validation.warnings.length > 0 && (
            <div>
              <p>Warnings:</p>
              <ul>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={handleStartTraining}>Train Critter</button>
        </div>
      );
    }

    return (
      <div>
        <p>
          Keep teaching your critter! ({gameState.trainingData.length}
          /5 examples)
        </p>
      </div>
    );
  };

  return (
    <div>
      <h1>Sorter Machine Game</h1>

      {/* Game phase indicator */}
      <p>Phase: {gameState.phase}</p>
      <p>Critter State: {gameState.critterState}</p>

      {/* Training status */}
      {renderTrainingStatus()}

      {/* Teaching phase UI would go here */}
      {gameState.phase === 'TEACHING_PHASE' && (
        <div>
          {/* Image sorting interface */}
          <button
            onClick={() => handleImageSort('apple1.jpg', 'apple')}
          >
            Sort as Apple
          </button>
          <button
            onClick={() =>
              handleImageSort('orange1.jpg', 'not_apple')
            }
          >
            Sort as Not Apple
          </button>
        </div>
      )}

      {/* Testing phase UI would go here */}
      {gameState.phase === 'TESTING_PHASE' && (
        <div>
          <p>Testing phase - watch your critter classify images!</p>
        </div>
      )}
    </div>
  );
};
