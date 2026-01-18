import { useState } from 'react'
import './PasswordInput.css'

interface PasswordInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  autoComplete?: string
}

function PasswordInput({ value, onChange, placeholder, className, disabled, autoComplete }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="password-input-wrapper">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? (
          <i className="fi fi-sr-eye"></i>
        ) : (
          <i className="fi fi-sr-eye-crossed"></i>
        )}
      </button>
    </div>
  )
}

export default PasswordInput
