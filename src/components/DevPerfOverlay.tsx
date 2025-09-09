import { AppColors } from '@assets/index'
import { memoryManager } from '@utils/memoryManager'
import { PerformanceMonitor, type PerformanceStats } from '@utils/performanceMonitor'
import { performanceMetrics } from '@utils/performanceMetrics'
import { devSettings } from '@utils/devSettings'
import React, { useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

/**
 * DevPerfOverlay
 *
 * A development-only floating overlay that displays live performance stats
 * (FPS, frame drops, memory) and offers a "Report" button to generate a
 * consolidated performance report in the console.
 *
 * Shown only in __DEV__ builds when included in the app tree.
 */
export const DevPerfOverlay: React.FC = () => {
  const monitorRef = useRef(PerformanceMonitor.getInstance())
  const [expanded, setExpanded] = useState(false)
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [mem, setMem] = useState<{ tensors: number; mb: number } | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!__DEV__) return

    // Run long-session monitoring (1 hour) so it doesn't stop automatically.
    monitorRef.current.startMonitoring(60 * 60 * 1000)

    const interval = setInterval(() => {
      try {
        const s = monitorRef.current.getPerformanceStats()
        setStats(s)
        const m = memoryManager.getCurrentMemoryUsage()
        setMem({ tensors: m.numTensors, mb: Math.round((m.numBytes / 1024 / 1024) * 10) / 10 })
      } catch (e) {
        // Swallow in dev overlay
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      monitorRef.current.stopMonitoring()
    }
  }, [])

  if (!__DEV__) return null

  const handleReport = () => {
    try {
      const report = performanceMetrics.generateReport()
      // Log a compact summary plus the full object
      // eslint-disable-next-line no-console
      console.log('[Perf] Summary:', report.summary)
      // eslint-disable-next-line no-console
      console.log('[Perf] Full Report:', report)
      setMessage('Performance report logged to console')
      setTimeout(() => setMessage(null), 2500)
    } catch (e) {
      setMessage('Failed to generate report')
      setTimeout(() => setMessage(null), 2500)
    }
  }

  const toggleMonitoring = () => {
    // Quick toggle
    if (stats && (stats.totalFrames > 0)) {
      monitorRef.current.stopMonitoring()
      setMessage('Monitoring stopped')
    } else {
      monitorRef.current.startMonitoring(60 * 60 * 1000)
      setMessage('Monitoring started')
    }
    setTimeout(() => setMessage(null), 1500)
  }

  const avg = stats?.averageFPS ?? 0
  const min = stats?.minFPS ?? 0
  const drops = stats?.frameDrops ?? 0
  const quality = stats?.currentQualityLevel ?? 'high'
  const tensors = mem?.tensors ?? 0
  const mb = mem?.mb ?? 0

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {/* Floating button */}
      {!expanded && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Toggle performance overlay"
          onPress={() => setExpanded(true)}
          style={styles.fab}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>FPS</Text>
        </TouchableOpacity>
      )}

      {/* Expanded panel */}
      {expanded && (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Performance</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close performance overlay"
              onPress={() => setExpanded(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Avg FPS:</Text>
            <Text style={[styles.value, avg >= 60 ? styles.ok : avg >= 45 ? styles.warn : styles.err]}>
              {avg.toFixed(1)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Min FPS:</Text>
            <Text style={[styles.value, min >= 60 ? styles.ok : min >= 45 ? styles.warn : styles.err]}>
              {min.toFixed(1)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Frame drops:</Text>
            <Text style={styles.value}>{drops}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quality:</Text>
            <Text style={styles.value}>{quality}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tensors:</Text>
            <Text style={styles.value}>{tensors}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>TFJS Memory:</Text>
            <Text style={styles.value}>{mb} MB</Text>
          </View>

          {!!message && (
            <Text style={styles.message}>{message}</Text>
          )}

          <View style={styles.buttonsRow}>
            <TouchableOpacity onPress={handleReport} style={[styles.btn, styles.primary]}
              accessibilityRole="button" accessibilityLabel="Generate performance report">
              <Text style={styles.btnText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleMonitoring} style={[styles.btn, styles.secondary]}
              accessibilityRole="button" accessibilityLabel="Toggle monitoring">
              <Text style={styles.btnText}>{stats && stats.totalFrames > 0 ? 'Stop' : 'Start'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => devSettings.setDebugMenuOpen(true)} style={[styles.btn, styles.secondary]}
              accessibilityRole="button" accessibilityLabel="Open debug menu">
              <Text style={styles.btnText}>Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: 12,
    bottom: Platform.select({ ios: 24, android: 24, default: 16 }),
    zIndex: 9999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    color: AppColors.deepSpaceNavy,
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 14,
  },
  panel: {
    width: 260,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  panelTitle: {
    color: AppColors.brightCloud,
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 16,
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeText: {
    color: AppColors.brightCloud,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  label: {
    color: AppColors.brightCloud,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    opacity: 0.9,
  },
  value: {
    color: AppColors.brightCloud,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
  ok: { color: AppColors.cogniGreen },
  warn: { color: AppColors.glowYellow },
  err: { color: AppColors.actionPink },
  message: {
    marginTop: 6,
    color: AppColors.brightCloud,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    opacity: 0.9,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: AppColors.accent,
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  btnText: {
    color: AppColors.deepSpaceNavy,
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 12,
  },
})
