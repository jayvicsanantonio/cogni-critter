# Implementation Plan: Sorter Machine Gameplay

- [ ] 1. Set up project foundation and core interfaces

  - Initialize React Native project structure with proper folder organization
  - Install and configure TensorFlow.js dependencies (tfjs, tfjs-react-native, tfjs-platform-react-native)
  - Create TypeScript interfaces for all data models (GameState, TrainingExample, TestResult, ImageItem, GameConfig, ImageDataset, ErrorHandler, PerformanceMetrics)
  - Define core type definitions (CritterState, ClassificationResult)
  - Create service interfaces (MLService, AnimationService)
  - Set up asset management for grayscale critter sprites and test images
  - _Requirements: 1.4, 1.5, 1.6, 1.7_

- [ ] 2. Implement ML service and model integration

  - Create MLService class with model loading, image preprocessing, and prediction methods
  - Implement imageToTensor function with proper 224x224 resizing and normalization
  - Add model loading with timeout handling and retry mechanism
  - Create tensor disposal utilities for memory management
  - Write unit tests for ML service functions
  - _Requirements: 1.4, 1.5, 1.6, 1.7, 3.1, 3.2, 3.3_

- [ ] 2.1 Implement supervised learning training functionality

  - Create trainModel method that fine-tunes MobileNetV2's final classification layer using user's labeled training data
  - Implement transfer learning approach with feature extraction from pre-trained layers
  - Add training data validation and preprocessing for the custom classifier
  - Create model compilation with appropriate optimizer and loss function for binary classification
  - Write unit tests for training logic and model updates
  - _Requirements: 2.2, 2.3, 6.1, 6.2, 8.2_

- [ ] 3. Build core game state management

  - Implement game reducer with finite state machine logic (INITIALIZING → LOADING_MODEL → TEACHING_PHASE → TESTING_PHASE → RESULTS_SUMMARY)
  - Create state transition functions for phase changes
  - Add training data collection and storage during teaching phase
  - Implement test result tracking and scoring logic
  - Write unit tests for reducer logic and state transitions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

- [ ] 4. Create animated critter component with color tinting

  - Build AnimatedCritter component with crossfade animations between states
  - Implement color tinting system for grayscale sprites
  - Add 250ms transition animations using native driver
  - Create sprite state mapping (LOADING_MODEL, IDLE, THINKING, HAPPY, CONFUSED)
  - Write animation performance tests to ensure 60fps target
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 5. Implement first-time user flow integration

  - Create user preference storage to track first-time vs returning users
  - Add conditional routing logic to show Hatch Your Critter for new users
  - Implement critter color persistence and passing between screens
  - Create smooth transition from hatching to game initialization
  - Write integration tests for user flow scenarios
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 6. Build image card and sorting interface

  - Create ImageCard component with drag-and-drop functionality
  - Implement SortingBin components with drop zone detection
  - Add visual feedback for drag operations and valid drop zones
  - Create smooth animations for image sorting actions
  - Write interaction tests for drag-and-drop behavior
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 7. Implement teaching phase logic

  - Create teaching phase UI with image presentation and bin sorting
  - Add user input collection and training data storage
  - Implement progress tracking (5-10 images) with visual indicators
  - Integrate model training call after collecting sufficient labeled examples
  - Add automatic transition to testing phase after training completion
  - Write end-to-end tests for teaching phase workflow including training step
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 8. Build testing phase with ML predictions

  - Implement critter thinking animation during prediction processing
  - Add ML model prediction calls with 1-second timeout handling
  - Create prediction result evaluation and scoring logic
  - Implement critter state updates (HAPPY/CONFUSED) based on accuracy
  - Write performance tests to ensure prediction time requirements
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

- [ ] 9. Create results summary screen

  - Build results summary UI with final accuracy score display
  - Implement educational insights about AI bias and training data diversity
  - Add optional explanations for common mistakes based on training examples
  - Create restart game functionality to return to teaching phase
  - Write tests for results display and educational content
  - _Requirements: 3.5, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Add score tracking and progress indicators

  - Implement real-time score counter updates during testing phase
  - Create progress indicators for remaining images in both phases
  - Add celebratory visual effects for high accuracy achievements
  - Implement score persistence and session tracking
  - Write tests for score calculation and display accuracy
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. Implement error handling and recovery

  - Add model loading error handling with user-friendly messages
  - Implement prediction timeout fallback mechanisms
  - Create app state change handling (background/foreground)
  - Add memory management and cleanup for tensor operations
  - Write error scenario tests and recovery validation
  - _Requirements: 1.8, 3.3_

- [ ] 12. Add performance monitoring and optimization

  - Implement frame rate monitoring with automatic quality adjustment
  - Add memory usage tracking and optimization alerts
  - Create performance metrics collection for 60fps validation
  - Optimize image loading and caching for smooth gameplay
  - Write performance benchmark tests
  - _Requirements: 8.6, 8.7_

- [ ] 13. Integrate all components in main GameScreen
  - Assemble all components into cohesive GameScreen layout
  - Connect game state management to UI components
  - Add proper prop passing and event handling between components
  - Implement screen navigation and parameter passing
  - Write full integration tests for complete gameplay flow
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
