// types/auth.ts

export interface LoginFormData {
  username: string
  password: string
}

export interface LoginFormErrors {
  username?: string
  password?: string
  general?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: LoginFormErrors
}

export interface InputFieldProps {
  type: "text" | "password"
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon: React.ElementType
  error?: string
  disabled: boolean
  showPasswordToggle?: boolean
  onTogglePassword?: () => void
  showPassword?: boolean
}

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}
