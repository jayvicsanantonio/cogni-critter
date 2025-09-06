/**
 * AnimatedCritter Performance Tests
 * Tests to ensure the AnimatedCritter component meets 60fps performance requirements
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { AnimatedCritter } from '../AnimatedCritter';
import {
  PerformanceMonitor,
  PerformanceStats,
} from '../../utils/performanceMonitor';
import { CritterState } from '@types/coreTypes';

// Mock the asset imports
jest.mock('@assets/index', () => ({
  getSpriteForState: jest.fn(() => ({ uri: 'mock-sprite.png' })),
}));

jest.mock('@utils/colorTinting', () => ({
  ColorTintingManager: {
    getColorValue: jest.fn(() => '#A2E85B'),
  },
}));

jest.mock('@utils/animationHelpers', () => ({
  AnimationHelper: {
    createCrossfade: jest.fn(() => ({
      start: jest.fn((callback) => setTimeout(callback, 250)),
    })),
  },
  useAnimationMonitoring: jest.fn(() => ({
    startAnimation: jest.fn(),
    endAnimation: jest.fn(),
  })),
}));

describe('AnimatedCritter Performance Tests', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.reset();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  it('should maintain 60fps during state transitions', async () => {
    const TestComponent = () => {
      const [state, setState] = React.useState<CritterState>('IDLE');

      React.useEffect(() => {
        // Simulate rapid state changes to stress test performance
        const states: CritterState[] = [
          'IDLE',
          'THINKING',
          'HAPPY',
          'CONFUSED',
          'IDLE',
        ];
        let currentIndex = 0;

        const interval = setInterval(() => {
          currentIndex = (currentIndex + 1) % states.length;
          setState(states[currentIndex]);
        }, 300); // Change state every 300ms

        return () => clearInterval(interval);
      }, []);

      return (
        <AnimatedCritter
          state={state}
          critterColor="Cogni Green"
          animationDuration={250}
        />
      );
    };

    render(<TestComponent />);

    // Test performance for 3 seconds
    const stats = await performanceMonitor.testAnimationPerformance(
      3000
    );

    // Assertions for 60fps target
    expect(stats.isTargetMet).toBe(true);
    expect(stats.averageFPS).toBeGreaterThanOrEqual(60);
    expect(stats.frameDrops).toBeLessThan(stats.totalFrames * 0.05); // Less than 5% frame drops
  }, 10000); // 10 second timeout for this test

  it('should maintain acceptable performance with rapid state changes', async () => {
    const TestComponent = () => {
      const [state, setState] = React.useState<CritterState>('IDLE');

      React.useEffect(() => {
        // Very rapid state changes to stress test
        const states: CritterState[] = [
          'IDLE',
          'THINKING',
          'HAPPY',
          'CONFUSED',
        ];
        let currentIndex = 0;

        const interval = setInterval(() => {
          currentIndex = (currentIndex + 1) % states.length;
          setState(states[currentIndex]);
        }, 100); // Change state every 100ms (very rapid)

        return () => clearInterval(interval);
      }, []);

      return (
        <AnimatedCritter
          state={state}
          critterColor="Spark Blue"
          animationDuration={250}
        />
      );
    };

    render(<TestComponent />);

    // Test performance for 2 seconds with rapid changes
    const stats = await performanceMonitor.testAnimationPerformance(
      2000
    );

    // Should at least maintain acceptable performance (45fps minimum)
    expect(stats.isAcceptable).toBe(true);
    expect(stats.averageFPS).toBeGreaterThanOrEqual(45);
  }, 8000);

  it('should handle multiple AnimatedCritter instances efficiently', async () => {
    const MultiCritterTest = () => {
      const [states, setStates] = React.useState<CritterState[]>([
        'IDLE',
        'THINKING',
        'HAPPY',
      ]);

      React.useEffect(() => {
        const allStates: CritterState[] = [
          'IDLE',
          'THINKING',
          'HAPPY',
          'CONFUSED',
        ];

        const interval = setInterval(() => {
          setStates((prev) =>
            prev.map(
              () =>
                allStates[
                  Math.floor(Math.random() * allStates.length)
                ]
            )
          );
        }, 400);

        return () => clearInterval(interval);
      }, []);

      return (
        <>
          {states.map((state, index) => (
            <AnimatedCritter
              key={index}
              state={state}
              critterColor={
                ['Cogni Green', 'Spark Blue', 'Glow Yellow'][index]
              }
              animationDuration={250}
            />
          ))}
        </>
      );
    };

    render(<MultiCritterTest />);

    // Test performance with multiple instances
    const stats = await performanceMonitor.testAnimationPerformance(
      2500
    );

    // Should maintain acceptable performance even with multiple instances
    expect(stats.isAcceptable).toBe(true);
    expect(stats.averageFPS).toBeGreaterThanOrEqual(45);
  }, 8000);

  it('should provide performance recommendations when needed', async () => {
    // This test simulates a scenario where performance might be suboptimal
    const stats = await performanceMonitor.testAnimationPerformance(
      1000
    );

    expect(stats.recommendations).toBeDefined();
    expect(Array.isArray(stats.recommendations)).toBe(true);
    expect(stats.recommendations.length).toBeGreaterThan(0);
  });

  it('should track frame drops accurately', async () => {
    render(
      <AnimatedCritter
        state="THINKING"
        critterColor="Action Pink"
        animationDuration={250}
      />
    );

    const stats = await performanceMonitor.testAnimationPerformance(
      1500
    );

    expect(typeof stats.frameDrops).toBe('number');
    expect(stats.frameDrops).toBeGreaterThanOrEqual(0);
    expect(stats.totalFrames).toBeGreaterThan(0);
  });
});

/**
 * Manual Performance Test Component
 * This can be used in development to manually test performance
 */
export const ManualPerformanceTest: React.FC = () => {
  const [currentState, setCurrentState] =
    React.useState<CritterState>('IDLE');
  const [isRunning, setIsRunning] = React.useState(false);
  const [stats, setStats] = React.useState<PerformanceStats | null>(
    null
  );

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setStats(null);

    // Start cycling through states
    const states: CritterState[] = [
      'IDLE',
      'THINKING',
      'HAPPY',
      'CONFUSED',
    ];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % states.length;
      setCurrentState(states[currentIndex]);
    }, 300);

    // Run performance test
    const monitor = PerformanceMonitor.getInstance();
    const testStats = await monitor.testAnimationPerformance(3000);

    clearInterval(interval);
    setStats(testStats);
    setIsRunning(false);
  };

  return (
    <>
      <AnimatedCritter
        state={currentState}
        critterColor="Cogni Green"
        animationDuration={250}
      />
      {/* In a real app, you'd have buttons and text to control this test */}
      {/* This is just the component structure for manual testing */}
    </>
  );
};
