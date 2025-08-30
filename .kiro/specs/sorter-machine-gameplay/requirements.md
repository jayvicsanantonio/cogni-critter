# Requirements Document

## Introduction

The Sorter Machine is the foundational mini-game of CogniCritter that teaches children aged 8-12 fundamental concepts of Artificial Intelligence through supervised learning (classification). Players will train their digital pet by manually sorting images into categories during a Teaching Phase, then watch their CogniCritter attempt to classify new images independently during a Testing Phase. This gamified approach makes AI concepts tangible and engaging while fostering critical thinking and problem-solving skills.

## Requirements

### Requirement 1: Game Initialization and First-Time User Flow

**User Story:** As a child playing for the first time, I want to hatch and personalize my CogniCritter before starting the game so that I feel connected to my unique digital pet.

#### Acceptance Criteria

1. WHEN a first-time user starts the app THEN the system SHALL display the "Hatch Your Critter" screen with color selection options
2. WHEN on the "Hatch Your Critter" screen THEN the system SHALL show a live preview of the CogniCritter, color choices (Cogni Green, Spark Blue, Glow Yellow, Action Pink, White), and a "Start Game" button
3. WHEN the user selects a color THEN the system SHALL immediately update the critter preview with the chosen tint color applied to grayscale sprites
4. WHEN the user presses "Start Game" THEN the system SHALL save the selected color and navigate to the Sorter Machine with the personalized critter
5. WHEN a returning user starts the app THEN the system SHALL skip directly to Sorter Machine initialization using their saved critter color
6. WHILE the TensorFlow.js MobileNetV2 model is loading THEN the system SHALL display the personalized CogniCritter in "thinking" state with loading progress feedback
7. WHEN the model has successfully loaded THEN the system SHALL transition to the Teaching Phase within 2 seconds
8. IF the model fails to load THEN the system SHALL display an error message with retry option while maintaining the critter's visual state

### Requirement 2: Teaching Phase - Manual Image Classification

**User Story:** As a child, I want to sort images into correct categories using drag-and-drop so that I can teach my critter how to recognize different objects.

#### Acceptance Criteria

1. WHEN entering the Teaching Phase THEN the system SHALL display an ImageCard component with a fruit/object image and two SortingBin components labeled "Apple" and "Not Apple"
2. WHEN the user drags an image to a bin THEN the system SHALL provide clear visual feedback during the drag operation and record the classification as labeled training data
3. WHEN the user completes sorting an image THEN the system SHALL immediately advance to the next image from the predefined training set
4. WHEN the user has sorted 5-10 images THEN the system SHALL automatically transition to the Testing Phase
5. WHILE in Teaching Phase THEN the CogniCritter SHALL remain in "idle" state with the user's chosen color tint to show it's passively learning
6. WHEN displaying the teaching interface THEN the system SHALL use rounded corners, soft shadows, and the defined color palette for all UI elements

### Requirement 3: Testing Phase - AI Classification

**User Story:** As a child, I want to watch my critter try to sort images on its own so that I can see if it has learned from my teaching and understand how AI makes decisions.

#### Acceptance Criteria

1. WHEN entering the Testing Phase THEN the system SHALL animate the CogniCritter to "thinking" state using the 250ms crossfade transition
2. WHEN the CogniCritter processes an image THEN the system SHALL convert the image to a tensor using imageToTensor function and run MobileNetV2 model prediction within 1 second
3. WHEN the CogniCritter makes a prediction THEN the system SHALL animate the ImageCard moving to the chosen SortingBin based on the model's classification confidence
4. WHEN the CogniCritter completes a classification THEN the system SHALL compare the prediction to the true label and advance to the next test image
5. WHEN all test images are processed THEN the system SHALL display a summary screen with final accuracy score and educational insights about the results
6. WHILE processing predictions THEN the system SHALL maintain the user's chosen critter color tint throughout all state transitions

### Requirement 4: Visual Feedback and Character States

**User Story:** As a child, I want to see clear, expressive reactions from my CogniCritter so that I know whether it got the answer right or wrong and feel emotionally connected to its learning journey.

#### Acceptance Criteria

1. WHEN the CogniCritter makes a correct prediction THEN the system SHALL transition to the "happy" state using the critter_happy_grayscale.png sprite with celebratory visual effects
2. WHEN the CogniCritter makes an incorrect prediction THEN the system SHALL transition to the "confused" state using the critter_confused_grayscale.png sprite
3. WHEN transitioning between any character states THEN the system SHALL use the AnimatedCritter component with 250ms crossfade animation and useNativeDriver: true for 60fps performance
4. WHEN displaying any character state THEN the system SHALL apply the user's chosen color tint to all grayscale sprites using the tintColor style property
5. WHEN the system is loading THEN the system SHALL display the "thinking" state using critter_thinking_grayscale.png
6. WHEN the game is idle or waiting for input THEN the system SHALL display the "idle" state using critter_idle_grayscale.png
7. WHILE any animations are playing THEN the system SHALL maintain smooth performance by offloading animations to the native UI thread

### Requirement 5: Score Tracking and Progress Display

**User Story:** As a child, I want to see how well my CogniCritter is performing so that I feel engaged and can track improvement.

#### Acceptance Criteria

1. WHEN the CogniCritter makes a prediction THEN the system SHALL update the score counter in real-time
2. WHEN displaying the score THEN the system SHALL show both correct and total predictions
3. WHEN the game session ends THEN the system SHALL display a summary screen with final results
4. WHILE in Testing Phase THEN the system SHALL show a progress indicator for remaining images
5. WHEN the CogniCritter achieves high accuracy THEN the system SHALL display celebratory visual effects

### Requirement 6: AI Bias Education and Learning Insights

**User Story:** As a child, I want to understand why my CogniCritter sometimes makes mistakes so that I can learn about how AI works and the importance of good training data.

#### Acceptance Criteria

1. WHEN the CogniCritter consistently misclassifies certain types of images (e.g., only trained on red apples but sees green apples) THEN the system SHALL provide gentle educational hints about training data diversity using age-appropriate language
2. WHEN the game session ends THEN the system SHALL display an optional educational summary explaining why certain mistakes occurred based on the specific training examples provided during the Teaching Phase
3. IF the training data lacks diversity (e.g., all apples are the same color/type) THEN the system SHALL suggest trying different varieties of examples in future sessions to improve the critter's learning
4. WHEN educational content is displayed THEN the system SHALL use Poppins font for body text, visual examples with the critter reacting, and simple explanations suitable for ages 8-12
5. WHEN explaining AI concepts THEN the system SHALL relate them to the critter's "learning journey" to maintain the emotional connection and gamified experience

### Requirement 7: User Interface and Accessibility

**User Story:** As a child, I want the game interface to be colorful, friendly, and easy to use so that I can focus on learning rather than struggling with controls.

#### Acceptance Criteria

1. WHEN displaying UI elements THEN the system SHALL use the defined color palette: Cogni Green (#A2E85B), Spark Blue (#4D96FF), Glow Yellow (#FFD644), Action Pink (#F037A5), Deep Space Navy (#0B132B), and Bright Cloud (#F5F5F5)
2. WHEN showing buttons and interactive elements THEN the system SHALL use fully rounded corners (20-30px borderRadius), soft drop shadows, and no sharp edges to feel tactile and inviting
3. WHEN displaying text THEN the system SHALL use Nunito ExtraBold font for headings/titles and Poppins Regular for body text and instructions
4. WHEN users interact with draggable ImageCard elements THEN the system SHALL provide immediate visual feedback including hover states, drag indicators, and smooth animations
5. WHEN the app runs on different screen sizes THEN the system SHALL maintain proper proportions, readability, and touch target sizes appropriate for children
6. WHEN displaying the background THEN the system SHALL use Deep Space Navy to create contrast and make UI elements pop
7. WHEN showing progress indicators or score counters THEN the system SHALL use thick progress bars with rounded ends filled with Cogni Green

### Requirement 8: Technical Architecture and Performance

**User Story:** As a child, I want the game to run smoothly and respond quickly so that I can have an uninterrupted learning experience.

#### Acceptance Criteria

1. WHEN the app initializes THEN the system SHALL use React Native framework with TensorFlow.js and bundled MobileNetV2 model for on-device processing
2. WHEN managing game state THEN the system SHALL use a useReducer hook with finite state machine pattern (INITIALIZING, LOADING_MODEL, TEACHING_PHASE, TESTING_PHASE, RESULTS_SUMMARY states)
3. WHEN processing images for AI classification THEN the system SHALL convert images to 224x224 tensors with normalized pixel values using the imageToTensor helper function
4. WHEN storing training data THEN the system SHALL maintain labeled examples in memory during the session for potential bias analysis
5. WHEN the app runs THEN the system SHALL maintain component separation: GameScreen for state management, AnimatedCritter for character display, ImageCard for image presentation, and SortingBin for classification targets
6. WHILE running any animations or ML processing THEN the system SHALL maintain responsive UI performance without blocking user interactions
7. WHEN deployed THEN the system SHALL bundle all assets (model files, sprites) locally to ensure offline functionality
