"use client"
import React, { useState, ChangeEvent } from "react"
import { Eye, EyeOff, Lock, User, Shield, AlertCircle } from "lucide-react"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  LoginFormData,
  LoginFormErrors,
  ValidationResult,
  InputFieldProps,
  LoadingSpinnerProps
} from "@/types/auth"

// Configuration
const CONFIG = {
  MAX_LOGIN_ATTEMPTS: 3,
  BLOCK_DURATION_MS: 5 * 60 * 1000,
  MIN_USERNAME_LENGTH: 3,
  MIN_PASSWORD_LENGTH: 6,
  DEMO_CREDENTIALS: {
    username: "admin",
    password: "password123"
  }
} as const

// Composant Spinner
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = ""
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  }

  return (
    <div
      className={`border-2 border-white/30 border-t-white rounded-full animate-spin ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Chargement"
    />
  )
}

// Composant Champ d'entrée
const InputField: React.FC<InputFieldProps> = ({
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  disabled,
  showPasswordToggle = false,
  onTogglePassword,
  showPassword = false
}) => {
  const inputType = type === "password" && showPassword ? "text" : type

  return (
    <div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
          <Icon size={18} className="text-gray-400" />
        </div>
        <input
          type={inputType}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          className={`w-full pl-10 pr-${
            showPasswordToggle ? "10" : "3"
          } py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 text-sm ${
            error
              ? "border-red-400 focus:ring-red-400/50"
              : "border-white/20 focus:border-firstColor focus:ring-firstColor/50"
          }`}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={type === "password" ? "current-password" : "username"}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
            disabled={disabled}
            aria-label={
              showPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-red-400 text-xs flex items-center">
          <AlertCircle size={12} className="mr-1" />
          {error}
        </p>
      )}
    </div>
  )
}

// Composant principal
const AdminLoginPage: React.FC = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: ""
  })

  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [loginAttempts, setLoginAttempts] = useState<number>(0)
  const [isBlocked, setIsBlocked] = useState<boolean>(false)
  const [blockTimer, setBlockTimer] = useState<NodeJS.Timeout | null>(null)

  const handleChange = (field: keyof LoginFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): ValidationResult => {
    const newErrors: LoginFormErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis"
    } else if (formData.username.length < CONFIG.MIN_USERNAME_LENGTH) {
      newErrors.username = `Minimum ${CONFIG.MIN_USERNAME_LENGTH} caractères`
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis"
    } else if (formData.password.length < CONFIG.MIN_PASSWORD_LENGTH) {
      newErrors.password = `Minimum ${CONFIG.MIN_PASSWORD_LENGTH} caractères`
    }

    setErrors(newErrors)
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    }
  }

  const blockAccount = (): void => {
    setIsBlocked(true)
    if (blockTimer) {
      clearTimeout(blockTimer)
    }

    const timer = setTimeout(() => {
      setIsBlocked(false)
      setLoginAttempts(0)
    }, CONFIG.BLOCK_DURATION_MS)

    setBlockTimer(timer)
  }

  // const handleSubmit = async (): Promise<void> => {
  //   if (isBlocked) {
  //     alert("Compte bloqué. Réessayez dans quelques minutes.")
  //     return
  //   }

  //   const validation = validateForm()
  //   if (!validation.isValid) return

  //   setIsLoading(true)

  //   try {
  //     await new Promise<void>((resolve) => setTimeout(resolve, 1500))

  //     const isValidCredentials =
  //       formData.username === CONFIG.DEMO_CREDENTIALS.username &&
  //       formData.password === CONFIG.DEMO_CREDENTIALS.password

  //     if (isValidCredentials) {
  //       alert("Connexion réussie ! Redirection...")
  //       setLoginAttempts(0)
  //       setErrors({})
  //     } else {
  //       const newAttempts = loginAttempts + 1
  //       setLoginAttempts(newAttempts)

  //       if (newAttempts >= CONFIG.MAX_LOGIN_ATTEMPTS) {
  //         blockAccount()
  //         setErrors({
  //           general: "Trop de tentatives. Compte bloqué 5 min."
  //         })
  //       } else {
  //         setErrors({
  //           general: `Identifiants incorrects (${newAttempts}/${CONFIG.MAX_LOGIN_ATTEMPTS})`
  //         })
  //       }
  //     }
  //   } catch (error) {
  //     setErrors({ general: "Erreur de connexion" })
  //     console.log(error)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }
  const handleSubmit = async (): Promise<void> => {
    if (isBlocked) {
      alert("Compte bloqué. Réessayez dans quelques minutes.")
      return
    }

    const validation = validateForm()
    if (!validation.isValid) return

    setIsLoading(true)

    try {
      // 🔐 Appel NextAuth avec redirect: false pour gérer manuellement
      const result = await signIn("credentials", {
        redirect: false,
        username: formData.username,
        password: formData.password
      })

      // Dans NextAuth v5, la réponse peut être undefined, un objet avec error, ou un objet avec ok/url
      if (result?.error) {
        console.error("SignIn error:", result.error)
        const newAttempts = loginAttempts + 1
        setLoginAttempts(newAttempts)

        if (newAttempts >= CONFIG.MAX_LOGIN_ATTEMPTS) {
          blockAccount()
          setErrors({
            general: "Trop de tentatives. Compte bloqué 5 min."
          })
        } else {
          setErrors({
            general: `Identifiants incorrects (${newAttempts}/${CONFIG.MAX_LOGIN_ATTEMPTS})`
          })
        }
      } else if (result === undefined || result === null) {
        // Cas où result est undefined - peut arriver dans NextAuth v5
        console.warn("SignIn returned undefined - trying redirect anyway")
        setLoginAttempts(0)
        setErrors({})
        await new Promise(resolve => setTimeout(resolve, 500))
        window.location.href = "/fr/dashboard"
      } else {
        // ✅ Connexion réussie (pas d'erreur) → redirection vers le dashboard
        setLoginAttempts(0)
        setErrors({})
        
        // Attendre un peu pour que le cookie de session soit bien créé
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Forcer la redirection avec window.location pour être sûr que ça fonctionne
        // même si le middleware n'a pas encore détecté la session
        window.location.href = "/fr/dashboard"
      }
    } catch (error) {
      console.error("Login error:", error)
      console.error("Login error details:", JSON.stringify(error, null, 2))
      setErrors({
        general: "Erreur de connexion. Veuillez réessayer."
      })
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    return () => {
      if (blockTimer) {
        clearTimeout(blockTimer)
      }
    }
  }, [blockTimer])

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-firstColor/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-firstColor/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-secondColor/10 rounded-full blur-2xl animate-bounce"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Card principale */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header compact */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3">
              <Image
                src="/logo.png"
                alt="logo"
                height={32}
                width={32}
                className=" object-cover rounded-lg animate-bounce"
              />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Admin</h1>
            <p className="text-gray-300 text-sm">
              Panneau d&apos;administration
            </p>
          </div>

          {/* Formulaire compact */}
          <div className="px-6 pb-6">
            {errors.general && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg flex items-start">
                <AlertCircle
                  size={16}
                  className="text-red-400 mr-2 mt-0.5 flex-shrink-0"
                />
                <span className="text-red-300 text-xs">{errors.general}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Nom d'utilisateur */}
              <div>
                <label className="block text-gray-300 text-xs font-medium mb-2">
                  Nom d&apos;utilisateur
                </label>
                <InputField
                  type="text"
                  value={formData.username}
                  onChange={(value) => handleChange("username", value)}
                  placeholder="admin"
                  icon={User}
                  error={errors.username}
                  disabled={isLoading || isBlocked}
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-gray-300 text-xs font-medium mb-2">
                  Mot de passe
                </label>
                <InputField
                  type="password"
                  value={formData.password}
                  onChange={(value) => handleChange("password", value)}
                  placeholder="password123"
                  icon={Lock}
                  error={errors.password}
                  disabled={isLoading || isBlocked}
                  showPasswordToggle={true}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  showPassword={showPassword}
                />
              </div>

              {/* Indicateur tentatives */}
              {loginAttempts > 0 && !isBlocked && (
                <div className="flex items-center justify-center p-2 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                  <AlertCircle size={14} className="text-yellow-400 mr-2" />
                  <span className="text-yellow-300 text-xs">
                    Échec: {loginAttempts}/{CONFIG.MAX_LOGIN_ATTEMPTS}
                  </span>
                </div>
              )}

              {/* Bouton connexion */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || isBlocked}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-300 transform ${
                  isLoading || isBlocked
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-firstColor to-secondColor text-white hover:from-firstColor/90 hover:to-secondColor/90 hover:scale-[1.02] shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Connexion...
                  </div>
                ) : isBlocked ? (
                  <div className="flex items-center justify-center">
                    <Lock size={16} className="mr-2" />
                    Bloqué
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Shield size={16} className="mr-2" />
                    Se connecter
                  </div>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center">
              <p className="text-gray-500 text-xs">© 2025 SWEET MACARONS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
