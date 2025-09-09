type Listener = () => void

class DevSettings {
  private overlayEnabled = true
  private debugMenuOpen = false
  private listeners = new Set<Listener>()

  isOverlayEnabled() {
    return this.overlayEnabled
  }

  setOverlayEnabled(enabled: boolean) {
    if (this.overlayEnabled !== enabled) {
      this.overlayEnabled = enabled
      this.emit()
    }
  }

  isDebugMenuOpen() {
    return this.debugMenuOpen
  }

  setDebugMenuOpen(open: boolean) {
    if (this.debugMenuOpen !== open) {
      this.debugMenuOpen = open
      this.emit()
    }
  }

  onChange(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit() {
    this.listeners.forEach((l) => {
      try {
        l()
      } catch {}
    })
  }
}

export const devSettings = new DevSettings()
