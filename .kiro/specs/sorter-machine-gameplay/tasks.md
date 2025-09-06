# Implementation Plan: Sorter Machine Gameplay

- [x] 1. Set up React Native project foundation
- [x] 1.1 Initialize React Native project structure with proper folder organization
  - _Requirements: 8.1_
- [x] 1.2 Install and configure TensorFlow.js dependencies (tfjs, tfjs-react-native, tfjs-platform-react-native)
  - _Requirements: 8.1_
- [x] 1.3 Create TypeScript interfaces for all data models (GameState, TrainingExample, TestResult, ImageItem, GameConfig, ImageDataset, ErrorHandler, PerformanceMetrics)
  - _Requirements: 8.4, 8.5_
- [x] 1.4 Define core type definitions (CritterState, ClassificationResult)
  - _Requirements: 8.5_
- [x] 1.5 Create service interfaces (MLService, AnimationService)
  - _Requirements: 8.5_
- [x] 1.6 Set up asset management for grayscale critter sprites and test images

  - _Requirements: 8.7_

- [x] 2. Create animated critter component with color tinting
- [x] 2.1 Build AnimatedCritter component with crossfade animations between states
  - _Requirements: 4.3, 4.7_
- [x] 2.2 Implement color tinting system for grayscale sprites using existing assets
  - _Requirements: 1.3, 4.4_
- [x] 2.3 Add 250ms transition animations using native driver
  - _Requirements: 4.3, 4.7_
- [x] 2.4 Create sprite state mapping (LOADING_MODEL, IDLE, THINKING, HAPPY, CONFUSED)
  - _Requirements: 4.5, 4.6_
- [x] 2.5 Test animation performance to ensure 60fps target

  - _Requirements: 4.7_

- [x] 3. Implement first-time user flow (Hatch Your Critter)
- [x] 3.1 Create HatchingScreen component with color selection interface
  - _Requirements: 1.1, 1.2_
- [x] 3.2 Implement ColorPicker component with predefined color options
  - _Requirements: 1.2, 1.3_
- [x] 3.3 Add user preference storage to track first-time vs returning users
  - _Requirements: 1.5_
- [x] 3.4 Create conditional routing logic to show Hatch Your Critter for new users
  - _Requirements: 1.1, 1.5_
- [x] 3.5 Implement critter color persistence and passing between screens
  - _Requirements: 1.4_
- [x] 3.6 Create smooth transition from hatching to game initialization

  - _Requirements: 1.4_

- [x] 4. Implement ML service and model integration
- [x] 4.1 Create MLService class with model loading, image preprocessing, and prediction methods
  - _Requirements: 8.3_
- [x] 4.2 Implement imageToTensor function with proper 224x224 resizing and normalization
  - _Requirements: 8.3_
- [x] 4.3 Add model loading with timeout handling and retry mechanism
  - _Requirements: 1.8_
- [x] 4.4 Create tensor disposal utilities for memory management
  - _Requirements: 8.6_
- [x] 4.5 Bundle MobileNetV2 model files locally for offline functionality

  - _Requirements: 8.7_

- [x] 5. Build core game state management
- [x] 5.1 Implement game reducer with finite state machine logic (INITIALIZING → LOADING_MODEL → TEACHING_PHASE → TESTING_PHASE → RESULTS_SUMMARY)
  - _Requirements: 8.2_
- [x] 5.2 Create state transition functions for phase changes
  - _Requirements: 8.2_
- [x] 5.3 Add training data collection and storage during teaching phase
  - _Requirements: 2.2, 8.4_
- [x] 5.4 Implement test result tracking and scoring logic
  - _Requirements: 3.4, 5.1, 5.2_
- [x] 5.5 Connect game state to AnimatedCritter component for state-driven animations

  - _Requirements: 4.1, 4.2_

- [x] 6. Build image card and sorting interface
- [x] 6.1 Create ImageCard component with drag-and-drop functionality
  - _Requirements: 2.1_
- [x] 6.2 Implement SortingBin components with drop zone detection
  - _Requirements: 2.1, 2.2_
- [x] 6.3 Add visual feedback for drag operations and valid drop zones
  - _Requirements: 2.2, 7.4_
- [x] 6.4 Create smooth animations for image sorting actions
  - _Requirements: 2.3_
- [x] 6.5 Prepare sample image dataset for apple/not-apple classification

  - _Requirements: 2.1_

- [x] 7. Implement teaching phase logic
- [x] 7.1 Create teaching phase UI with image presentation and bin sorting
  - _Requirements: 2.1, 2.6_
