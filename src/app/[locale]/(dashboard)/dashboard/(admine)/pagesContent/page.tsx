// export default HeroContentAdmin

"use client"

import React, { useState, useEffect } from "react"
import {
  Save,
  Trash2,
  Plus,
  Eye,
  ArrowUp,
  ArrowDown,
  Edit,
  Image as ImageIcon,
  Type,
  MousePointer,
  Loader2,
  Upload,
  X
} from "lucide-react"
import Image from "next/image"
import axios from "axios"
import { useToast } from "@/components/ui/Toast"
import { uploadFilesDirectlyToS3 } from "@/lib/uploadToS3"

// Types
interface HeroContent {
  title: {
    ar: string
    fr: string
  }
  description: {
    ar: string
    fr: string
  }
  button: {
    ar: string
    fr: string
  }
  images: string[]
}

const HeroContentAdmin: React.FC = () => {
  const { showToast } = useToast()
  const [currentLanguage, setCurrentLanguage] = useState<"fr" | "ar">("fr")
  const [activeTab, setActiveTab] = useState<"content" | "images">("content")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // États du contenu Hero
  const [heroContent, setHeroContent] = useState<HeroContent>({
    title: { ar: "", fr: "" },
    description: { ar: "", fr: "" },
    button: { ar: "", fr: "" },
    images: []
  })

  // États pour la gestion des images S3
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [initialImages, setInitialImages] = useState<string[]>([])

  // Charger les données au montage du composant
  useEffect(() => {
    fetchHeroContent()
  }, [])

  const fetchHeroContent = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.get("/api/hero-content")

      if (response.data.success) {
        setHeroContent({
          title: response.data.data.title,
          description: response.data.data.description,
          button: response.data.data.button,
          images: response.data.data.images
        })
        setInitialImages(response.data.data.images || [])
      } else {
        showToast("Erreur lors du chargement des données", "error")
        setError("Erreur lors du chargement des données")
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(err.response?.data?.message || "Erreur de connexion au serveur", "error")
        setError(
          err.response?.data?.message || "Erreur de connexion au serveur"
        )
      } else {
        setError("Erreur inattendue")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Gestion des fichiers images pour S3
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const newFiles = Array.from(e.target.files)

    // Validation des fichiers
    const validFiles = newFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        alert("Seules les images sont autorisées")
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("La taille de l'image ne doit pas dépasser 5MB")
        return false
      }
      return true
    })

    setImageFiles((prev) => [...prev, ...validFiles])

    // Créer les prévisualisations
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file))
    setImagePreviews((prev) => [...prev, ...newPreviews])
  }

  // Supprimer une nouvelle image avant upload
  const handleRemoveNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))

    // Libérer l'URL de prévisualisation
    URL.revokeObjectURL(imagePreviews[index])
  }

  // Upload des images vers S3
  const uploadImagesToS3 = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return []

    setUploadingImages(true)

    try {
      const urls = await uploadFilesDirectlyToS3(imageFiles, {
        compress: true,
        maxWidth: 1920,
        quality: 85
      })

      return urls
    } catch (err) {
      console.error("Upload error:", err)
      showToast("Erreur lors de l'upload des images", "error")
      throw new Error("Erreur lors de l'upload des images")
    } finally {
      setUploadingImages(false)
    }
  }

  // Supprimer une image de S3 avec meilleure gestion d'erreurs
  const deleteImageFromS3 = async (imageUrl: string) => {
    try {
      // Extraire le nom du fichier de l'URL
      const fileName = imageUrl.split("/").pop()
      if (fileName) {
        const response = await axios.delete("/api/delete", {
          data: { fileName }
        })
        if (response.data.success) {
          return true
        } else {
          console.warn(
            `Problème avec la suppression S3: ${response.data.message}`
          )
          return false
        }
      }
      return false
    } catch (error) {
      // Erreur silencieuse - ne pas propager l'erreur pour ne pas bloquer le processus
      return false
    }
  }

  // Supprimer une image existante - CORRIGÉ
  const removeExistingImage = async (index: number) => {
    const imageToRemove = heroContent.images[index]

    // Vérifier si l'image fait partie des images initiales (stockées dans S3)
    const isFromS3 = initialImages.includes(imageToRemove)

    if (isFromS3) {
      // Marquer l'image pour suppression lors de la sauvegarde
      // Ne pas supprimer immédiatement de S3
    }

    // Supprimer l'image du contenu hero immédiatement (UI seulement)
    setHeroContent((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  // Handlers pour le contenu
  const updateHeroField = (
    field: keyof HeroContent,
    language: "fr" | "ar",
    value: string
  ) => {
    setHeroContent((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [language]: value
      }
    }))
  }

  const moveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...heroContent.images]
    if (direction === "up" && index > 0) {
      ;[newImages[index], newImages[index - 1]] = [
        newImages[index - 1],
        newImages[index]
      ]
    } else if (direction === "down" && index < newImages.length - 1) {
      ;[newImages[index], newImages[index + 1]] = [
        newImages[index + 1],
        newImages[index]
      ]
    }
    setHeroContent((prev) => ({ ...prev, images: newImages }))
  }

  // Validation avant sauvegarde
  const validateForm = (): { isValid: boolean; message: string } => {
    // Vérifier les titres
    if (!heroContent.title.fr.trim() || !heroContent.title.ar.trim()) {
      return {
        isValid: false,
        message:
          "Veuillez remplir le titre dans les deux langues (français et arabe) avant de sauvegarder."
      }
    }

    // Vérifier au moins une image
    if (heroContent.images.length === 0 && imagePreviews.length === 0) {
      return {
        isValid: false,
        message: "Veuillez ajouter au moins une image avant de sauvegarder."
      }
    }

    return { isValid: true, message: "" }
  }

  const handleSave = async () => {
    try {
      // Validation avant sauvegarde
      const validation = validateForm()
      if (!validation.isValid) {
        setError(validation.message)
        setTimeout(() => setError(null), 5000)
        return
      }

      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      let imageUrls: string[] = [...heroContent.images]

      // Upload des nouveaux fichiers vers S3
      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadImagesToS3()
        imageUrls = [...imageUrls, ...uploadedUrls]
      }

      // Identifier les images supprimées (présentes dans initialImages mais pas dans imageUrls)
      const deletedImages = initialImages.filter(
        (initialImage) => !imageUrls.includes(initialImage)
      )

      // Supprimer les images de S3 - UNIQUEMENT lors de la sauvegarde
      if (deletedImages.length > 0) {
        for (const deletedImage of deletedImages) {
          try {
            await deleteImageFromS3(deletedImage)
          } catch (error) {
            // Erreur silencieuse - continuer même si une suppression échoue
          }
        }
      }

      const response = await axios.put("/api/hero-content", {
        title: heroContent.title,
        description: heroContent.description,
        button: heroContent.button,
        images: imageUrls
      })

      if (response.data.success) {
        setSuccessMessage("Contenu sauvegardé avec succès !")
        // Mettre à jour les images initiales
        setInitialImages(imageUrls)
        // Réinitialiser les fichiers et prévisualisations
        setImageFiles([])
        setImagePreviews([])
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        showToast(response.data.message || "Erreur lors de la sauvegarde", "error")
        setError(response.data.message || "Erreur lors de la sauvegarde")
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(err.response?.data?.message || "Erreur lors de la sauvegarde", "error")
        setError(
          err.response?.data?.message ||
            `Erreur ${err.response?.status}: ${err.response?.statusText}`
        )
      } else {
        setError("Erreur inattendue lors de la sauvegarde")
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Messages de succès et d'erreur */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Edit className="mr-3" size={32} />
                Gestion du Contenu Hero Section
              </h1>
              <p className="text-gray-600 mt-2">
                Modifiez le contenu principal, les images et les réseaux sociaux
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white rounded-lg border">
                <button
                  onClick={() => setCurrentLanguage("fr")}
                  className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                    currentLanguage === "fr"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => setCurrentLanguage("ar")}
                  className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                    currentLanguage === "ar"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  AR
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || uploadingImages}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSaving || uploadingImages ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    {uploadingImages ? "Upload des images..." : "Sauvegarde..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={20} />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section de statistiques */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ImageIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Images</p>
                <p className="text-2xl font-bold text-gray-800">
                  {heroContent.images.length + imagePreviews.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation onglets */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              {
                id: "content",
                label: "Contenu Texte",
                icon: <Type className="w-4 h-4" />
              },
              {
                id: "images",
                label: "Images",
                icon: <ImageIcon className="w-4 h-4" />
              }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panneau d'édition */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {activeTab === "content" && "Édition du Contenu"}
              {activeTab === "images" && "Gestion des Images"}
            </h2>

            {/* Onglet Contenu */}
            {activeTab === "content" && (
              <div className="space-y-6">
                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Titre de la section *
                  </label>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Français *
                      </label>
                      <input
                        type="text"
                        value={heroContent.title.fr}
                        onChange={(e) =>
                          updateHeroField("title", "fr", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Titre en français"
                      />
                      {!heroContent.title.fr.trim() && (
                        <p className="text-red-500 text-xs mt-1">
                          Le titre français est obligatoire
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        العربية *
                      </label>
                      <input
                        type="text"
                        value={heroContent.title.ar}
                        onChange={(e) =>
                          updateHeroField("title", "ar", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="العنوان بالعربية"
                        dir="rtl"
                      />
                      {!heroContent.title.ar.trim() && (
                        <p className="text-red-500 text-xs mt-1">
                          العنوان بالعربية إلزامي
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Description
                  </label>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Français
                      </label>
                      <textarea
                        value={heroContent.description.fr}
                        onChange={(e) =>
                          updateHeroField("description", "fr", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Description en français"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        العربية
                      </label>
                      <textarea
                        value={heroContent.description.ar}
                        onChange={(e) =>
                          updateHeroField("description", "ar", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="الوصف بالعربية"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>

                {/* Bouton */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Texte du bouton
                  </label>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Français
                      </label>
                      <input
                        type="text"
                        value={heroContent.button.fr}
                        onChange={(e) =>
                          updateHeroField("button", "fr", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Texte du bouton en français"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        العربية
                      </label>
                      <input
                        type="text"
                        value={heroContent.button.ar}
                        onChange={(e) =>
                          updateHeroField("button", "ar", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="نص الزر بالعربية"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Images */}
            {activeTab === "images" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">
                    Images Hero (
                    {heroContent.images.length + imagePreviews.length}) *
                  </h3>
                </div>

                {/* Message d'avertissement si aucune image */}
                {heroContent.images.length === 0 &&
                  imagePreviews.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ Vous devez ajouter au moins une image pour pouvoir
                        sauvegarder.
                      </p>
                    </div>
                  )}

                {/* Zone d'upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isSaving || uploadingImages}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload size={48} className="text-gray-400" />
                    <div>
                      <span className="text-blue-500 font-medium">
                        Cliquez pour sélectionner
                      </span>
                      <span className="text-gray-500">
                        {" "}
                        ou glissez-déposez vos images
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, GIF jusqu&apos;à 5MB chacune
                    </p>
                  </label>
                </div>

                {/* Affichage de TOUTES les images */}
                {(heroContent.images.length > 0 ||
                  imagePreviews.length > 0) && (
                  <div className="space-y-4">
                    {/* Images existantes */}
                    {heroContent.images.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-3">
                          Images existantes ({heroContent.images.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {heroContent.images.map((image, index) => (
                            <div
                              key={`existing-${index}`}
                              className="relative group"
                            >
                              <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border-2 border-green-200">
                                <Image
                                  src={image || "/No_Image_Available.jpg"}
                                  alt={`Image existante ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute top-2 right-2 flex space-x-1">
                                  <button
                                    onClick={() => moveImage(index, "up")}
                                    disabled={index === 0}
                                    className="p-1 bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    onClick={() => moveImage(index, "down")}
                                    disabled={
                                      index === heroContent.images.length - 1
                                    }
                                    className="p-1 bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                  <button
                                    onClick={() => removeExistingImage(index)}
                                    className="p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    disabled={isSaving}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center truncate">
                                Image {index + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nouvelles images (prévisualisations) */}
                    {imagePreviews.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-3">
                          Nouvelles images à uploader ({imagePreviews.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {imagePreviews.map((src, index) => (
                            <div
                              key={`new-${index}`}
                              className="relative group"
                            >
                              <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border-2 border-blue-200">
                                <Image
                                  src={src}
                                  alt={`Nouvelle image ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNewImage(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  disabled={isSaving || uploadingImages}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center truncate">
                                {imageFiles[index]?.name ||
                                  `Nouvelle ${index + 1}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {heroContent.images.length === 0 &&
                  imagePreviews.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune image ajoutée</p>
                      <p className="text-sm">
                        Cliquez sur la zone ci-dessus pour ajouter des images
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Panneau d'aperçu */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Eye className="mr-2" size={20} />
              Aperçu ({currentLanguage.toUpperCase()})
            </h2>

            {/* Aperçu Hero Section */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="text-center space-y-4">
                <h1
                  className={`text-2xl md:text-3xl font-bold text-gray-800 ${
                    currentLanguage === "ar" ? "font-arabic" : ""
                  }`}
                  dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                >
                  {heroContent.title[currentLanguage] || "Titre vide"}
                </h1>

                <p
                  className={`text-gray-600 ${
                    currentLanguage === "ar" ? "font-arabic" : ""
                  }`}
                  dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                >
                  {heroContent.description[currentLanguage] ||
                    "Description vide"}
                </p>

                <button className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <MousePointer className="mr-2" size={16} />
                  {heroContent.button[currentLanguage] || "Texte du bouton"}
                </button>
              </div>

              {/* Aperçu des images */}
              {activeTab === "images" &&
                (heroContent.images.length > 0 || imagePreviews.length > 0) && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Images Hero (
                      {heroContent.images.length + imagePreviews.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[...heroContent.images, ...imagePreviews]
                        .slice(0, 4)
                        .map((image, index) => (
                          <div
                            key={index}
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                          >
                            <Image
                              src={image}
                              width={150}
                              height={150}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                    </div>
                    {heroContent.images.length + imagePreviews.length > 4 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        +{heroContent.images.length + imagePreviews.length - 4}{" "}
                        autres images
                      </p>
                    )}
                  </div>
                )}
            </div>

            {/* Informations supplémentaires */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Informations
              </h3>
              <div className="space-y-1 text-xs text-gray-600">
                <p>
                  • Total images:{" "}
                  {heroContent.images.length + imagePreviews.length}
                </p>
                <p>• Langues disponibles: Français, العربية</p>
              </div>
            </div>

            {/* Conseils */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Conseils
              </h3>
              <ul className="space-y-1 text-xs text-blue-700">
                <li>• Utilisez des images de haute qualité (min. 800x800px)</li>
                <li>
                  • Gardez les titres courts et percutants (max. 60 caractères)
                </li>
                <li>• N&apos;oubliez pas de remplir les deux langues</li>
                <li>
                  • Les changements sont sauvegardés dans la base de données
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde en bas de page (version mobile) */}
        <div className="mt-8 lg:hidden">
          <button
            onClick={handleSave}
            disabled={isSaving || uploadingImages}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSaving || uploadingImages ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={20} />
                {uploadingImages
                  ? "Upload des images..."
                  : "Sauvegarde en cours..."}
              </>
            ) : (
              <>
                <Save className="mr-2" size={20} />
                Sauvegarder les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeroContentAdmin
