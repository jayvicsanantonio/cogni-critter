# Manual Error Recovery Tests

This document outlines manual tests to verify error handling and recovery mechanisms work correctly.

## Test Scenarios

### 1. Model Loading Error Recovery

**Test Steps:**

1. Start the app with no internet connection
2. Navigate to the game screen
3. Observe error handling behavior

**Expected Results:**

- User sees friendly message: "Oops! Your critter is having trouble waking up. Let's try again!"
- App automatically retries model loading (up to 3 attempts)
- If all attempts fail, user gets option to retry manually
- App doesn't crash or show technical error messages

**Verification:**

- Check console logs for retry attempts
- Verify error handler is called with MODEL_LOAD_ERROR
- Confirm user-friendly message is displayed

### 2. Prediction Timeout Recovery

**Test Steps:**

1. Complete teaching phase successfully
2. Start testing phase
3. Simulate slow prediction (can be done by adding artificial delay in code)
4. Observe timeout behavior

**Expected Results:**

- Prediction times out after 1 second
- User sees message: "Your critter is thinking really hard! Let's help it make a guess."
- App uses fallback prediction (random but reasonable confidence scores)
- Game continues normally with fallback result

**Verification:**

- Check console logs for timeout warnings
- Verify fallback prediction is used
- Confirm game flow continues uninterrupted

### 3. Memory Management

**Test Steps:**

1. Play multiple game sessions without restarting app
2. Monitor memory usage in development tools
3. Force app to background and foreground multiple times
4. Complete several teaching/testing cycles

**Expected Results:**

- Memory usage stays within reasonable bounds (< 150MB)
- No memory leaks detected
- Tensors are properly disposed after operations
- App performance remains smooth

**Verification:**

- Check TensorFlow.js memory info in console
- Monitor device memory usage
- Verify no "memory leak" warnings in logs

### 4. App State Change Handling

**Test Steps:**

1. Start a game session
2. Put app in background during teaching phase
3. Leave in background for > 5 minutes
4. Return to foreground
5. Continue game

**Expected Results:**

- Game state is preserved during background
- User sees friendly message about returning: "Welcome back! Your critter missed you while the app was away."
- Game continues from where it left off
- No data loss or corruption

**Verification:**

- Check game state snapshot is saved
- Verify background duration tracking
- Confirm smooth resumption of gameplay

### 5. Complete Error Recovery Flow

**Test Steps:**

1. Start with poor network conditions
2. Attempt to load model (should fail and retry)
3. Once model loads, complete teaching phase
4. During testing, simulate prediction timeouts
5. Put app in background and return
6. Complete game session

**Expected Results:**

- All error scenarios are handled gracefully
- User sees appropriate friendly messages
- Game functionality is preserved throughout
- No crashes or technical errors visible to user

**Verification:**

- Check error log contains appropriate error types
- Verify recovery mechanisms work in sequence
- Confirm user experience remains positive

## Error Handler Verification

### Console Commands for Testing

```javascript
// Test error handler directly in console
import { errorHandler } from './src/utils/errorHandler';

// Test model loading error
const modelError = errorHandler.handleModelLoadError(
  new Error('Test error')
);
console.log('Model error:', modelError.errorInfo.userMessage);

// Test prediction timeout
const timeoutError = errorHandler.handlePredictionTimeout();
console.log('Timeout error:', timeoutError.errorInfo.userMessage);

// Test memory error
const memoryError = errorHandler.handleMemoryError(
  new Error('Out of memory')
);
console.log('Memory error:', memoryError.errorInfo.userMessage);

// Check error statistics
console.log('Error stats:', errorHandler.getErrorStats());
```

### Memory Manager Verification

```javascript
// Test memory manager directly
import { memoryManager } from './src/utils/memoryManager';

// Initialize and check status
memoryManager.initialize();
console.log('Memory safe:', memoryManager.isMemoryUsageSafe());
console.log(
  'Memory usage:',
  memoryManager.getMemoryUsagePercentage()
);

// Take snapshots
memoryManager.takeSnapshot('test');
console.log('Memory history:', memoryManager.getMemoryHistory());
```

## Success Criteria

All error scenarios should:

1. ✅ Display user-friendly messages appropriate for children aged 8-12
2. ✅ Provide recovery options where applicable
3. ✅ Maintain game state and progress
4. ✅ Log technical details for debugging without showing to user
5. ✅ Continue game flow smoothly after recovery
6. ✅ Not crash or freeze the application
7. ✅ Handle multiple consecutive errors gracefully

## Notes

- All error messages use child-friendly language
- Technical details are logged but not shown to users
- Recovery mechanisms are automatic where possible
- Manual retry options are provided for user-initiated recovery
- Memory management prevents crashes from resource exhaustion
- App state handling ensures smooth user experience across app lifecycle events
