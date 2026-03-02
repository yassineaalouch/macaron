"use client"

import React, { useState, useEffect } from "react"
import {
  Save,
  Loader2,
  LayoutDashboard,
  Layers,
  Package,
  Settings,
  X,
  Plus,
  Trash2,
  Upload,
  Edit,
  Mail,
  Phone,
  MapPin,
  Search,
  Image as ImageIcon,
  Megaphone,
  ExternalLink,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  Globe,
  ArrowUp,
  ArrowDown,
  PlayCircle
} from "lucide-react"
import { useToast } from "@/components/ui/Toast"
import Image from "next/image"
import axios from "axios"
import { Product } from "@/types/product"
import { getMainImage } from "@/lib/getMainImage"
import { Category } from "@/types/category"
import { SiteInfo } from "@/types/site-info"
import {
  uploadFilesDirectlyToS3,
  uploadVideoFileDirectlyToS3
} from "@/lib/uploadToS3"

type TabType =
  | "hero"
  | "categories"
  | "featured-products"
  | "promo-banner"
  | "site-info"
  | "home-video"

interface HeroContent {
  title: { ar: string; fr: string }
  description: { ar: string; fr: string }
  button: { ar: string; fr: string }
  images: string[]
  socialLinks: Array<{
    id: string
    url: string
    icon: string
    className: string
    name: string
    isActive: boolean
    order: number
  }>
}

interface HomeVideoConfig {
  sourceType: "upload" | "youtube"
  youtubeUrl: string
  videoUrl: string
  isActive: boolean
}

