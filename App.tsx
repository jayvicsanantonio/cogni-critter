/**
 * CogniCritter App
 * Main application entry point
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { initializeTensorFlow } from './src/utils/tensorflowSetup';

function App(): React.JSX.Element {
  const [isTfReady, setIsTfReady] = useState(false);

  useEffect(() => {
    const setupTensorFlow = async () => {
      try {
        await initializeTensorFlow();
        setIsTfReady(true);
      } catch (error) {
        console.error('Failed to initialize TensorFlow.js:', error);
      }
    };

    setupTensorFlow();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
      <View style={styles.content}>
        <Text style={styles.title}>CogniCritter</Text>
        <Text style={styles.subtitle}>AI Learning Adventure</Text>
        <Text style={styles.status}>
          TensorFlow.js: {isTfReady ? 'Ready' : 'Loading...'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B', // Deep Space Navy
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#A2E85B', // Cogni Green
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#F5F5F5', // Bright Cloud
    marginBottom: 20,
  },
  status: {
    fontSize: 14,
    color: '#4D96FF', // Spark Blue
    fontStyle: 'italic',
  },
});

export default App;
