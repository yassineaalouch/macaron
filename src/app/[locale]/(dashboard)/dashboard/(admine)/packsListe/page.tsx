"use client"

import React, { useState, useEffect, useRef } from "react"
import axios from "axios"
import {
  Package,
  Plus,
  Search,
  Trash2,
  Save,
  X,
  ImageIcon,
  Minus,
  Calculator,
  Loader2,
  Upload,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Image from "next/image"
import { Product } from "@/types/product"
import { getMainImage } from "@/lib/getMainImage"
import { PackFormData, ProductPack, SelectedPackItem } from "@/types/pack"
import { ManagementCard } from "@/components/dashboard/ManagementCard"
import { useToast } from "@/components/ui/Toast"
import { uploadFilesDirectlyToS3 } from "@/lib/uploadToS3"

const AdminPackCreator: React.FC = () => {
  const { showToast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [editingPack, setEditingPack] = useState<ProductPack | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<SelectedPackItem[]>(
    []
  )
  const [currentLanguage, setCurrentLanguage] = useState<"fr" | "ar">("fr")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [packs, setPacks] = useState<ProductPack[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  
  // Pagination state for products
  const [productsPage, setProductsPage] = useState(1)
  const [productsTotalPages, setProductsTotalPages] = useState(1)
  const [productsTotal, setProductsTotal] = useState(0)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // États pour la gestion des images S3
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [initialImages, setInitialImages] = useState<string[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]) // Images marquées pour suppression

  const [formData, setFormData] = useState<PackFormData>({
    name: { fr: "", ar: "" },
    description: { fr: "", ar: "" },
    discountPrice: "",
    images: []
  })

  // Charger les packs au montage du composant
  useEffect(() => {
    fetchPacks()
  }, [])

  // Charger les produits avec pagination et recherche
  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, productsPage])

  // Debounce search term - wait 0.3s after user stops typing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setProductsPage(1) // Reset to first page when search changes
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm])

  // Fonction pour récupérer les produits depuis l'API avec pagination et recherche
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const params = new URLSearchParams()
      
      // Add search parameter if there's a search term
      if (debouncedSearchTerm.trim()) {
        params.append("search", debouncedSearchTerm.trim())
      }
      
      // Filter only in-stock products
      params.append("status", "inStock")
      
      // Add pagination
      params.append("page", productsPage.toString())
      params.append("limit", "12")
      
      // Add language for sorting
      params.append("language", currentLanguage)
      params.append("sortField", "name")
      params.append("sortDirection", "asc")
      
      const response = await axios.get(`/api/products?${params.toString()}`)
      if (response.data.success) {
        setAvailableProducts(response.data.products || [])
        if (response.data.pagination) {
          setProductsTotalPages(response.data.pagination.totalPages || 1)
          setProductsTotal(response.data.pagination.totalProducts || 0)
        }
      } else {
        showToast(
          response.data.message || "Erreur lors du chargement des produits",
          "error"
        )
        setAvailableProducts([])
      }
    } catch (err) {
      console.error("Error fetching products:", err)
      showToast("Erreur lors du chargement des produits", "error")
      setError("Impossible de charger les produits")
      setAvailableProducts([])
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // Fonction pour récupérer tous les packs
  const fetchPacks = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.get("/api/product-packs")

      if (response.data.success) {
        setPacks(response.data.data || [])
      } else {
        showToast(
          response.data.message || "Erreur lors du chargement des packs",
          "error"
        )
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(
          err.response?.data?.message || "Erreur de connexion au serveur",
          "error"
        )
        setError(
          err.response?.data?.message || "Erreur de connexion au serveur"
        )
      } else {
        setError("Erreur inattendue")
      }
      setPacks([])
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

  // Supprimer une image existante - NE PAS APPELER L'API DELETE IMMÉDIATEMENT
  const removeExistingImage = (index: number) => {
    const imageToRemove = formData.images[index]

    // Vérifier si l'image fait partie des images initiales (stockées dans S3)
    const isFromS3 = initialImages.includes(imageToRemove)

    if (isFromS3) {
      // Marquer l'image pour suppression future lors de la sauvegarde
      setImagesToDelete((prev) => [...prev, imageToRemove])
    }

    // Supprimer l'image du formulaire immédiatement (UI seulement)
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
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

  // Supprimer une image de S3 - UNIQUEMENT APPELÉE LORS DE LA SAUVEGARDE
  const deleteImageFromS3 = async (imageUrl: string) => {
    try {
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
      // Erreur silencieuse pour les suppressions S3
      return false
    }
  }

  // Validation du formulaire
  const validateForm = (): boolean => {
    // Vérifier les champs obligatoires
    if (
      !formData.name.fr.trim() ||
      !formData.name.ar.trim() ||
      !formData.description.ar.trim() ||
      !formData.description.ar.trim()
    ) {
      setError(
        "Le nom et description du pack en français et en arabe est obligatoire"
      )
      return false
    }

    // Vérifier qu'il y a au moins un produit
    if (selectedProducts.length === 0) {
      setError("Veuillez ajouter au moins un produit au pack")
      return false
    }

    // Vérifier qu'il y a au moins une image
    if (formData.images.length === 0 && imageFiles.length === 0) {
      setError("Veuillez ajouter au moins une image au pack")
      return false
    }

    // Vérifier que chaque produit a une quantité valide
    const invalidProduct = selectedProducts.find((item) => item.quantity <= 0)
    if (invalidProduct) {
      setError("Chaque produit doit avoir une quantité supérieure à 0")
      return false
    }

    setError(null)
    return true
  }

  // Fonction pour sauvegarder un pack
  const handleSavePack = async () => {
    // Validation du formulaire
    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      let imageUrls: string[] = [...formData.images]

      // Upload des nouveaux fichiers vers S3
      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadImagesToS3()
        imageUrls = [...imageUrls, ...uploadedUrls]
      }

      // Supprimer les images de S3 - UNIQUEMENT lors de la sauvegarde
      if (imagesToDelete.length > 0) {
        for (const deletedImage of imagesToDelete) {
          try {
            await deleteImageFromS3(deletedImage)
          } catch (error) {
            // Erreur silencieuse - continuer même si une suppression échoue
          }
        }
        // Vider la liste des images à supprimer après traitement
        setImagesToDelete([])
      }

      const totalPrice = calculateTotalPrice()

      const packData = {
        name: formData.name,
        description:
          formData.description.fr || formData.description.ar
            ? formData.description
            : undefined,
        items: selectedProducts.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        totalPrice,
        discountPrice: formData.discountPrice
          ? parseFloat(formData.discountPrice)
          : undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined
      }

      let response

      if (editingPack) {
        // Mise à jour d'un pack existant
        response = await axios.put(
          `/api/product-packs/${editingPack._id}`,
          packData
        )
      } else {
        // Création d'un nouveau pack
        response = await axios.post("/api/product-packs", packData)
      }

      if (response.data.success) {
        setSuccessMessage(
          editingPack ? "Pack modifié avec succès !" : "Pack créé avec succès !"
        )
        setTimeout(() => setSuccessMessage(null), 3000)

        // Recharger la liste des packs
        await fetchPacks()
        resetForm()
        showToast(
          editingPack ? "Pack modifié avec succès" : "Pack créé avec succès",
          "success"
        )
      } else {
        showToast(
          response.data.message || "Erreur lors de la sauvegarde",
          "error"
        )
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(
          err.response?.data?.message || "Erreur lors de la sauvegarde",
          "error"
        )
        if (err.response) {
          setError(
            err.response.data?.message ||
              `Erreur ${err.response.status}: ${err.response.statusText}`
          )
        } else if (err.request) {
          setError("Aucune réponse du serveur. Vérifiez votre connexion.")
        } else {
          setError(err.message || "Erreur lors de la requête")
        }
      } else {
        setError("Erreur inattendue lors de la sauvegarde")
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Fonction pour obtenir un produit par son ID
  const getProductById = async (productId: string): Promise<Product | undefined> => {
    // First check if product is in current page
    const product = availableProducts.find((p) => p._id === productId)
    if (product) return product
    
    // If not found, fetch it from API
    try {
      const response = await axios.get(`/api/products/${productId}`)
      if (response.data.success && response.data.product) {
        return response.data.product
      }
    } catch (error) {
      console.error("Error fetching product by ID:", error)
    }
    return undefined
  }

  // Fonction pour supprimer un pack
  const handleDeletePack = async (packId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce pack ?")) {
      return
    }

    try {
      setError(null)

      const response = await axios.delete(`/api/product-packs/${packId}`)

      if (response.data.success) {
        setSuccessMessage("Pack supprimé avec succès !")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Recharger la liste des packs
        await fetchPacks()
        showToast("Pack supprimé avec succès", "success")
      } else {
        showToast(
          response.data.message || "Erreur lors de la suppression",
          "error"
        )
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(
          err.response?.data?.message || "Erreur lors de la suppression",
          "error"
        )
        setError(err.response?.data?.message || "Erreur lors de la suppression")
      } else {
        setError("Erreur inattendue")
      }
    }
  }

  // Products are already filtered server-side, so we use availableProducts directly
  const filteredProducts = availableProducts

  // Handle pagination for products
  const handleProductsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= productsTotalPages) {
      setProductsPage(newPage)
    }
  }

  const calculateTotalPrice = () => {
    return selectedProducts.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    )
  }

  const addProductToPack = (product: Product) => {
    const existingItem = selectedProducts.find(
      (item) => item.productId === product._id
    )

    if (existingItem) {
      setSelectedProducts((prev) =>
        prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setSelectedProducts((prev) => [
        ...prev,
        { productId: product._id, product, quantity: 1 }
      ])
    }
  }

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromPack(productId)
      return
    }
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
  }

  const removeProductFromPack = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.filter((item) => item.productId !== productId)
    )
  }

  const resetForm = () => {
    setFormData({
      name: { fr: "", ar: "" },
      description: { fr: "", ar: "" },
      discountPrice: "",
      images: []
    })
    setSelectedProducts([])
    setIsCreating(false)
    setEditingPack(null)
    setImageFiles([])
    setImagePreviews([])
    setInitialImages([])
    setImagesToDelete([]) // Réinitialiser aussi les images à supprimer
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setProductsPage(1)
  }

  const handleEditPack = async (pack: ProductPack) => {
    setEditingPack(pack)
    setFormData({
      name: pack.name,
      description: pack.description || { fr: "", ar: "" },
      discountPrice: pack.discountPrice?.toString() || "",
      images: pack.images || []
    })

    // Définir les images initiales pour la gestion S3
    setInitialImages(pack.images || [])
    setImagesToDelete([]) // Réinitialiser les images à supprimer

    // Charger les produits complets pour chaque item du pack
    const itemsWithProducts: SelectedPackItem[] = []
    for (const item of pack.items) {
      const product = await getProductById(item.productId)
      if (product) {
        itemsWithProducts.push({
          productId: item.productId,
          product: product,
          quantity: item.quantity
        })
      }
    }

    setSelectedProducts(itemsWithProducts)
    setIsCreating(true)
  }

  // Affichage du chargement initial (only for packs, not products)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des packs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
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

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Package className="mr-3" size={32} />
                Gestion des Packs Produits
              </h1>
              <p className="text-gray-600 mt-2">{packs.length} packs créés</p>
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
                onClick={() => setIsCreating(true)}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus className="mr-2" size={20} />
                Créer un Pack
              </button>
            </div>
          </div>
        </div>

        {/* Liste des packs existants */}
        {!isCreating && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun pack créé</p>
                <p className="text-gray-400 text-sm mt-2">
                  Cliquez sur &quot;Créer un Pack&quot; pour commencer
                </p>
              </div>
            ) : (
              packs.map((pack) => (
                <ManagementCard
                  key={`pack-${pack._id}`}
                  type="pack"
                  item={pack}
                  currentLanguage={currentLanguage}
                  onEdit={(id) => {
                    const packToEdit = packs.find((p) => p._id === id)
                    if (packToEdit) handleEditPack(packToEdit)
                  }}
                  onDelete={handleDeletePack}
                />
              ))
            )}
          </div>
        )}

        {/* Formulaire de création/édition */}
        {isCreating && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingPack ? "Modifier le Pack" : "Créer un Nouveau Pack"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informations du pack */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Informations du Pack
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du pack (Français) *
                      </label>
                      <input
                        type="text"
                        value={formData.name.fr}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: { ...prev.name, fr: e.target.value }
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Pack Débutant Couture"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du pack (Arabe) *
                      </label>
                      <input
                        type="text"
                        value={formData.name.ar}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: { ...prev.name, ar: e.target.value }
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="حزمة المبتدئين للخياطة"
                        dir="rtl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Français)
                      </label>
                      <textarea
                        value={formData.description.fr}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: {
                              ...prev.description,
                              fr: e.target.value
                            }
                          }))
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Description du pack..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Arabe)
                      </label>
                      <textarea
                        value={formData.description.ar}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: {
                              ...prev.description,
                              ar: e.target.value
                            }
                          }))
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="وصف الحزمة..."
                        dir="rtl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix réduit (optionnel)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discountPrice}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              discountPrice: e.target.value
                            }))
                          }
                          className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          DH
                        </span>
                      </div>
                    </div>

                    {/* Images avec système S3 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Images du pack *
                      </label>

                      {/* Zone d'upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors mb-4">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFilesChange}
                          className="hidden"
                          id="pack-file-upload"
                          disabled={isSaving || uploadingImages}
                        />
                        <label
                          htmlFor="pack-file-upload"
                          className="cursor-pointer flex flex-col items-center space-y-2"
                        >
                          <Upload size={32} className="text-gray-400" />
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

                      {/* Affichage des images */}
                      {(formData.images.length > 0 ||
                        imagePreviews.length > 0) && (
                        <div className="space-y-3">
                          {/* Images existantes */}
                          {formData.images.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Images existantes ({formData.images.length})
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {formData.images.map((image, index) => (
                                  <div
                                    key={`existing-image-${index}-${image.substring(
                                      0,
                                      10
                                    )}`}
                                    className="relative group"
                                  >
                                    <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border">
                                      <Image
                                        src={image || "/No_Image_Available.jpg"}
                                        alt={`Image existante ${index + 1}`}
                                        fill
                                        className="object-cover"
                                      />
                                      <button
                                        onClick={() =>
                                          removeExistingImage(index)
                                        }
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={isSaving}
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Nouvelles images (prévisualisations) */}
                          {imagePreviews.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Nouvelles images ({imagePreviews.length})
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {imagePreviews.map((src, index) => (
                                  <div
                                    key={`new-image-${index}-${
                                      imageFiles[index]?.name || "preview"
                                    }`}
                                    className="relative group"
                                  >
                                    <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border border-blue-200">
                                      <Image
                                        src={src}
                                        alt={`Nouvelle image ${index + 1}`}
                                        fill
                                        className="object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveNewImage(index)
                                        }
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={isSaving || uploadingImages}
                                      >
                                        <X size={12} />
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

                      {formData.images.length === 0 &&
                        imagePreviews.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Aucune image ajoutée</p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Résumé du pack */}
                {selectedProducts.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <Calculator className="mr-2" size={16} />
                      Résumé du Pack
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Nombre de produits:</span>
                        <span>{selectedProducts.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantité totale:</span>
                        <span>
                          {selectedProducts.reduce(
                            (total, item) => total + item.quantity,
                            0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Prix total:</span>
                        <span>{calculateTotalPrice().toFixed(2)} DH</span>
                      </div>
                      {formData.discountPrice && (
                        <>
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Prix avec réduction:</span>
                            <span>
                              {parseFloat(formData.discountPrice).toFixed(2)} DH
                            </span>
                          </div>
                          <div className="flex justify-between text-green-600 text-xs">
                            <span>Économie:</span>
                            <span>
                              {(
                                calculateTotalPrice() -
                                parseFloat(formData.discountPrice)
                              ).toFixed(2)}{" "}
                              DH (
                              {Math.round(
                                ((calculateTotalPrice() -
                                  parseFloat(formData.discountPrice)) /
                                  calculateTotalPrice()) *
                                  100
                              )}
                              %)
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sélection des produits */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Ajouter des Produits
                  </h3>

                  {/* Recherche de produits */}
                  <div className="relative mb-4">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Rechercher des produits..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Liste des produits disponibles */}
                  <div className="border border-gray-200 rounded-lg">
                    {isLoadingProducts ? (
                      <div className="p-6 text-center text-gray-500">
                        <Loader2 className="mx-auto mb-2 animate-spin" size={24} />
                        <p>Chargement des produits...</p>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Package className="mx-auto mb-2" size={24} />
                        <p>Aucun produit disponible</p>
                        <p className="text-xs mt-1">
                          {productsTotal === 0
                            ? "Veuillez créer des produits d'abord"
                            : "Aucun produit ne correspond à votre recherche"}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-64 overflow-y-auto">
                          {filteredProducts.map((product) => (
                        <div
                          key={`product-${product._id}`}
                          className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              {product.images && getMainImage(product) ? (
                                <Image
                                  src={getMainImage(product)!}
                                  alt={product.name[currentLanguage]}
                                  width={100}
                                  height={100}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package
                                    className="text-gray-400"
                                    size={16}
                                  />
                                </div>
                              )}
                              {product.isNewProduct && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">
                                  NEW
                                </div>
                              )}
                              {product.isOnSale && (
                                <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1 rounded-br">
                                  SALE
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {product.name[currentLanguage]}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>
                                  {product?.category?.name[currentLanguage] ||
                                    "4"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                {product.originalPrice && product.isOnSale ? (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-sm font-medium text-green-600">
                                      {product.price.toFixed(2)} DH
                                    </span>
                                    <span className="text-xs text-gray-500 line-through">
                                      {product.originalPrice.toFixed(2)} DH
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-medium text-gray-600">
                                    {product.price.toFixed(2)} DH
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => addProductToPack(product)}
                            disabled={
                              !product.inStock || product.quantity === 0
                            }
                            className="flex items-center px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed ml-2"
                          >
                            <Plus size={14} className="mr-1" />
                            Ajouter
                          </button>
                        </div>
                          ))}
                        </div>
                        
                        {/* Pagination Controls */}
                        {productsTotalPages > 1 && (
                          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50">
                            <div className="text-xs text-gray-600">
                              Page {productsPage} sur {productsTotalPages}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleProductsPageChange(productsPage - 1)}
                                disabled={productsPage === 1 || isLoadingProducts}
                                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Page précédente"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button
                                onClick={() => handleProductsPageChange(productsPage + 1)}
                                disabled={productsPage >= productsTotalPages || isLoadingProducts}
                                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Page suivante"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Produits sélectionnés */}
                {selectedProducts.length > 0 ? (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">
                      Produits dans le Pack ({selectedProducts.length})
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProducts.map((item) => (
                        <div
                          key={`selected-${item.productId}`}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              {item.product.images && getMainImage(item.product) ? (
                                <Image
                                  src={getMainImage(item.product)!}
                                  alt={item.product.name[currentLanguage]}
                                  width={100}
                                  height={100}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package
                                    className="text-gray-400"
                                    size={16}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {item.product.name[currentLanguage]}
                              </p>
                              <div className="text-xs text-gray-500">
                                {item.product.price.toFixed(2)} DH ×{" "}
                                {item.quantity} ={" "}
                                {(item.product.price * item.quantity).toFixed(
                                  2
                                )}{" "}
                                DH
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                updateItemQuantity(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                              className="p-1 text-gray-500 hover:text-gray-700 bg-white rounded"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-medium px-2 min-w-[2rem] text-center bg-white rounded">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateItemQuantity(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                              disabled={item.quantity >= item.product.quantity}
                              className="p-1 text-gray-500 hover:text-gray-700 bg-white rounded disabled:text-gray-300 disabled:cursor-not-allowed"
                              title={
                                item.quantity >= item.product.quantity
                                  ? `Stock maximum: ${item.product.quantity}`
                                  : ""
                              }
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              onClick={() =>
                                removeProductFromPack(item.productId)
                              }
                              className="p-1 text-red-500 hover:text-red-700 ml-2 bg-white rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun produit sélectionné</p>
                    <p className="text-sm">
                      Recherchez et ajoutez des produits ci-dessus
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={resetForm}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePack}
                disabled={isSaving || selectedProducts.length === 0}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={16} />
                    {editingPack ? "Modifier" : "Créer"} le Pack
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPackCreator
