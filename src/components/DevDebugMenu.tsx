import { AppColors } from '@assets/index'
import { devSettings } from '@utils/devSettings'
import { performanceMetrics } from '@utils/performanceMetrics'
import RNFS from 'react-native-fs'
import React, { useCallback, useState } from 'react'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Share } from 'react-native'

// Optional clipboard support via community module. Will gracefully degrade if not installed.
let Clipboard: { setString: (text: string) => void } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Clipboard = require('@react-native-clipboard/clipboard')
} catch {
  Clipboard = null
}

/**
 * DevDebugMenu
 *
 * Full-screen development-only menu for quick debug actions:
 * - Toggle the performance overlay visibility
 * - Export a performance report JSON to the app Documents directory
 */
export const DevDebugMenu: React.FC = () => {
  if (!__DEV__) return null

  const [status, setStatus] = useState<string | null>(null)
  const [overlayEnabled, setOverlayEnabled] = useState(devSettings.isOverlayEnabled())
  const [lastExportPath, setLastExportPath] = useState<string | null>(null)

  const toggleOverlay = useCallback(() => {
    const next = !overlayEnabled
    setOverlayEnabled(next)
    devSettings.setOverlayEnabled(next)
    setStatus(next ? 'Overlay enabled' : 'Overlay disabled')
    setTimeout(() => setStatus(null), 1500)
  }, [overlayEnabled])

  const exportReport = useCallback(async () => {
    try {
      const report = performanceMetrics.generateReport()
      const fileName = `perf-report-${Date.now()}.json`
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`
      await RNFS.writeFile(filePath, JSON.stringify(report, null, 2), 'utf8')
      setLastExportPath(filePath)
      setStatus(`Saved: ${filePath}`)
    } catch (e) {
      setStatus('Export failed')
    }
  }, [])

  const shareReport = useCallback(async () => {
    try {
      const report = performanceMetrics.generateReport()
      await Share.share({
        title: 'Performance Report',
        message: JSON.stringify(report, null, 2),
      })
      setStatus('Share sheet opened')
    } catch (e) {
      setStatus('Share cancelled')
    }
  }, [])

  const copyReport = useCallback(async () => {
    try {
      const report = performanceMetrics.generateReport()
      const text = JSON.stringify(report, null, 2)
      if (Clipboard && typeof Clipboard.setString === 'function') {
        Clipboard.setString(text)
        setStatus('Report copied to clipboard')
      } else {
        setStatus('Clipboard module not installed')
      }
    } catch (e) {
      setStatus('Copy failed')
    }
  }, [])

  const close = useCallback(() => {
    devSettings.setDebugMenuOpen(false)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Menu</Text>
        <TouchableOpacity onPress={close} accessibilityRole="button" accessibilityLabel="Close debug menu">
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overlay</Text>
        <TouchableOpacity style={[styles.btn, overlayEnabled ? styles.primary : styles.secondary]} onPress={toggleOverlay}
          accessibilityRole="button" accessibilityLabel="Toggle performance overlay">
          <Text style={styles.btnText}>{overlayEnabled ? 'Disable Overlay' : 'Enable Overlay'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Report</Text>
        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={exportReport}
          accessibilityRole="button" accessibilityLabel="Export performance report to file">
          <Text style={styles.btnText}>Export Report (JSON)</Text>
        </TouchableOpacity>
        <View style={{ height: 8 }} />
        <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={shareReport}
          accessibilityRole="button" accessibilityLabel="Share performance report via system share sheet">
          <Text style={styles.btnText}>Share Report</Text>
        </TouchableOpacity>
        <View style={{ height: 8 }} />
        <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={copyReport}
          accessibilityRole="button" accessibilityLabel="Copy performance report to clipboard">
          <Text style={styles.btnText}>Copy to Clipboard</Text>
        </TouchableOpacity>
        {lastExportPath ? (
          <>
            <View style={{ height: 8 }} />
            <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={async () => {
              try {
                const url = lastExportPath.startsWith('file://') ? lastExportPath : `file://${lastExportPath}`
                await Share.share({ title: 'Performance Report JSON', url, message: lastExportPath })
                setStatus('Share sheet opened')
              } catch (e) {
                setStatus('Share cancelled')
              }
            }}
              accessibilityRole="button" accessibilityLabel="Share last exported report file">
              <Text style={styles.btnText}>Share Exported File</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {status && <Text style={styles.status}>{status}</Text>}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AppColors.background,
    padding: 16,
    zIndex: 10000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: AppColors.text,
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 22,
  },
  close: {
    color: AppColors.text,
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 22,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: AppColors.text,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    marginBottom: 8,
  },
  btn: {
    paddingVertical: 12,
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
    fontSize: 14,
  },
  status: {
    color: AppColors.text,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    marginTop: 16,
    opacity: 0.85,
  },
})
