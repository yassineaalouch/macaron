"use client"

import React, { useState, useEffect } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Loader2,
  Eye,
  EyeOff,
  Upload,
  Search,
  Layers
} from "lucide-react"
import { useToast } from "@/components/ui/Toast"
import Image from "next/image"
import axios from "axios"
import { uploadFilesDirectlyToS3 } from "@/lib/uploadToS3"
import {
  HomePageCategory,
  HomePageCategoryFormData
} from "@/types/category"
import { Category } from "@/types/category"

export default function HomePageCategoriesPage() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<HomePageCategory[]>([])
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<"fr" | "ar">("fr")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [categorySearch, setCategorySearch] = useState("")

  const [formData, setFormData] = useState<HomePageCategoryFormData>({
    name: { fr: "", ar: "" },
    image: "",
    productCount: 0,
    url: "/shop",
    order: 0,
    isActive: true
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  useEffect(() => {
    fetchCategories()
    fetchAvailableCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/homepage-categories")
      const data = await response.json()

      if (data.success) {
        setCategories(data.categories || [])
      } else {
        showToast(data.message || "Erreur lors du chargement des catégories", "error")
      }
    } catch (error) {
      showToast("Erreur lors du chargement des catégories", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()

      if (data.success) {
        setAvailableCategories(data.categories || [])
      } else {
        showToast(data.message || "Erreur lors du chargement des catégories disponibles", "error")
      }
    } catch (error) {
      showToast("Erreur lors du chargement des catégories disponibles", "error")
    }
  }

  const handleCategorySelect = async (categoryId: string) => {
    if (!categoryId) {
      setSelectedCategoryId("")
      setFormData((prev) => ({
        ...prev,
        name: { fr: "", ar: "" },
        productCount: 0
      }))
      return
    }

    const selectedCategory = availableCategories.find(
      (cat) => cat._id === categoryId
    )

    if (selectedCategory) {
      setSelectedCategoryId(categoryId)
      setFormData((prev) => ({
        ...prev,
        name: {
          fr: selectedCategory.name.fr,
          ar: selectedCategory.name.ar
        }
      }))

      // Compter automatiquement les produits de cette catégorie
      try {
        const countResponse = await fetch(
          `/api/categories/${categoryId}/products-count`
        )
        const countData = await countResponse.json()

        if (countData.success) {
          setFormData((prev) => ({
            ...prev,
            productCount: countData.count
          }))
        } else {
          showToast(countData.message || "Erreur lors du comptage des produits", "error")
        }
      } catch (error) {
        showToast("Erreur lors du comptage des produits", "error")
      }
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    if (!file.type.startsWith("image/")) {
      showToast("Seules les images sont autorisées", "warning")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("La taille de l'image ne doit pas dépasser 5MB", "warning")
      return
    }

    setImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview("")
    setFormData((prev) => ({ ...prev, image: "" }))
  }

  const uploadImageToS3 = async (): Promise<string> => {
    if (!imageFile) {
      throw new Error("Aucune image à télécharger")
    }

    setUploadingImage(true)

    try {
      const urls = await uploadFilesDirectlyToS3([imageFile], {
        compress: true,
        maxWidth: 1920,
        quality: 85
      })

      if (urls.length > 0) {
        return urls[0]
      } else {
        throw new Error("Erreur lors de l'upload")
      }
    } catch (err) {
      console.error("Upload error:", err)
      showToast("Erreur lors de l'upload de l'image", "error")
      throw new Error("Erreur lors de l'upload de l'image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.fr || !formData.name.ar) {
      showToast("Veuillez remplir le nom en français et en arabe", "warning")
      return
    }

    if (!formData.image && !imageFile) {
      showToast("Veuillez ajouter une image", "warning")
      return
    }

    if (!formData.url) {
      showToast("Veuillez ajouter une URL", "warning")
      return
    }

    setSaving(true)
    try {
      let imageUrl = formData.image

      // Upload l'image si un nouveau fichier a été sélectionné
      if (imageFile) {
        imageUrl = await uploadImageToS3()
      }

      const url = editingId
        ? `/api/homepage-categories/${editingId}`
        : "/api/homepage-categories"
      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image: imageUrl
        })
      })

      const data = await response.json()

      if (data.success) {
        showToast(
          editingId
            ? "Catégorie mise à jour avec succès"
            : "Catégorie créée avec succès",
          "success"
        )
        setShowForm(false)
        setEditingId(null)
        resetForm()
        fetchCategories()
      } else {
        showToast(data.message || "Erreur lors de l'enregistrement", "error")
      }
    } catch (error) {
      showToast("Erreur lors de l'enregistrement", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: HomePageCategory) => {
    setFormData({
      name: category.name,
      image: category.image,
      productCount: category.productCount,
      url: category.url,
      order: category.order,
      isActive: category.isActive
    })
    setEditingId(category._id)
    setSelectedCategoryId("") // Reset category selection in edit mode
    setImageFile(null)
    setImagePreview(category.image)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      return
    }

    try {
      const response = await fetch(`/api/homepage-categories/${id}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (data.success) {
        showToast("Catégorie supprimée avec succès", "success")
        fetchCategories()
      } else {
        showToast(data.message || "Erreur lors de la suppression", "error")
      }
    } catch (error) {
      showToast("Erreur lors de la suppression", "error")
    }
  }

  const handleMoveOrder = async (id: string, direction: "up" | "down") => {
    const category = categories.find((c) => c._id === id)
    if (!category) return

    const currentIndex = categories.findIndex((c) => c._id === id)
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (newIndex < 0 || newIndex >= categories.length) return

    const targetCategory = categories[newIndex]
    const newOrder = targetCategory.order

    try {
      const response = await fetch(`/api/homepage-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder })
      })

      const data = await response.json()

      if (data.success) {
        // Échanger aussi l'ordre de la catégorie cible
        await fetch(`/api/homepage-categories/${targetCategory._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: category.order })
        })

        fetchCategories()
      } else {
        showToast(data.message || "Erreur lors du déplacement", "error")
      }
    } catch (error) {
      showToast("Erreur lors du déplacement", "error")
    }
  }

  const resetForm = () => {
    setFormData({
      name: { fr: "", ar: "" },
      image: "",
      productCount: 0,
      url: "/shop",
      order: categories.length,
      isActive: true
    })
    setSelectedCategoryId("")
    setImageFile(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview("")
    setCategorySearch("")
  }

  const handleNewCategory = () => {
    resetForm()
    setEditingId(null)
    setShowForm(true)
  }

  const filteredCategories = availableCategories.filter((cat) => {
    const searchLower = categorySearch.toLowerCase()
    return (
      cat.name.fr.toLowerCase().includes(searchLower) ||
      cat.name.ar.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Catégories Page d&apos;Accueil
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les catégories affichées sur la page d&apos;accueil
          </p>
        </div>
        <button
          onClick={handleNewCategory}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter une catégorie
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Modifier la catégorie" : "Nouvelle catégorie"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Category Selection */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner une catégorie existante
                  </label>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-5 h-5 text-gray-400" />
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Rechercher une catégorie..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => handleCategorySelect(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">-- Sélectionner une catégorie --</option>
                      {filteredCategories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name.fr} / {cat.name.ar}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      La sélection d&apos;une catégorie remplira automatiquement
                      le nom et le nombre de produits
                    </p>
                  </div>
                </div>
              )}

              {/* Language Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCurrentLanguage("fr")}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    currentLanguage === "fr"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  Français
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentLanguage("ar")}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    currentLanguage === "ar"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  العربية
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom ({currentLanguage === "fr" ? "Français" : "العربية"}) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name[currentLanguage]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: { ...formData.name, [currentLanguage]: e.target.value }
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image *
                </label>
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition-colors">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                            <span className="text-sm text-gray-600">
                              Upload en cours...
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Cliquez pour télécharger une image
                            </span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Preview */}
                  {(imagePreview || formData.image) && (
                    <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={imagePreview || formData.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/No_Image_Available.jpg"
                        }}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Manual URL Input (optional if image uploaded) */}
                  {!imageFile && !imagePreview && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Ou entrez une URL d&apos;image :
                      </label>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) =>
                          setFormData({ ...formData, image: e.target.value })
                        }
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Product Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de produits *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.productCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productCount: parseInt(e.target.value) || 0
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {selectedCategoryId
                    ? "Nombre calculé automatiquement depuis la catégorie sélectionnée"
                    : "Entrez le nombre de produits pour cette catégorie"}
                </p>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de destination *{" "}
                  <span className="text-xs text-gray-500">
                    (ex: /shop, /packs, /contact)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="/shop"
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre d&apos;affichage
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Catégorie active
                  </span>
                </label>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    resetForm()
                  }}
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Aucune catégorie pour le moment</p>
            <button
              onClick={handleNewCategory}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
            >
              Créer la première catégorie
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories
                  .sort((a, b) => a.order - b.order)
                  .map((category, index) => (
                    <tr
                      key={category._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={category.image}
                            alt={category.name.fr}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/No_Image_Available.jpg"
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name.fr}
                        </div>
                        <div className="text-sm text-gray-500">{category.name.ar}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.productCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={category.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
                        >
                          {category.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMoveOrder(category._id, "up")}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-medium text-gray-900 w-8 text-center">
                            {category.order}
                          </span>
                          <button
                            onClick={() => handleMoveOrder(category._id, "down")}
                            disabled={index === categories.length - 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {category.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            <Eye className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            <EyeOff className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
