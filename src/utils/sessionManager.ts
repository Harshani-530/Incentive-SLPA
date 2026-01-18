/**
 * Session Manager
 * Handles automatic logout after 30 minutes of inactivity
 */

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
const ACTIVITY_CHECK_INTERVAL = 60 * 1000 // Check every minute

class SessionManager {
  private lastActivityTime: number = Date.now()
  private checkInterval: number | null = null
  private onLogout: (() => void) | null = null

  /**
   * Initialize session manager with logout callback
   */
  initialize(onLogout: () => void) {
    this.onLogout = onLogout
    this.lastActivityTime = Date.now()
    
    // Update activity on user interactions
    this.setupActivityListeners()
    
    // Start checking for inactivity
    this.startInactivityCheck()
  }

  /**
   * Setup listeners for user activity
   */
  private setupActivityListeners() {
    const updateActivity = () => {
      this.lastActivityTime = Date.now()
    }

    // Track various user activities
    window.addEventListener('mousedown', updateActivity)
    window.addEventListener('keydown', updateActivity)
    window.addEventListener('scroll', updateActivity)
    window.addEventListener('touchstart', updateActivity)
  }

  /**
   * Start periodic check for inactivity
   */
  private startInactivityCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - this.lastActivityTime

      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        this.handleInactiveLogout()
      }
    }, ACTIVITY_CHECK_INTERVAL)
  }

  /**
   * Handle automatic logout due to inactivity
   */
  private handleInactiveLogout() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    if (this.onLogout) {
      this.onLogout()
    }
  }

  /**
   * Manually update last activity time
   */
  updateActivity() {
    this.lastActivityTime = Date.now()
  }

  /**
   * Get remaining time before auto-logout (in milliseconds)
   */
  getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActivityTime
    return Math.max(0, INACTIVITY_TIMEOUT - elapsed)
  }

  /**
   * Cleanup session manager
   */
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

export const sessionManager = new SessionManager()