export default function HomePageContentPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>("hero")
  const [currentLanguage, setCurrentLanguage] = useState<"fr" | "ar">("fr")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Hero Section States
  const [heroContent, setHeroContent] = useState<HeroContent>({
    title: { ar: "", fr: "" },
    description: { ar: "", fr: "" },
    button: { ar: "", fr: "" },
    images: [],
    socialLinks: []
  })
  const [heroImageFiles, setHeroImageFiles] = useState<File[]>([])
  const [heroImagePreviews, setHeroImagePreviews] = useState<string[]>([])
  const [uploadingHeroImages, setUploadingHeroImages] = useState(false)
  const [initialHeroImages, setInitialHeroImages] = useState<string[]>([])

  // Categories States
  const [homepageCategories, setHomepageCategories] = useState<
    Array<{
      _id: string
      name: { fr: string; ar: string }
      image: string
      productCount: number
      url: string
      order: number
      isActive: boolean
    }>
  >([])
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [categoryFormData, setCategoryFormData] = useState({
    name: { fr: "", ar: "" },
    image: "",
    productCount: 0,
    url: "/shop",
    order: 0,
    isActive: true
  })
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  )
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null)
  const [categoryImagePreview, setCategoryImagePreview] = useState("")

  // Featured Products States
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState("")

  // Promo Banner States
  const [promoBanner, setPromoBanner] = useState({
    imageDesktop: "",
    imageMobile: "",
    title: { fr: "", ar: "" },
    description: { fr: "", ar: "" },
    link: "",
    linkType: "custom" as "product" | "pack" | "custom" | "category",
    linkId: "",
    isActive: true,
    startDate: null as string | null,
    endDate: null as string | null,
    priority: 0
  })
  const [bannerImageDesktopFile, setBannerImageDesktopFile] =
    useState<File | null>(null)
  const [bannerImageMobileFile, setBannerImageMobileFile] =
    useState<File | null>(null)
  const [bannerImageDesktopPreview, setBannerImageDesktopPreview] = useState("")
  const [bannerImageMobilePreview, setBannerImageMobilePreview] = useState("")
  const [allPacks, setAllPacks] = useState<
    Array<{
      _id: string
      name: { fr?: string; ar?: string } | string
      images?: string[]
      price?: number
    }>
  >([])
  const [bannerLinkSearch, setBannerLinkSearch] = useState("")
  const [bannerLinkType, setBannerLinkType] = useState<
    "product" | "pack" | "custom" | "category"
  >("custom")

  // Site Info States
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({
    email: "",
    phone: "",
    location: { fr: "", ar: "" }
  })

  // Home Video States
  const [homeVideo, setHomeVideo] = useState<HomeVideoConfig>({
    sourceType: "upload",
    youtubeUrl: "",
    videoUrl: "",
    isActive: false
  })
  const [homeVideoFile, setHomeVideoFile] = useState<File | null>(null)
  const [homeVideoPreviewUrl, setHomeVideoPreviewUrl] = useState<string>("")
  const [uploadingHomeVideo, setUploadingHomeVideo] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchHeroContent(),
        fetchHomepageCategories(),
        fetchAvailableCategories(),
        fetchFeaturedProducts(),
        fetchAllProducts(),
        fetchSiteInfo(),
        fetchPromoBanner(),
        fetchAllPacks(),
        fetchHomeVideo()
      ])
    } catch (error) {
      showToast("Erreur lors du chargement des données", "error")
    } finally {
      setLoading(false)
    }
  }

  // ============ HERO SECTION ============
  const fetchHeroContent = async () => {
    try {
      const response = await axios.get("/api/hero-content")
      if (response.data.success) {
        const data = response.data.data
        setHeroContent({
          title: data.title,
          description: data.description,
          button: data.button,
          images: data.images || [],
          socialLinks: data.socialLinks || []
        })
        setInitialHeroImages(data.images || [])
      } else {
        showToast(
          response.data.message || "Erreur lors du chargement du contenu Hero",
          "error"
        )
      }
    } catch (error) {
      showToast("Erreur lors du chargement du contenu Hero", "error")
    }
  }

  // ============ HOME VIDEO ============
  const fetchHomeVideo = async () => {
    try {
      const response = await axios.get("/api/home-video")
      if (response.data.success && response.data.data) {
        const data = response.data.data as HomeVideoConfig
        setHomeVideo({
          sourceType: data.sourceType || "upload",
          youtubeUrl: data.youtubeUrl || "",
          videoUrl: data.videoUrl || "",
          isActive: data.isActive ?? false
        })
      } else {
        showToast(
          response.data.message ||
            "Erreur lors du chargement de la configuration vidéo",
          "error"
        )
      }
    } catch (error) {
      showToast(
        "Erreur lors du chargement de la configuration vidéo",
        "error"
      )
    }
  }

  const handleHomeVideoFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("video/")) {
      showToast("Seules les vidéos sont autorisées", "warning")
      return
    }

    // Limite de 200MB pour éviter les fichiers trop lourds
    const maxSizeMb = 200
    if (file.size > maxSizeMb * 1024 * 1024) {
      showToast(
        `La taille de la vidéo ne doit pas dépasser ${maxSizeMb}MB`,
        "warning"
      )
      return
    }

    if (homeVideoPreviewUrl) {
      URL.revokeObjectURL(homeVideoPreviewUrl)
    }

    setHomeVideoFile(file)
    setHomeVideoPreviewUrl(URL.createObjectURL(file))
    // On force le type "upload" si un fichier est choisi
    setHomeVideo((prev) => ({
      ...prev,
      sourceType: "upload"
    }))
  }

  const uploadHomeVideoToS3 = async (): Promise<string> => {
    if (!homeVideoFile) {
      throw new Error("Aucune vidéo à télécharger")
    }
    setUploadingHomeVideo(true)
    try {
      const url = await uploadVideoFileDirectlyToS3(homeVideoFile)
      return url
    } catch (err) {
      console.error("Upload vidéo error:", err)
      showToast("Erreur lors de l'upload de la vidéo", "error")
      throw err
    } finally {
      setUploadingHomeVideo(false)
    }
  }

  const saveHomeVideo = async () => {
    if (!homeVideo.isActive) {
      // Si la section est désactivée, on enregistre simplement l'état
      try {
        const response = await axios.put("/api/home-video", {
          sourceType: homeVideo.sourceType,
          youtubeUrl: homeVideo.youtubeUrl || "",
          videoUrl: homeVideo.videoUrl || "",
          isActive: false
        })
        if (response.data.success) {
          showToast(
            "Configuration de la vidéo d'accueil mise à jour",
            "success"
          )
          await fetchHomeVideo()
        } else {
          showToast(response.data.message || "Erreur", "error")
        }
      } catch (error) {
        showToast(
          "Erreur lors de la sauvegarde de la configuration vidéo",
          "error"
        )
      }
      return
    }

    if (homeVideo.sourceType === "youtube") {
      if (!homeVideo.youtubeUrl.trim()) {
        showToast(
          "Veuillez renseigner l'URL YouTube de la vidéo",
          "warning"
        )
        return
      }

      try {
        const response = await axios.put("/api/home-video", {
          sourceType: "youtube",
          youtubeUrl: homeVideo.youtubeUrl.trim(),
          isActive: true
        })
        if (response.data.success) {
          showToast(
            "Vidéo YouTube mise à jour pour la page d'accueil",
            "success"
          )
          setHomeVideoFile(null)
          if (homeVideoPreviewUrl) {
            URL.revokeObjectURL(homeVideoPreviewUrl)
            setHomeVideoPreviewUrl("")
          }
          await fetchHomeVideo()
        } else {
          showToast(response.data.message || "Erreur", "error")
        }
      } catch (error) {
        showToast(
          "Erreur lors de la sauvegarde de la vidéo YouTube",
          "error"
        )
      }
      return
    }

    // sourceType === "upload"
    try {
      let finalVideoUrl = homeVideo.videoUrl

      if (homeVideoFile) {
        finalVideoUrl = await uploadHomeVideoToS3()
      }

      if (!finalVideoUrl) {
        showToast("Veuillez télécharger une vidéo", "warning")
        return
      }

      const response = await axios.put("/api/home-video", {
        sourceType: "upload",
        videoUrl: finalVideoUrl,
        isActive: true
      })

      if (response.data.success) {
        showToast(
          "Vidéo uploadée et configurée pour la page d'accueil",
          "success"
        )
        setHomeVideoFile(null)
        if (homeVideoPreviewUrl) {
          URL.revokeObjectURL(homeVideoPreviewUrl)
          setHomeVideoPreviewUrl("")
        }
        await fetchHomeVideo()
      } else {
        showToast(response.data.message || "Erreur", "error")
      }
    } catch (error) {
      // Les toasts sont déjà gérés dans les helpers
    }
  }

  const handleHeroFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newFiles = Array.from(e.target.files).filter((file) => {
      if (!file.type.startsWith("image/")) {
        showToast("Seules les images sont autorisées", "warning")
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("La taille de l'image ne doit pas dépasser 5MB", "warning")
        return false
      }
      return true
    })
    setHeroImageFiles((prev) => [...prev, ...newFiles])
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
    setHeroImagePreviews((prev) => [...prev, ...newPreviews])
  }

  const removeHeroImage = (index: number) => {
    setHeroImageFiles((prev) => prev.filter((_, i) => i !== index))
    setHeroImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const removeExistingHeroImage = (index: number) => {
    setHeroContent((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const uploadHeroImagesToS3 = async (): Promise<string[]> => {
    if (heroImageFiles.length === 0) return []
    setUploadingHeroImages(true)
    try {
      const urls = await uploadFilesDirectlyToS3(heroImageFiles, {
        compress: true,
        maxWidth: 1920,
        quality: 85
      })
      return urls
    } catch (err) {
      console.error("Upload error:", err)
      showToast("Erreur lors de l'upload des images", "error")
      throw err
    } finally {
      setUploadingHeroImages(false)
    }
  }

  const saveHeroContent = async () => {
    setSaving(true)
    try {
      let imageUrls = [...heroContent.images]
      if (heroImageFiles.length > 0) {
        const uploadedUrls = await uploadHeroImagesToS3()
        imageUrls = [...imageUrls, ...uploadedUrls]
      }

      // Nettoyer les liens sociaux pour éviter les erreurs de validation
      const cleanedSocialLinks = (heroContent.socialLinks || []).filter(
        (link) => typeof link.url === "string" && link.url.trim() !== ""
      )

      const response = await axios.put("/api/hero-content", {
        title: heroContent.title,
        description: heroContent.description,
        button: heroContent.button,
        images: imageUrls,
        socialLinks: cleanedSocialLinks
      })
      if (response.data.success) {
        showToast("Contenu Hero mis à jour avec succès", "success")
        setHeroImageFiles([])
        setHeroImagePreviews([])
        fetchHeroContent()
      }
    } catch (error) {
      showToast("Erreur lors de la sauvegarde", "error")
    } finally {
      setSaving(false)
    }
  }

  // ============ CATEGORIES ============
  const fetchHomepageCategories = async () => {
    try {
      const response = await fetch("/api/homepage-categories")
      const data = await response.json()
      if (data.success) {
        setHomepageCategories(data.categories || [])
      } else {
        showToast(
          data.message || "Erreur lors du chargement des catégories",
          "error"
        )
      }
    } catch (error) {
      showToast("Erreur lors du chargement des catégories", "error")
    }
  }

  const fetchAvailableCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      if (data.success) {
        setAvailableCategories(data.categories || [])
      } else {
        showToast(
          data.message ||
            "Erreur lors du chargement des catégories disponibles",
          "error"
        )
      }
    } catch (error) {
      showToast("Erreur lors du chargement des catégories disponibles", "error")
    }
  }

  // Fonction pour obtenir tous les descendants d'une catégorie
  const getAllDescendants = (categoryId: string): Category[] => {
    const descendants: Category[] = []
    const directChildren = availableCategories.filter(
      (c) => c.parentId === categoryId
    )

    for (const child of directChildren) {
      descendants.push(child)
      descendants.push(...getAllDescendants(child._id))
    }

    return descendants
  }

  // Fonction pour générer l'URL automatiquement
  const generateCategoryUrl = (category: Category): string => {
    const categoriesToInclude: Category[] = [category]
    
    // Si c'est une catégorie parent (pas de parentId), inclure tous ses enfants
    if (!category.parentId) {
      const children = getAllDescendants(category._id)
      categoriesToInclude.push(...children)
    }

    // Construire l'URL avec tous les noms de catégories
    const categoryParams = categoriesToInclude
      .map((cat) => encodeURIComponent(cat.name.fr))
      .join("&category=")

    return `/shop?category=${categoryParams}`
  }

  // Fonction pour compter les produits d'une catégorie et de tous ses enfants
  const countProductsInCategoryAndChildren = async (
    categoryId: string
  ): Promise<number> => {
    try {
      // Compter les produits de la catégorie principale
      const mainCountResponse = await fetch(
        `/api/categories/${categoryId}/products-count`
      )
      const mainCountData = await mainCountResponse.json()
      let totalCount = mainCountData.success ? mainCountData.count : 0

      // Si c'est une catégorie parent, compter aussi les produits des enfants
      const selectedCategory = availableCategories.find(
        (cat) => cat._id === categoryId
      )
      if (selectedCategory && !selectedCategory.parentId) {
        const children = getAllDescendants(categoryId)
        // Compter les produits de chaque catégorie enfant
        for (const child of children) {
          try {
            const childCountResponse = await fetch(
              `/api/categories/${child._id}/products-count`
            )
            const childCountData = await childCountResponse.json()
            if (childCountData.success) {
              totalCount += childCountData.count
            }
          } catch (error) {
            console.error(
              `Erreur lors du comptage des produits pour la catégorie ${child._id}:`,
              error
            )
          }
        }
      }

      return totalCount
    } catch (error) {
      console.error("Erreur lors du comptage des produits:", error)
      return 0
    }
  }

  const handleCategorySelect = async (categoryId: string) => {
    if (!categoryId) {
      setSelectedCategoryId("")
      setCategoryFormData((prev) => ({
        ...prev,
        name: { fr: "", ar: "" },
        productCount: 0,
        url: "/shop"
      }))
      return
    }
    const selectedCategory = availableCategories.find(
      (cat) => cat._id === categoryId
    )
    if (selectedCategory) {
      setSelectedCategoryId(categoryId)
      // Générer automatiquement l'URL
      const generatedUrl = generateCategoryUrl(selectedCategory)
      setCategoryFormData((prev) => ({
        ...prev,
        name: {
          fr: selectedCategory.name.fr,
          ar: selectedCategory.name.ar
        },
        url: generatedUrl
      }))
      
      // Compter les produits (catégorie + enfants si parent)
      try {
        const totalCount = await countProductsInCategoryAndChildren(categoryId)
        setCategoryFormData((prev) => ({
          ...prev,
          productCount: totalCount
        }))
      } catch (error) {
        showToast("Erreur lors du comptage des produits", "error")
        setCategoryFormData((prev) => ({
          ...prev,
          productCount: 0
        }))
      }
    }
  }

  const handleCategoryImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      showToast("Seules les images sont autorisées", "warning")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("La taille de l'image ne doit pas dépasser 5MB", "warning")
      return
    }
    setCategoryImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setCategoryImagePreview(previewUrl)
  }

  const uploadCategoryImageToS3 = async (): Promise<string> => {
    if (!categoryImageFile) throw new Error("Aucune image à télécharger")
    try {
      const urls = await uploadFilesDirectlyToS3([categoryImageFile], {
        compress: true,
        maxWidth: 1920,
        quality: 85
      })
      if (urls.length > 0) {
        return urls[0]
      }
      throw new Error("Erreur lors de l'upload")
    } catch (err) {
      console.error("Upload error:", err)
      showToast("Erreur lors de l'upload de l'image", "error")
      throw err
    }
  }

  const saveCategory = async () => {
    // En mode création, une catégorie doit être sélectionnée
    if (!editingCategoryId && !selectedCategoryId) {
      showToast("Veuillez sélectionner une catégorie", "warning")
      return
    }
    if (!categoryFormData.name.fr || !categoryFormData.name.ar) {
      showToast("Veuillez remplir le nom", "warning")
      return
    }
    if (!categoryFormData.image && !categoryImageFile) {
      showToast("Veuillez ajouter une image", "warning")
      return
    }
    setSaving(true)
    try {
      let imageUrl = categoryFormData.image
      if (categoryImageFile) {
        imageUrl = await uploadCategoryImageToS3()
      }
      const url = editingCategoryId
        ? `/api/homepage-categories/${editingCategoryId}`
        : "/api/homepage-categories"
      const method = editingCategoryId ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...categoryFormData, image: imageUrl })
      })
      const data = await response.json()
      if (data.success) {
        showToast(
          editingCategoryId ? "Catégorie mise à jour" : "Catégorie créée",
          "success"
        )
        setShowCategoryForm(false)
        setEditingCategoryId(null)
        setCategoryFormData({
          name: { fr: "", ar: "" },
          image: "",
          productCount: 0,
          url: "/shop",
          order: homepageCategories.length,
          isActive: true
        })
        setSelectedCategoryId("")
        setCategoryImageFile(null)
        setCategoryImagePreview("")
        fetchHomepageCategories()
      } else {
        showToast(data.message || "Erreur", "error")
      }
    } catch (error) {
      showToast("Erreur lors de l'enregistrement", "error")
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return
    try {
      const response = await fetch(`/api/homepage-categories/${id}`, {
        method: "DELETE"
      })
      const data = await response.json()
      if (data.success) {
        showToast("Catégorie supprimée", "success")
        fetchHomepageCategories()
      }
    } catch (error) {
      showToast("Erreur lors de la suppression", "error")
    }
  }

  // ============ FEATURED PRODUCTS ============
  const fetchAllProducts = async () => {
    try {
      const response = await fetch("/api/products?limit=1000")
      const data = await response.json()
      if (data.success) {
        setAllProducts(data.products || [])
      } else {
        showToast(
          data.message || "Erreur lors du chargement des produits",
          "error"
        )
      }
    } catch (error) {
      showToast("Erreur lors du chargement des produits", "error")
    }
  }

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch("/api/featured-products")
      const data = await response.json()
      if (data.success) {
        setFeaturedProductIds(data.productIds || [])
        setFeaturedProducts(data.products || [])
      } else {
        showToast(
          data.message || "Erreur lors du chargement des produits en vedette",
          "error"
        )
      }
    } catch (error) {
      showToast("Erreur lors du chargement des produits en vedette", "error")
    }
  }

  const toggleFeaturedProduct = (productId: string) => {
    setFeaturedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      } else {
        if (prev.length >= 10) {
          showToast("Maximum 10 produits en vedette", "warning")
          return prev
        }
        return [...prev, productId]
      }
    })
  }

  const saveFeaturedProducts = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/featured-products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: featuredProductIds, isActive: true })
      })
      const data = await response.json()
      if (data.success) {
        showToast("Produits en vedette mis à jour", "success")
        fetchFeaturedProducts()
      } else {
        showToast(data.message || "Erreur", "error")
      }
    } catch (error) {
      showToast("Erreur lors de la sauvegarde", "error")
    } finally {
      setSaving(false)
    }
  }

  const deleteAllFeaturedProducts = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer tous les produits en vedette ? Cette action est irréversible."
      )
    ) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/featured-products", {
        method: "DELETE"
      })
      const data = await response.json()
      if (data.success) {
        showToast("Tous les produits en vedette ont été supprimés", "success")
        setFeaturedProductIds([])
        setFeaturedProducts([])
        fetchFeaturedProducts()
      } else {
        showToast(data.message || "Erreur", "error")
      }
    } catch (error) {
      showToast("Erreur lors de la suppression", "error")
    } finally {
      setSaving(false)
    }
  }

  // ============ PROMO BANNER ============

  const fetchAllPacks = async () => {
    try {
      const response = await fetch("/api/product-packs")
      const data = await response.json()
      if (data.success) {
        setAllPacks(data.data || [])
      } else {
        showToast(
          data.message || "Erreur lors du chargement des packs",
          "error"
        )
      }
    } catch (error) {
      showToast("Erreur lors du chargement des packs", "error")
    }
  }

  const fetchPromoBanner = async () => {
    try {
      const response = await fetch("/api/promo-banner")
      const data = await response.json()
      if (data.success && data.banner) {
        setPromoBanner({
          imageDesktop: data.banner.imageDesktop || "",
          imageMobile: data.banner.imageMobile || "",
          title: data.banner.title || { fr: "", ar: "" },
          description: data.banner.description || { fr: "", ar: "" },
          link: data.banner.link || "",
          linkType: data.banner.linkType || "custom",
          linkId: data.banner.linkId || "",
          isActive:
            data.banner.isActive !== undefined ? data.banner.isActive : true,
          startDate: data.banner.startDate || null,
          endDate: data.banner.endDate || null,
          priority: data.banner.priority || 0
        })
        setBannerImageDesktopPreview(data.banner.imageDesktop || "")
        setBannerImageMobilePreview(data.banner.imageMobile || "")
        setBannerLinkType(data.banner.linkType || "custom")
      } else {
        showToast(
          data.message || "Erreur lors du chargement de la bannière",
          "error"
        )
      }
    } catch (error) {
      showToast("Erreur lors du chargement de la bannière", "error")
    }
  }

  const handleBannerImageDesktopUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      showToast("Seules les images sont autorisées", "warning")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("La taille de l'image ne doit pas dépasser 5MB", "warning")
      return
    }
    setBannerImageDesktopFile(file)
    const previewUrl = URL.createObjectURL(file)
    setBannerImageDesktopPreview(previewUrl)
  }

  const handleBannerImageMobileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      showToast("Seules les images sont autorisées", "warning")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("La taille de l'image ne doit pas dépasser 5MB", "warning")
      return
    }
    setBannerImageMobileFile(file)
    const previewUrl = URL.createObjectURL(file)
    setBannerImageMobilePreview(previewUrl)
  }

  const uploadBannerImageToS3 = async (file: File): Promise<string> => {
    try {
      const urls = await uploadFilesDirectlyToS3([file], {
        compress: true,
        maxWidth: 1920,
        quality: 85
      })
      if (urls.length > 0) {
        return urls[0]
      }
      throw new Error("Erreur lors de l'upload")
    } catch (err) {
      console.error("Upload error:", err)
      showToast("Erreur lors de l'upload de l'image", "error")
      throw err
    }
  }

  const handleBannerLinkTypeChange = (
    type: "product" | "pack" | "custom" | "category"
  ) => {
    setBannerLinkType(type)
    setPromoBanner((prev) => ({
      ...prev,
      linkType: type,
      link: "",
      linkId: ""
    }))
  }

  const handleBannerLinkSelect = (itemId: string) => {
    if (bannerLinkType === "product") {
      const product = allProducts.find((p) => p._id === itemId)
      if (product) {
        setPromoBanner((prev) => ({
          ...prev,
          link: `/shop/${itemId}`,
          linkId: itemId
        }))
      }
    } else if (bannerLinkType === "pack") {
      const pack = allPacks.find((p) => p._id === itemId)
      if (pack) {
        setPromoBanner((prev) => ({
          ...prev,
          link: `/packs/${itemId}`,
          linkId: itemId
        }))
      }
    } else if (bannerLinkType === "category") {
      const category = availableCategories.find((c) => c._id === itemId)
      if (category) {
        // Utiliser le nom de la catégorie (en français) dans l'URL au lieu de l'ID
        const categoryName = encodeURIComponent(category.name.fr)
        setPromoBanner((prev) => ({
          ...prev,
          link: `/shop?category=${categoryName}`,
          linkId: itemId
        }))
      }
    }
  }

  const savePromoBanner = async () => {
    // Validation : au moins une image doit être fournie
    if (
      !promoBanner.imageDesktop &&
      !promoBanner.imageMobile &&
      !bannerImageDesktopFile &&
      !bannerImageMobileFile
    ) {
      showToast(
        "Veuillez ajouter au moins une image (desktop ou mobile)",
        "warning"
      )
      return
    }
    if (!promoBanner.link) {
      showToast("Veuillez ajouter un lien", "warning")
      return
    }
    setSaving(true)
    try {
      // Upload des images si nécessaire
      let imageDesktopUrl = promoBanner.imageDesktop
      let imageMobileUrl = promoBanner.imageMobile

      try {
        if (bannerImageDesktopFile) {
          imageDesktopUrl = await uploadBannerImageToS3(bannerImageDesktopFile)
        }
        if (bannerImageMobileFile) {
          imageMobileUrl = await uploadBannerImageToS3(bannerImageMobileFile)
        }
      } catch (uploadError) {
        console.error("Erreur lors de l'upload des images:", uploadError)
        showToast(
          "Erreur lors de l'upload des images. Veuillez réessayer.",
          "error"
        )
        setSaving(false)
        return
      }

      // Construire l'objet de données à envoyer
      const bannerData: any = {
        link: promoBanner.link,
        linkType: bannerLinkType,
        imageDesktop: "",
        imageMobile: "",
        linkId: promoBanner.linkId || null,
        isActive: promoBanner.isActive,
        priority: promoBanner.priority || 0,
        startDate: promoBanner.startDate || null,
        endDate: promoBanner.endDate || null
      }

      // Ajouter les images - toujours inclure si elles existent (nouvelle ou existante)
      if (imageDesktopUrl && imageDesktopUrl.trim() !== "") {
        bannerData.imageDesktop = imageDesktopUrl.trim()
      }
      if (imageMobileUrl && imageMobileUrl.trim() !== "") {
        bannerData.imageMobile = imageMobileUrl.trim()
      }

      // Ajouter titre et description si présents
      if (promoBanner.title && (promoBanner.title.fr || promoBanner.title.ar)) {
        bannerData.title = promoBanner.title
      }
      if (
        promoBanner.description &&
        (promoBanner.description.fr || promoBanner.description.ar)
      ) {
        bannerData.description = promoBanner.description
      }

      const response = await fetch("/api/promo-banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerData)
      })
      const data = await response.json()
      if (data.success) {
        showToast("Bannière mise à jour avec succès", "success")
        setBannerImageDesktopFile(null)
        setBannerImageMobileFile(null)
        fetchPromoBanner()
      } else {
        showToast(data.message || "Erreur", "error")
      }
    } catch (error) {
      showToast("Erreur lors de la sauvegarde", "error")
    } finally {
      setSaving(false)
    }
  }

  // ============ SITE INFO ============
  const fetchSiteInfo = async () => {
    try {
      const response = await fetch("/api/site-info")
      const data = await response.json()
      if (data.success && data.siteInfo) {
        setSiteInfo(data.siteInfo)
      } else {
        showToast(
          data.message || "Erreur lors du chargement des informations du site",
          "error"
        )
      }
    } catch (error) {
      showToast("Erreur lors du chargement des informations du site", "error")
    }
  }

  const saveSiteInfo = async () => {
    if (
      !siteInfo.email ||
      !siteInfo.phone ||
      !siteInfo.location.fr ||
      !siteInfo.location.ar
    ) {
      showToast("Veuillez remplir tous les champs", "warning")
      return
    }
    setSaving(true)
    try {
      const response = await fetch("/api/site-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteInfo)
      })
      const data = await response.json()
      if (data.success) {
        showToast("Informations mises à jour", "success")
      } else {
        showToast(data.message || "Erreur", "error")
      }
    } catch (error) {
      showToast("Erreur lors de la mise à jour", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  const filteredCategories = availableCategories.filter((cat) => {
    const searchLower = categorySearch.toLowerCase()
    return (
      cat.name.fr.toLowerCase().includes(searchLower) ||
      cat.name.ar.toLowerCase().includes(searchLower)
    )
  })

  const filteredProducts = allProducts.filter((product) => {
    const searchLower = productSearch.toLowerCase()
    return (
      product.name.fr.toLowerCase().includes(searchLower) ||
      product.name.ar.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Home Page Content</h1>
        <p className="text-gray-600 mt-1">
          Gérez le contenu de la page d&apos;accueil
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab("hero")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "hero"
                  ? "border-b-2 border-orange-600 text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Hero Section
              </div>
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "categories"
                  ? "border-b-2 border-orange-600 text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Catégories
              </div>
            </button>
            <button
              onClick={() => setActiveTab("featured-products")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "featured-products"
                  ? "border-b-2 border-orange-600 text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produits en Vedette
              </div>
            </button>
            <button
              onClick={() => setActiveTab("promo-banner")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "promo-banner"
                  ? "border-b-2 border-orange-600 text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Bannière Publicitaire
              </div>
            </button>
            <button
              onClick={() => setActiveTab("home-video")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "home-video"
                  ? "border-b-2 border-orange-600 text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Vidéo d&apos;accueil
              </div>
            </button>
            <button
              onClick={() => setActiveTab("site-info")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "site-info"
                  ? "border-b-2 border-orange-600 text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Informations du Site
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* HERO TAB */}
          {activeTab === "hero" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Hero Section</h2>
                <button
                  onClick={saveHeroContent}
                  disabled={saving || uploadingHeroImages}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
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

              {/* Language Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => setCurrentLanguage("fr")}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
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
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    currentLanguage === "ar"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  العربية
                </button>
              </div>

              {/* Hero Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Titre ({currentLanguage === "fr" ? "Français" : "العربية"})
                    *
                  </label>
                  <input
                    type="text"
                    value={heroContent.title[currentLanguage]}
                    onChange={(e) =>
                      setHeroContent({
                        ...heroContent,
                        title: {
                          ...heroContent.title,
                          [currentLanguage]: e.target.value
                        }
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                    dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description (
                    {currentLanguage === "fr" ? "Français" : "العربية"}) *
                  </label>
                  <textarea
                    value={heroContent.description[currentLanguage]}
                    onChange={(e) =>
                      setHeroContent({
                        ...heroContent,
                        description: {
                          ...heroContent.description,
                          [currentLanguage]: e.target.value
                        }
                      })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                    dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Texte du bouton (
                    {currentLanguage === "fr" ? "Français" : "العربية"}) *
                  </label>
                  <input
                    type="text"
                    value={heroContent.button[currentLanguage]}
                    onChange={(e) =>
                      setHeroContent({
                        ...heroContent,
                        button: {
                          ...heroContent.button,
                          [currentLanguage]: e.target.value
                        }
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                    dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Images *
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleHeroFilesChange}
                      className="hidden"
                      disabled={uploadingHeroImages}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Cliquez pour télécharger des images
                      </span>
                    </div>
                  </label>

                  {/* Existing Images */}
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {heroContent.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                          <Image
                            src={img}
                            alt={`Hero ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingHeroImage(index)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* New Uploads */}
                    {heroImagePreviews.map((preview, index) => (
                      <div key={`preview-${index}`} className="relative group">
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeHeroImage(index)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Réseaux Sociaux */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium">
                      Réseaux Sociaux
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        // Couleur par défaut selon l'icône
                        const getDefaultColor = (icon: string) => {
                          const colors: Record<string, string> = {
                            Facebook: "text-blue-600 hover:text-blue-800",
                            Twitter: "text-sky-500 hover:text-sky-700",
                            Instagram: "text-pink-600 hover:text-pink-800",
                            Youtube: "text-red-600 hover:text-red-800",
                            Linkedin: "text-blue-700 hover:text-blue-900",
                            Github: "text-gray-800 hover:text-gray-900",
                            ExternalLink: "text-gray-600 hover:text-gray-800"
                          }
                          return colors[icon] || "text-gray-600 hover:text-gray-800"
                        }
                        
                        const newLink = {
                          id: Date.now().toString(),
                          url: "",
                          icon: "Facebook",
                          className: getDefaultColor("Facebook"),
                          name: "Nouveau réseau",
                          isActive: false,
                          order: heroContent.socialLinks.length + 1
                        }
                        setHeroContent({
                          ...heroContent,
                          socialLinks: [...heroContent.socialLinks, newLink]
                        })
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>

                  <div className="space-y-3">
                    {heroContent.socialLinks
                      .sort((a, b) => a.order - b.order)
                      .map((link, index) => {
                        const iconMap: Record<string, React.ReactNode> = {
                          Facebook: <Facebook className="w-5 h-5" />,
                          Twitter: <Twitter className="w-5 h-5" />,
                          Instagram: <Instagram className="w-5 h-5" />,
                          Youtube: <Youtube className="w-5 h-5" />,
                          Linkedin: <Linkedin className="w-5 h-5" />,
                          Github: <Github className="w-5 h-5" />,
                          ExternalLink: <ExternalLink className="w-5 h-5" />
                        }

                        return (
                          <div
                            key={link.id}
                            className="p-4 border-2 border-gray-200 rounded-lg space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={link.className}>
                                  {iconMap[link.icon] || (
                                    <Globe className="w-5 h-5" />
                                  )}
                                </div>
                                <span className="font-medium">{link.name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedLinks = [...heroContent.socialLinks]
                                    const linkIndex = updatedLinks.findIndex(
                                      (l) => l.id === link.id
                                    )
                                    if (linkIndex > 0) {
                                      ;[updatedLinks[linkIndex], updatedLinks[linkIndex - 1]] = [
                                        updatedLinks[linkIndex - 1],
                                        updatedLinks[linkIndex]
                                      ]
                                      updatedLinks[linkIndex].order = linkIndex
                                      updatedLinks[linkIndex - 1].order = linkIndex - 1
                                      setHeroContent({
                                        ...heroContent,
                                        socialLinks: updatedLinks
                                      })
                                    }
                                  }}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedLinks = [...heroContent.socialLinks]
                                    const linkIndex = updatedLinks.findIndex(
                                      (l) => l.id === link.id
                                    )
                                    if (
                                      linkIndex < updatedLinks.length - 1
                                    ) {
                                      ;[updatedLinks[linkIndex], updatedLinks[linkIndex + 1]] = [
                                        updatedLinks[linkIndex + 1],
                                        updatedLinks[linkIndex]
                                      ]
                                      updatedLinks[linkIndex].order = linkIndex
                                      updatedLinks[linkIndex + 1].order = linkIndex + 1
                                      setHeroContent({
                                        ...heroContent,
                                        socialLinks: updatedLinks
                                      })
                                    }
                                  }}
                                  disabled={index === heroContent.socialLinks.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedLinks = heroContent.socialLinks.filter(
                                      (l) => l.id !== link.id
                                    )
                                    setHeroContent({
                                      ...heroContent,
                                      socialLinks: updatedLinks
                                    })
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedLinks = heroContent.socialLinks.map((l) =>
                                      l.id === link.id
                                        ? { ...l, isActive: !l.isActive }
                                        : l
                                    )
                                    setHeroContent({
                                      ...heroContent,
                                      socialLinks: updatedLinks
                                    })
                                  }}
                                  className={`px-3 py-1 text-xs rounded-full ${
                                    link.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {link.isActive ? "Actif" : "Inactif"}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Nom
                                </label>
                                <input
                                  type="text"
                                  value={link.name}
                                  onChange={(e) => {
                                    const updatedLinks = heroContent.socialLinks.map((l) =>
                                      l.id === link.id ? { ...l, name: e.target.value } : l
                                    )
                                    setHeroContent({
                                      ...heroContent,
                                      socialLinks: updatedLinks
                                    })
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Icône
                                </label>
                                <select
                                  value={link.icon}
                                  onChange={(e) => {
                                    // Couleur par défaut selon l'icône choisie
                                    const getDefaultColor = (icon: string) => {
                                      const colors: Record<string, string> = {
                                        Facebook: "text-blue-600 hover:text-blue-800",
                                        Twitter: "text-sky-500 hover:text-sky-700",
                                        Instagram: "text-pink-600 hover:text-pink-800",
                                        Youtube: "text-red-600 hover:text-red-800",
                                        Linkedin: "text-blue-700 hover:text-blue-900",
                                        Github: "text-gray-800 hover:text-gray-900",
                                        ExternalLink: "text-gray-600 hover:text-gray-800"
                                      }
                                      return colors[icon] || "text-gray-600 hover:text-gray-800"
                                    }
                                    
                                    const updatedLinks = heroContent.socialLinks.map((l) =>
                                      l.id === link.id
                                        ? {
                                            ...l,
                                            icon: e.target.value,
                                            className: getDefaultColor(e.target.value)
                                          }
                                        : l
                                    )
                                    setHeroContent({
                                      ...heroContent,
                                      socialLinks: updatedLinks
                                    })
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="Facebook">Facebook</option>
                                  <option value="Twitter">Twitter</option>
                                  <option value="Instagram">Instagram</option>
                                  <option value="Youtube">Youtube</option>
                                  <option value="Linkedin">Linkedin</option>
                                  <option value="Github">Github</option>
                                  <option value="ExternalLink">ExternalLink</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                URL
                              </label>
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) => {
                                  const updatedLinks = heroContent.socialLinks.map((l) =>
                                    l.id === link.id ? { ...l, url: e.target.value } : l
                                  )
                                  setHeroContent({
                                    ...heroContent,
                                    socialLinks: updatedLinks
                                  })
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        )
                      })}

                    {heroContent.socialLinks.length === 0 && (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun réseau social ajouté</p>
                        <p className="text-xs mt-1">
                          Cliquez sur &quot;Ajouter&quot; pour commencer
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  Catégories Page d&apos;Accueil
                </h2>
                <button
                  onClick={() => {
                    setShowCategoryForm(true)
                    setEditingCategoryId(null)
                    setCategoryFormData({
                      name: { fr: "", ar: "" },
                      image: "",
                      productCount: 0,
                      url: "/shop",
                      order: homepageCategories.length,
                      isActive: true
                    })
                    setSelectedCategoryId("")
                    setCategoryImageFile(null)
                    setCategoryImagePreview("")
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter
                </button>
              </div>

              {/* Categories List */}
              <div className="space-y-2">
                {homepageCategories
                  .sort((a, b) => a.order - b.order)
                  .map((cat) => (
                    <div
                      key={cat._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={cat.image}
                            alt={cat.name.fr}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{cat.name.fr}</div>
                          <div className="text-sm text-gray-500">
                            {cat.name.ar}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            setEditingCategoryId(cat._id)
                            // Trouver la catégorie correspondante dans availableCategories
                            const matchingCategory = availableCategories.find(
                              (ac) => ac.name.fr === cat.name.fr && ac.name.ar === cat.name.ar
                            )
                            
                            let categoryUrl = cat.url
                            let productCount = cat.productCount
                            
                            if (matchingCategory) {
                              // Régénérer l'URL automatiquement
                              categoryUrl = generateCategoryUrl(matchingCategory)
                              setSelectedCategoryId(matchingCategory._id)
                              
                              // Recalculer le nombre de produits (catégorie + enfants si parent)
                              try {
                                const totalCount = await countProductsInCategoryAndChildren(
                                  matchingCategory._id
                                )
                                productCount = totalCount
                              } catch (error) {
                                console.error("Erreur lors du recalcul du nombre de produits:", error)
                                // Garder la valeur existante en cas d'erreur
                              }
                            } else {
                              setSelectedCategoryId("")
                            }
                            
                            setCategoryFormData({
                              name: cat.name,
                              image: cat.image,
                              productCount: productCount,
                              url: categoryUrl,
                              order: cat.order,
                              isActive: cat.isActive
                            })
                            setCategoryImagePreview(cat.image)
                            setShowCategoryForm(true)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Category Form Modal */}
              {showCategoryForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-xl font-bold">
                        {editingCategoryId ? "Modifier" : "Nouvelle"} catégorie
                      </h3>
                      <button
                        onClick={() => {
                          setShowCategoryForm(false)
                          setEditingCategoryId(null)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {editingCategoryId 
                            ? "Modifier la catégorie (optionnel)" 
                            : "Sélectionner une catégorie existante"}
                        </label>
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg mb-2"
                        />
                        <select
                          value={selectedCategoryId}
                          onChange={(e) =>
                            handleCategorySelect(e.target.value)
                          }
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                        >
                          <option value="">-- Sélectionner --</option>
                          {filteredCategories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name.fr} / {cat.name.ar}
                            </option>
                          ))}
                        </select>
                        {editingCategoryId && selectedCategoryId && (
                          <p className="text-xs text-blue-600 mt-1">
                            ⚠️ Changer la catégorie mettra à jour le nom, l&apos;URL et le nombre de produits
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                        <button
                          type="button"
                          onClick={() => setCurrentLanguage("fr")}
                          className={`px-4 py-2 rounded-md font-medium ${
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
                          className={`px-4 py-2 rounded-md font-medium ${
                            currentLanguage === "ar"
                              ? "bg-white text-orange-600 shadow-sm"
                              : "text-gray-600"
                          }`}
                        >
                          العربية
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nom (
                          {currentLanguage === "fr" ? "Français" : "العربية"}) *
                        </label>
                        <input
                          type="text"
                          value={categoryFormData.name[currentLanguage]}
                          readOnly
                          disabled={!!selectedCategoryId || !!editingCategoryId}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
                          dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                        />
                        {(selectedCategoryId || editingCategoryId) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Le nom ne peut pas être modifié
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Image *
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCategoryImageUpload}
                            className="hidden"
                          />
                          <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500">
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Télécharger une image
                            </span>
                          </div>
                        </label>
                        {categoryImagePreview && (
                          <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200 mt-4">
                            <Image
                              src={categoryImagePreview}
                              alt="Preview"
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryImageFile(null)
                                setCategoryImagePreview("")
                              }}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nombre de produits *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={categoryFormData.productCount}
                          onChange={(e) =>
                            setCategoryFormData({
                              ...categoryFormData,
                              productCount: parseInt(e.target.value) || 0
                            })
                          }
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                        />
                        {selectedCategoryId && (
                          <p className="text-xs text-gray-500 mt-1">
                            Le nombre est initialisé automatiquement (catégorie + sous-catégories si parent). Vous pouvez le modifier si nécessaire.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          URL de destination *
                        </label>
                        <input
                          type="text"
                          value={categoryFormData.url}
                          readOnly
                          disabled={!!selectedCategoryId || !!editingCategoryId}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
                          placeholder="/shop"
                        />
                        {(selectedCategoryId || editingCategoryId) && (
                          <p className="text-xs text-gray-500 mt-1">
                            L&apos;URL est générée automatiquement. Pour les catégories parent, elle inclut aussi les sous-catégories.
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-4 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCategoryForm(false)
                            setEditingCategoryId(null)
                          }}
                          className="px-6 py-2 border-2 border-gray-300 rounded-lg font-medium"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={saveCategory}
                          disabled={saving}
                          className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg disabled:opacity-50"
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FEATURED PRODUCTS TAB */}
          {activeTab === "featured-products" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Produits en Vedette</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={deleteAllFeaturedProducts}
                    disabled={saving || featuredProductIds.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Supprimer tout
                      </>
                    )}
                  </button>
                  <button
                    onClick={saveFeaturedProducts}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
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
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Sélectionnez jusqu&apos;à 10 produits à afficher sur la page
                d&apos;accueil. Actuellement : {featuredProductIds.length} / 10
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                />
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                {filteredProducts.map((product) => {
                  const isSelected = featuredProductIds.includes(product._id)
                  return (
                    <div
                      key={product._id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleFeaturedProduct(product._id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={getMainImage(product) || "/No_Image_Available.jpg"}
                            alt={product.name.fr}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {product.name.fr}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {product.name.ar}
                          </div>
                          <div className="text-sm font-bold text-orange-600 mt-1">
                            {product.price} MAD
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "border-orange-500 bg-orange-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Selected Products */}
              {featuredProductIds.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-4">
                    Produits sélectionnés ({featuredProductIds.length})
                  </h3>
                  <div className="space-y-2">
                    {featuredProductIds.map((productId, index) => {
                      const product = allProducts.find(
                        (p) => p._id === productId
                      )
                      if (!product) return null
                      return (
                        <div
                          key={productId}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 w-8">
                              #{index + 1}
                            </span>
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                              <Image
                                src={
                                  getMainImage(product) || "/No_Image_Available.jpg"
                                }
                                alt={product.name.fr}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {product.name.fr}
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.price} MAD
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleFeaturedProduct(productId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROMO BANNER TAB */}
          {activeTab === "promo-banner" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Bannière Publicitaire</h2>
                <button
                  onClick={savePromoBanner}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
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

              <div className="text-sm text-gray-600 mb-4">
                Ajoutez une bannière publicitaire qui sera affichée sur la page
                d&apos;accueil. Vous pouvez ajouter deux versions : une pour les
                PC/tablettes et une pour les téléphones. Les clients pourront
                cliquer dessus pour être redirigés vers un produit, un pack, une
                catégorie ou une page personnalisée.
              </div>

              {/* Banner Previews */}
              {(bannerImageDesktopPreview ||
                bannerImageMobilePreview ||
                promoBanner.imageDesktop ||
                promoBanner.imageMobile) && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <label className="block text-sm font-medium mb-4">
                    Aperçu des bannières
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Desktop Preview */}
                    {(bannerImageDesktopPreview ||
                      promoBanner.imageDesktop) && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                          Version Desktop/Tablette
                        </label>
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                          <Image
                            src={
                              bannerImageDesktopPreview ||
                              promoBanner.imageDesktop
                            }
                            alt="Preview Desktop"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {/* Mobile Preview */}
                    {(bannerImageMobilePreview || promoBanner.imageMobile) && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                          Version Mobile
                        </label>
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                          <Image
                            src={
                              bannerImageMobilePreview ||
                              promoBanner.imageMobile
                            }
                            alt="Preview Mobile"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Image Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Desktop Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image Desktop/Tablette (PC et tablettes)
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageDesktopUpload}
                      className="hidden"
                      disabled={saving}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Cliquez pour télécharger
                      </span>
                    </div>
                  </label>
                  {(bannerImageDesktopPreview || promoBanner.imageDesktop) && (
                    <button
                      type="button"
                      onClick={() => {
                        setBannerImageDesktopFile(null)
                        setBannerImageDesktopPreview("")
                        setPromoBanner((prev) => ({
                          ...prev,
                          imageDesktop: ""
                        }))
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Supprimer l&apos;image
                    </button>
                  )}
                </div>

                {/* Mobile Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image Mobile (Téléphones)
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageMobileUpload}
                      className="hidden"
                      disabled={saving}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Cliquez pour télécharger
                      </span>
                    </div>
                  </label>
                  {(bannerImageMobilePreview || promoBanner.imageMobile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setBannerImageMobileFile(null)
                        setBannerImageMobilePreview("")
                        setPromoBanner((prev) => ({ ...prev, imageMobile: "" }))
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Supprimer l&apos;image
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                💡 <strong>Astuce :</strong> Au moins une image (desktop ou
                mobile) est requise. Si vous n&apos;ajoutez qu&apos;une seule
                image, elle sera utilisée pour tous les écrans.
              </div>

              {/* Link Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Type de lien *
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleBannerLinkTypeChange("custom")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      bannerLinkType === "custom"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Lien personnalisé
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBannerLinkTypeChange("product")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      bannerLinkType === "product"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Produit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBannerLinkTypeChange("pack")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      bannerLinkType === "pack"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Pack
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBannerLinkTypeChange("category")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      bannerLinkType === "category"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Catégorie
                  </button>
                </div>
              </div>

              {/* Link Input/Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {bannerLinkType === "custom"
                    ? "Lien de destination *"
                    : bannerLinkType === "product"
                    ? "Sélectionner un produit *"
                    : bannerLinkType === "pack"
                    ? "Sélectionner un pack *"
                    : "Sélectionner une catégorie *"}
                </label>

                {bannerLinkType === "custom" ? (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={promoBanner.link}
                      onChange={(e) =>
                        setPromoBanner((prev) => ({
                          ...prev,
                          link: e.target.value
                        }))
                      }
                      placeholder="/shop, /packs, /contact, etc."
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Rechercher un ${
                          bannerLinkType === "product"
                            ? "produit"
                            : bannerLinkType === "pack"
                            ? "pack"
                            : "catégorie"
                        }...`}
                        value={bannerLinkSearch}
                        onChange={(e) => setBannerLinkSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg">
                      {(bannerLinkType === "product"
                        ? allProducts
                        : bannerLinkType === "pack"
                        ? allPacks
                        : availableCategories
                      )
                        .filter((item) => {
                          const searchLower = bannerLinkSearch.toLowerCase()
                          const name = item.name?.fr || item.name || ""
                          return name.toLowerCase().includes(searchLower)
                        })
                        .map((item) => {
                          const isSelected = promoBanner.linkId === item._id
                          return (
                            <div
                              key={item._id}
                              onClick={() => handleBannerLinkSelect(item._id)}
                              className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                                isSelected
                                  ? "bg-orange-50 border-orange-200"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                              {item.images && getMainImage(item) && <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={
                                      getMainImage(item) ||
                                      item.image ||
                                      "/No_Image_Available.jpg"
                                    }
                                    alt={item.name?.fr || item.name || ""}
                                    fill
                                    className="object-cover"
                                  />
                                </div>}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">
                                    {item.name?.fr || item.name || ""}
                                  </div>
                                  {item.price && (
                                    <div className="text-xs text-gray-500">
                                      {item.price} MAD
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                    {promoBanner.linkId && (
                      <div className="text-sm text-green-600 mt-2">
                        ✓ Lien sélectionné : {promoBanner.link}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoBanner.isActive}
                    onChange={(e) =>
                      setPromoBanner((prev) => ({
                        ...prev,
                        isActive: e.target.checked
                      }))
                    }
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Bannière active (affichée sur la page d&apos;accueil)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* HOME VIDEO TAB */}
          {activeTab === "home-video" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Vidéo de la page d&apos;accueil</h2>
                  <p className="text-gray-600 mt-1 text-sm">
                    Configurez une vidéo de démonstration de produit ou tout autre contenu
                    à afficher directement sur la page d&apos;accueil.
                  </p>
                </div>
                <button
                  onClick={saveHomeVideo}
                  disabled={saving || uploadingHomeVideo}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {saving || uploadingHomeVideo ? (
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

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homeVideo.isActive}
                    onChange={(e) =>
                      setHomeVideo((prev) => ({
                        ...prev,
                        isActive: e.target.checked
                      }))
                    }
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Section vidéo active (affichée sur la page d&apos;accueil)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Type de source */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Type de source de la vidéo
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setHomeVideo((prev) => ({
                            ...prev,
                            sourceType: "upload"
                          }))
                        }
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          homeVideo.sourceType === "upload"
                            ? "bg-orange-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Upload vers S3
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setHomeVideo((prev) => ({
                            ...prev,
                            sourceType: "youtube"
                          }))
                        }
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          homeVideo.sourceType === "youtube"
                            ? "bg-orange-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        URL YouTube
                      </button>
                    </div>
                  </div>

                  {homeVideo.sourceType === "youtube" ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium mb-1">
                        URL YouTube *
                      </label>
                      <input
                        type="url"
                        value={homeVideo.youtubeUrl}
                        onChange={(e) =>
                          setHomeVideo((prev) => ({
                            ...prev,
                            youtubeUrl: e.target.value
                          }))
                        }
                        placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                      />
                      <p className="text-xs text-gray-500">
                        Collez l&apos;URL de la vidéo YouTube à afficher.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Vidéo à uploader vers S3 *
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleHomeVideoFileChange}
                            className="hidden"
                            disabled={uploadingHomeVideo || saving}
                          />
                          <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition-colors">
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Cliquez pour sélectionner une vidéo
                            </span>
                          </div>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          La vidéo sera envoyée directement depuis le navigateur vers Amazon S3,
                          sans passer par le serveur Next.js.
                        </p>
                      </div>

                      {(homeVideoPreviewUrl || homeVideo.videoUrl) && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium">
                            Aperçu de la vidéo
                          </label>
                          <div className="relative w-full rounded-xl overflow-hidden bg-black">
                            <video
                              src={homeVideoPreviewUrl || homeVideo.videoUrl}
                              controls
                              className="w-full aspect-video"
                            />
                          </div>
                          {homeVideoPreviewUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                if (homeVideoPreviewUrl) {
                                  URL.revokeObjectURL(homeVideoPreviewUrl)
                                }
                                setHomeVideoFile(null)
                                setHomeVideoPreviewUrl("")
                              }}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Retirer la vidéo sélectionnée
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 bg-gray-50 rounded-xl p-4 text-sm text-gray-700">
                  <h3 className="font-semibold mb-1">Notes importantes</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Poids conseillé</strong>: essayez de rester en
                      dessous de 200&nbsp;MB pour de meilleures performances.
                    </li>
                    <li>
                      <strong>Désactivation</strong>: décochez &quot;Section vidéo
                      active&quot; si vous ne souhaitez pas afficher la vidéo sur la
                      page d&apos;accueil.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SITE INFO TAB */}
          {activeTab === "site-info" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Informations du Site</h2>
                <button
                  onClick={saveSiteInfo}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
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

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-6">
                  <label className="flex items-center gap-2 text-lg font-semibold mb-3">
                    <Mail className="w-5 h-5 text-orange-600" />
                    Email de contact
                  </label>
                  <input
                    type="email"
                    value={siteInfo.email}
                    onChange={(e) =>
                      setSiteInfo({ ...siteInfo, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <label className="flex items-center gap-2 text-lg font-semibold mb-3">
                    <Phone className="w-5 h-5 text-orange-600" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={siteInfo.phone}
                    onChange={(e) =>
                      setSiteInfo({ ...siteInfo, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <label className="flex items-center gap-2 text-lg font-semibold mb-3">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    Adresse (Localisation)
                  </label>
                  <div className="space-y-4">
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                      <button
                        type="button"
                        onClick={() => setCurrentLanguage("fr")}
                        className={`px-4 py-2 rounded-md font-medium ${
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
                        className={`px-4 py-2 rounded-md font-medium ${
                          currentLanguage === "ar"
                            ? "bg-white text-orange-600 shadow-sm"
                            : "text-gray-600"
                        }`}
                      >
                        العربية
                      </button>
                    </div>
                    <textarea
                      value={siteInfo.location[currentLanguage]}
                      onChange={(e) =>
                        setSiteInfo({
                          ...siteInfo,
                          location: {
                            ...siteInfo.location,
                            [currentLanguage]: e.target.value
                          }
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                      placeholder={
                        currentLanguage === "fr"
                          ? "Adresse complète..."
                          : "العنوان الكامل..."
                      }
                      dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
