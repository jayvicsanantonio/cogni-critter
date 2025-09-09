/**
 * CogniCritter App
 * Main application entry point with navigation and TensorFlow initialization
 */

import React, { useEffect, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { initializeTensorFlow } from "./src/utils/tensorflowSetup";
import { GameScreen } from "./src/screens/GameScreen";
import { AppColors } from "./src/assets/index";

function App(): React.JSX.Element {
  const [isTfReady, setIsTfReady] = useState(false);
  const [tfError, setTfError] = useState<string | null>(null);

  useEffect(() => {
    const setupTensorFlow = async () => {
      try {
        await initializeTensorFlow();
        setIsTfReady(true);
        console.log("TensorFlow.js initialized successfully");
      } catch (error) {
        console.error("Failed to initialize TensorFlow.js:", error);
        setTfError((error as Error).message);
        // Still proceed to app - TensorFlow will be initialized later if needed
        setIsTfReady(true);
      }
    };

    setupTensorFlow();
  }, []);

  // Show loading screen while TensorFlow initializes
  if (!isTfReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={AppColors.background}
        />
        <Text style={styles.title}>CogniCritter</Text>
        <Text style={styles.subtitle}>AI Learning Adventure</Text>
        <ActivityIndicator
          size="large"
          color={AppColors.accent}
          style={styles.loader}
        />
        <Text style={styles.status}>Initializing TensorFlow.js...</Text>
      </View>
    );
  }

  // Show error if TensorFlow failed to initialize
  if (tfError) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={AppColors.background}
        />
        <Text style={styles.title}>CogniCritter</Text>
        <Text style={styles.errorText}>TensorFlow initialization failed</Text>
        <Text style={styles.errorDetails}>{tfError}</Text>
        <Text style={styles.status}>
          The app will continue but ML features may be limited
        </Text>
      </View>
    );
  }

  // Mock navigation props for GameScreen
  const mockRoute = {
    params: {
      critterColor: "Cogni Green",
    },
  };

  const mockNavigation = {} as any;

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.background}
      />
      <GameScreen route={mockRoute} navigation={mockNavigation} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: "Nunito-ExtraBold",
    color: AppColors.accent,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    color: AppColors.text,
    marginBottom: 30,
    textAlign: "center",
  },
  loader: {
    marginVertical: 20,
  },
  status: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: AppColors.secondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: AppColors.error || "#FF4444",
    marginBottom: 10,
    textAlign: "center",
  },
  errorDetails: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: AppColors.text,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default App;
