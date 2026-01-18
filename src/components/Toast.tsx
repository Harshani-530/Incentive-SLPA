import { useEffect } from 'react'
import './Toast.css'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  isOpen: boolean
  onClose: () => void
  duration?: number
}

function Toast({ message, type, isOpen, onClose, duration }: ToastProps) {
  useEffect(() => {
    if (isOpen) {
      // Calculate duration based on message length if not provided
      // Average reading speed: 200-250 words per minute (3-4 words per second)
      // Give extra time for comprehension
      const wordCount = message.split(' ').length
      const calculatedDuration = Math.max(3000, Math.min(wordCount * 800, 15000)) // Min 3s, Max 15s
      const autoDuration = duration !== undefined ? duration : calculatedDuration

      if (autoDuration > 0) {
        const timer = setTimeout(() => {
          onClose()
        }, autoDuration)

        return () => clearTimeout(timer)
      }
    }
  }, [isOpen, duration, onClose, message])

  if (!isOpen) return null

  const icons = {
    success: <i className="fi fi-sr-check-circle"></i>,
    error: <i className="fi fi-sr-cross-circle"></i>,
    info: <i className="fi fi-sr-info"></i>,
    warning: <i className="fi fi-sr-exclamation"></i>
  }

  return (
    <>
      <div className="toast-overlay" onClick={onClose}></div>
      <div className={`toast-modal toast-modal-${type}`}>
        <div className="toast-modal-icon">{icons[type]}</div>
        <div className="toast-modal-message">{message}</div>
        <button className="toast-modal-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </>
  )
}

export default Toast