- [x] 7.2 Add user input collection and training data storage
  - _Requirements: 2.2_
- [x] 7.3 Implement progress tracking (5-10 images) with visual indicators
  - _Requirements: 2.4, 5.4_
- [x] 7.4 Add automatic transition to testing phase after sufficient training data
  - _Requirements: 2.4_
- [x] 7.5 Connect teaching phase to game state management

  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 8. Implement supervised learning training functionality
- [ ] 8.1 Create trainModel method that fine-tunes MobileNetV2's final classification layer using user's labeled training data
  - _Requirements: 6.2, 8.2_
- [ ] 8.2 Implement transfer learning approach with feature extraction from pre-trained layers
  - _Requirements: 6.1, 6.2_
- [ ] 8.3 Add training data validation and preprocessing for the custom classifier
  - _Requirements: 6.2_
- [ ] 8.4 Create model compilation with appropriate optimizer and loss function for binary classification
  - _Requirements: 6.2_
- [ ] 8.5 Integrate training call after teaching phase completion

  - _Requirements: 2.2, 2.3_

- [ ] 9. Build testing phase with ML predictions
- [ ] 9.1 Implement critter thinking animation during prediction processing
  - _Requirements: 3.1, 4.1_
- [ ] 9.2 Add ML model prediction calls with 1-second timeout handling
  - _Requirements: 3.2_
- [ ] 9.3 Create prediction result evaluation and scoring logic
  - _Requirements: 3.4_
- [ ] 9.4 Implement critter state updates (HAPPY/CONFUSED) based on accuracy
  - _Requirements: 4.1, 4.2_
- [ ] 9.5 Add smooth image-to-bin animations based on predictions

  - _Requirements: 3.3_

- [ ] 10. Add score tracking and progress indicators
- [ ] 10.1 Implement real-time score counter updates during testing phase
  - _Requirements: 5.1, 5.2_
- [ ] 10.2 Create progress indicators for remaining images in both phases
  - _Requirements: 5.4_
- [ ] 10.3 Add celebratory visual effects for high accuracy achievements
  - _Requirements: 5.5_
- [ ] 10.4 Implement score persistence and session tracking
  - _Requirements: 5.1, 5.2_
- [ ] 10.5 Connect scoring system to critter emotional states

  - _Requirements: 5.1, 4.1, 4.2_

- [ ] 11. Create results summary screen
- [ ] 11.1 Build results summary UI with final accuracy score display
  - _Requirements: 3.5, 5.3_
- [ ] 11.2 Implement educational insights about AI bias and training data diversity
  - _Requirements: 6.1, 6.2, 6.3_
- [ ] 11.3 Add optional explanations for common mistakes based on training examples
  - _Requirements: 6.2, 6.4_
- [ ] 11.4 Create restart game functionality to return to teaching phase
  - _Requirements: 6.5_
- [ ] 11.5 Connect results to overall game flow

  - _Requirements: 3.5_

- [ ] 12. Implement error handling and recovery
- [ ] 12.1 Add model loading error handling with user-friendly messages
  - _Requirements: 1.8_
- [ ] 12.2 Implement prediction timeout fallback mechanisms
  - _Requirements: 3.3_
- [ ] 12.3 Create app state change handling (background/foreground)
  - _Requirements: 8.6_
- [ ] 12.4 Add memory management and cleanup for tensor operations
  - _Requirements: 8.6_
- [ ] 12.5 Test error scenarios and recovery flows

  - _Requirements: 1.8, 3.3_

- [ ] 13. Add performance monitoring and optimization
- [ ] 13.1 Implement frame rate monitoring with automatic quality adjustment
  - _Requirements: 8.6_
- [ ] 13.2 Add memory usage tracking and optimization alerts
  - _Requirements: 8.6_
- [ ] 13.3 Create performance metrics collection for 60fps validation
  - _Requirements: 8.6_
- [ ] 13.4 Optimize image loading and caching for smooth gameplay
  - _Requirements: 8.6_
- [ ] 13.5 Test performance on target devices

  - _Requirements: 8.6_

- [ ] 14. Integrate all components in main GameScreen
- [ ] 14.1 Assemble all components into cohesive GameScreen layout
  - _Requirements: 8.5_
- [ ] 14.2 Connect game state management to UI components
  - _Requirements: 8.2, 8.5_
- [ ] 14.3 Add proper prop passing and event handling between components
  - _Requirements: 8.5_
- [ ] 14.4 Implement screen navigation and parameter passing
  - _Requirements: 1.4_
- [ ] 14.5 Test complete gameplay flow from hatching to results
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_
