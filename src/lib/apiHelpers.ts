import { useToast } from "@/components/ui/Toast"

export interface ApiError {
  message: string
  errors?: string[]
  status?: number
}

/**
 * Handles API errors consistently across the application
 * Shows toast notifications and returns error information
 */
export const handleApiError = (
  error: unknown,
  showToast: (message: string, type?: "error" | "success" | "warning" | "info") => void,
  defaultMessage = "Une erreur est survenue"
): ApiError => {
  let errorMessage = defaultMessage
  let errors: string[] = []
  let status: number | undefined

  if (error instanceof Response) {
    status = error.status
    error
      .json()
      .then((data) => {
        errorMessage = data.message || defaultMessage
        errors = data.errors || []
      })
      .catch(() => {
        errorMessage = `Erreur ${status}: ${error.statusText}`
      })
  } else if (error instanceof Error) {
    errorMessage = error.message || defaultMessage
  } else if (typeof error === "string") {
    errorMessage = error
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = String(error.message)
    if ("errors" in error && Array.isArray(error.errors)) {
      errors = error.errors as string[]
    }
    if ("status" in error) {
      status = error.status as number
    }
  }

  showToast(errorMessage, "error")
  
  return { message: errorMessage, errors, status }
}

/**
 * Wrapper for fetch with error handling
 */
export const fetchWithErrorHandling = async (
  url: string,
  options: RequestInit = {},
  showToast: (message: string, type?: "error" | "success" | "warning" | "info") => void
): Promise<Response> => {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Erreur ${response.status}: ${response.statusText}`
      }))
      
      handleApiError(
        {
          message: errorData.message || `Erreur ${response.status}`,
          status: response.status,
          errors: errorData.errors
        },
        showToast
      )
      
      throw new Error(errorData.message || `Erreur ${response.status}`)
    }
    
    return response
  } catch (error) {
    if (error instanceof Error && error.message.includes("fetch")) {
      handleApiError("Erreur de connexion au serveur", showToast)
    } else {
      handleApiError(error, showToast)
    }
    throw error
  }
}

