"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import {
  Trash2,
  Edit3,
  Save,
  X,
  Plus,
  Search,
  MessageCircle,
  MessageCircleQuestion,
  Clock
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ILocalizedText, IQA } from "@/types/qa"
import { useToast } from "@/components/ui/Toast"

interface OpeningHourDay {
  day: {
    fr: string
    ar: string
  }
  hours: {
    fr: string
    ar: string
  }
  isClosed: boolean
  order: number
}

interface OpeningHoursData {
  hours: OpeningHourDay[]
  note: {
    fr: string
    ar: string
  }
}

export default function QAManager() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<"qa" | "hours">("qa")
  const [qas, setQAs] = useState<IQA[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQA, setEditingQA] = useState<IQA | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<IQA | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [openingHours, setOpeningHours] = useState<OpeningHoursData | null>(null)
  const [hoursLoading, setHoursLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // Pour forcer le re-render des sélecteurs

  const [form, setForm] = useState<IQA>({
    question: { ar: "", fr: "" },
    answer: { ar: "", fr: "" }
  })

  const fetchQAs = async () => {
    try {
      const { data } = await axios.get("/api/qa")
      if (data.success) {
        setQAs(data.data || [])
      } else {
        showToast(
          data.message || "Impossible de charger les questions et réponses depuis le serveur.",
          "error"
        )
      }
    } catch (error) {
      let errorMessage = "Impossible de charger les questions et réponses."
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = `Erreur réseau : ${error.message}`
        }
      } else if (error instanceof Error) {
        errorMessage = `Erreur : ${error.message}`
      }
      showToast(errorMessage, "error")
    }
  }

  useEffect(() => {
    fetchQAs()
    fetchOpeningHours()
  }, [])

  const fetchOpeningHours = async () => {
    try {
      const { data } = await axios.get("/api/opening-hours")
      if (data.success) {
        setOpeningHours(data.data)
        setRefreshKey(prev => prev + 1) // Réinitialiser la clé après chargement
      } else {
        showToast(
          data.message || "Impossible de charger les horaires d'ouverture depuis le serveur.",
          "error"
        )
      }
    } catch (error) {
      let errorMessage = "Impossible de charger les horaires d'ouverture."
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = `Erreur réseau : ${error.message}`
        }
      } else if (error instanceof Error) {
        errorMessage = `Erreur : ${error.message}`
      }
      showToast(errorMessage, "error")
    }
  }

  // Fonction helper pour générer les options d'heures (00:00 à 23:30 par pas de 30 minutes)
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        options.push(timeString)
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  // Fonction pour parser les horaires (ex: "08:00 - 18:00" -> { start: "08:00", end: "18:00" })
  const parseHours = (hoursString: string) => {
    if (!hoursString || hoursString.trim() === "") {
      return { start: "", end: "" }
    }
    const parts = hoursString.split("-").map((p) => p.trim())
    return {
      start: parts[0] || "",
      end: parts[1] || ""
    }
  }

  // Fonction pour formater les horaires (ex: { start: "08:00", end: "18:00" } -> "08:00 - 18:00")
  const formatHours = (start: string, end: string) => {
    // Nettoyer les valeurs
    const cleanStart = (start || "").trim()
    const cleanEnd = (end || "").trim()
    
    // Si les deux sont vides, retourner une chaîne vide
    if (!cleanStart && !cleanEnd) return ""
    
    // Si une seule partie est remplie, garder le format pour faciliter le parsing
    if (cleanStart && !cleanEnd) return `${cleanStart} - `
    if (!cleanStart && cleanEnd) return ` - ${cleanEnd}`
    
    // Si les deux sont remplis, retourner le format complet
    return `${cleanStart} - ${cleanEnd}`
  }

  const handleSaveHours = async () => {
    if (!openingHours) {
      showToast("Aucune donnée d'horaires à sauvegarder.", "error")
      return
    }

    // Validation avant envoi
    if (!openingHours.hours || openingHours.hours.length !== 7) {
      showToast("Les horaires doivent contenir exactement 7 jours.", "error")
      return
    }

    // Copier automatiquement les horaires français vers l'arabe (même valeur)
    const hoursToSave = {
      ...openingHours,
      hours: openingHours.hours.map((day) => ({
        ...day,
        hours: {
          fr: day.hours.fr || "",
          ar: day.hours.fr || "" // Copier les horaires français vers l'arabe
        }
      }))
    }

    // Validation que tous les jours non fermés ont des horaires complets
    for (let i = 0; i < hoursToSave.hours.length; i++) {
      const day = hoursToSave.hours[i]
      if (!day.isClosed) {
        const frHours = parseHours(day.hours.fr)
        
        if (!frHours.start || !frHours.end) {
          showToast(
            `Le ${day.day.fr} n'a pas d'horaires complets. Veuillez sélectionner l'heure de début et de fin.`,
            "error"
          )
          return
        }
      }
    }

    setHoursLoading(true)
    try {
      const { data } = await axios.put("/api/opening-hours", hoursToSave)
      if (data.success) {
        showToast("Les horaires d'ouverture ont été mis à jour avec succès.", "success")
        await fetchOpeningHours()
      } else {
        showToast(
          data.message || "La sauvegarde a échoué. Veuillez réessayer.",
          "error"
        )
      }
    } catch (error) {
      let errorMessage = "Impossible de sauvegarder les horaires d'ouverture."
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response?.data?.errors) {
          errorMessage = `Erreurs de validation : ${error.response.data.errors.join(", ")}`
        } else if (error.message) {
          errorMessage = `Erreur réseau : ${error.message}`
        }
      } else if (error instanceof Error) {
        errorMessage = `Erreur : ${error.message}`
      }
      showToast(errorMessage, "error")
    } finally {
      setHoursLoading(false)
    }
  }

  const filteredQAs = qas.filter(
    (qa) =>
      qa.question.fr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qa.question.ar.includes(searchTerm) ||
      qa.answer.fr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qa.answer.ar.includes(searchTerm)
  )

  // Création d'une nouvelle Q&A
  const handleSubmit = async () => {
    if (
      !form.question.fr.trim() ||
      !form.question.ar.trim() ||
      !form.answer.fr.trim() ||
      !form.answer.ar.trim()
    ) {
      alert("Veuillez remplir tous les champs")
      return
    }

    setLoading(true)
    try {
      if (editingQA) {
        await axios.put(`/api/qa/${editingQA._id}`, form)
      } else {
        await axios.post("/api/qa", {
          ...form,
          createdAt: new Date().toISOString()
        })
      }
      await fetchQAs()
      showToast(editingQA ? "Q&A mise à jour avec succès" : "Q&A créée avec succès", "success")
      closeForm()
    } catch (error) {
      let errorMessage = "Impossible de sauvegarder la question et réponse."
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = `Erreur réseau : ${error.message}`
        }
      } else if (error instanceof Error) {
        errorMessage = `Erreur : ${error.message}`
      }
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }

  // Édition inline
  const startEdit = (qa: IQA) => {
    setEditingId(qa._id!)
    setEditForm(JSON.parse(JSON.stringify(qa))) // Deep copy
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const saveEdit = async () => {
    if (!editForm || !editForm._id) return

    if (
      !editForm.question.fr.trim() ||
      !editForm.question.ar.trim() ||
      !editForm.answer.fr.trim() ||
      !editForm.answer.ar.trim()
    ) {
      alert("Veuillez remplir tous les champs")
      return
    }

    setLoading(true)
    try {
      await axios.put(`/api/qa/${editForm._id}`, editForm)
      await fetchQAs()
      showToast("Q&A mise à jour avec succès", "success")
      setEditingId(null)
      setEditForm(null)
    } catch (error) {
      let errorMessage = "Impossible de mettre à jour la question et réponse."
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = `Erreur réseau : ${error.message}`
        }
      } else if (error instanceof Error) {
        errorMessage = `Erreur : ${error.message}`
      }
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingQA(null)
    setForm({
      question: { ar: "", fr: "" },
      answer: { ar: "", fr: "" }
    })
  }

  const openCreateForm = () => {
    setIsFormOpen(true)
    setEditingQA(null)
    setForm({
      question: { ar: "", fr: "" },
      answer: { ar: "", fr: "" }
    })
  }

  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm("Êtes-vous sûr de vouloir supprimer cette Q&A ?"))
      return
    try {
      await axios.delete(`/api/qa/${id}`)
      await fetchQAs()
      showToast("Q&A supprimée avec succès", "success")
    } catch (error) {
      let errorMessage = "Impossible de supprimer la question et réponse."
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = `Erreur réseau : ${error.message}`
        }
      } else if (error instanceof Error) {
        errorMessage = `Erreur : ${error.message}`
      }
      showToast(errorMessage, "error")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header avec statistiques */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Contact Page Content
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez le contenu de la page de contact (FAQ et horaires d'ouverture)
              </p>
            </div>
            {activeTab === "qa" && (
              <button
                onClick={openCreateForm}
                className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouvelle Q&A
              </button>
            )}
          </div>

          {/* Onglets */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("qa")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "qa"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircleQuestion className="w-4 h-4" />
                Questions & Réponses
              </div>
            </button>
            <button
              onClick={() => setActiveTab("hours")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "hours"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horaires d'Ouverture
              </div>
            </button>
          </div>
        </div>

        {/* Contenu conditionnel selon l'onglet */}
        {activeTab === "qa" ? (
          <>
            {/* Barre de recherche */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher une question ou réponse..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

        {/* Formulaire de création */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Nouvelle Q&A
                </h2>
                <button
                  onClick={closeForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Question FR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question (Français) *
                  </label>
                  <input
                    type="text"
                    value={form.question.fr}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        question: { ...form.question, fr: e.target.value }
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Entrez la question en français"
                  />
                </div>

                {/* Question AR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السؤال (العربية) *
                  </label>
                  <input
                    type="text"
                    value={form.question.ar}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        question: { ...form.question, ar: e.target.value }
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="أدخل السؤال بالعربية"
                    dir="rtl"
                  />
                </div>

                {/* Réponse FR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Réponse (Français) *
                  </label>
                  <textarea
                    value={form.answer.fr}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        answer: { ...form.answer, fr: e.target.value }
                      })
                    }
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    placeholder="Entrez la réponse en français"
                  />
                </div>

                {/* Réponse AR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الجواب (العربية) *
                  </label>
                  <textarea
                    value={form.answer.ar}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        answer: { ...form.answer, ar: e.target.value }
                      })
                    }
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right resize-vertical"
                    placeholder="أدخل الجواب بالعربية"
                    dir="rtl"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={closeForm}
                    className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Créer la Q&A
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste des Q&A avec édition inline */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <MessageCircleQuestion className="w-6 h-6 text-blue-500" />
            Questions & Réponses ({filteredQAs.length})
          </h2>

          <AnimatePresence>
            {filteredQAs.map((qa, index) => {
              const isEditing = editingId === qa._id
              return (
                <motion.div
                  key={qa._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* En-tête avec actions */}
                    <div className="flex items-start justify-between mb-4">
                      {isEditing && editForm ? (
                        <div className="flex-1 space-y-4">
                          {/* Édition des questions */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Question (FR)
                              </label>
                              <input
                                value={editForm.question.fr}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    question: {
                                      ...editForm.question,
                                      fr: e.target.value
                                    }
                                  })
                                }
                                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                السؤال (AR)
                              </label>
                              <input
                                value={editForm.question.ar}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    question: {
                                      ...editForm.question,
                                      ar: e.target.value
                                    }
                                  })
                                }
                                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-right"
                                dir="rtl"
                              />
                            </div>
                          </div>

                          {/* Édition des réponses */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Réponse (FR)
                              </label>
                              <textarea
                                value={editForm.answer.fr}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    answer: {
                                      ...editForm.answer,
                                      fr: e.target.value
                                    }
                                  })
                                }
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-vertical"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                الجواب (AR)
                              </label>
                              <textarea
                                value={editForm.answer.ar}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    answer: {
                                      ...editForm.answer,
                                      ar: e.target.value
                                    }
                                  })
                                }
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-right resize-vertical"
                                dir="rtl"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {qa.question.fr}
                          </h3>
                          <p className="text-gray-600 text-right" dir="rtl">
                            {qa.question.ar}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveEdit}
                              disabled={loading}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Sauvegarder"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(qa)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(qa._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Affichage des réponses (seulement en mode lecture) */}
                    {!isEditing && (
                      <div className="grid md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-100">
                        {/* Réponse FR */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-green-600" />
                            Réponse (Français)
                          </h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed">
                            {qa.answer.fr}
                          </p>
                        </div>

                        {/* Réponse AR */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 justify-end">
                            <MessageCircle className="w-4 h-4 text-purple-600" />
                            الجواب (العربية)
                          </h4>
                          <p
                            className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed text-right"
                            dir="rtl"
                          >
                            {qa.answer.ar}
                          </p>
                        </div>
                      </div>
                    )}

                    {qa.createdAt && !isEditing && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Créée le{" "}
                          {new Date(qa.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredQAs.length === 0 && !isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-lg border border-gray-200"
            >
              <MessageCircleQuestion className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                {qas.length === 0
                  ? "Aucune Q&A pour le moment"
                  : "Aucune Q&A trouvée"}
              </p>
              {qas.length === 0 && (
                <button
                  onClick={openCreateForm}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 justify-center mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Créer la première Q&A
                </button>
              )}
            </motion.div>
          )}
        </div>
          </>
        ) : (
          /* Section Horaires d'Ouverture */
          <div className="space-y-6">
            {openingHours && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Horaires d'Ouverture
                  </h2>
                  <button
                    onClick={handleSaveHours}
                    disabled={hoursLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {hoursLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Sauvegarder
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-4">
                  {openingHours.hours
                    .sort((a, b) => a.order - b.order)
                    .map((day, index) => (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          day.isClosed
                            ? "border-red-200 bg-red-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{day.day.fr}</h4>
                              <p className="text-sm text-gray-500 text-right" dir="rtl">
                                {day.day.ar}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={day.isClosed}
                              onChange={(e) => {
                                const isClosed = e.target.checked
                                const updatedHours = openingHours.hours.map((h, i) => {
                                  if (i === index) {
                                    return {
                                      ...h,
                                      isClosed,
                                      hours: isClosed
                                        ? { fr: "", ar: "" }
                                        : { fr: "", ar: "" } // Toujours initialiser à vide quand on décoche
                                    }
                                  }
                                  return h
                                })
                                // Forcer la mise à jour en créant un nouvel objet et en incrémentant la clé
                                setOpeningHours({ 
                                  ...openingHours, 
                                  hours: updatedHours 
                                })
                                // Forcer le re-render des sélecteurs
                                setRefreshKey(prev => prev + 1)
                              }}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label className="text-sm font-medium text-gray-700">
                              Fermé ce jour
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Horaires d'ouverture
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              key={`start-${index}-${day.isClosed}-${refreshKey}`}
                              value={parseHours(day.hours?.fr || "").start || ""}
                              disabled={day.isClosed}
                              onChange={(e) => {
                                const current = parseHours(day.hours?.fr || "")
                                const newHours = formatHours(e.target.value, current.end || "")
                                // Mettre à jour les deux langues avec la même valeur
                                const updatedHours = openingHours.hours.map((h, i) =>
                                  i === index
                                    ? { ...h, hours: { fr: newHours, ar: newHours }, isClosed: false }
                                    : h
                                )
                                setOpeningHours({ ...openingHours, hours: updatedHours })
                              }}
                              className={`flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                day.isClosed
                                  ? "bg-gray-100 cursor-not-allowed border-gray-200 opacity-60"
                                  : "bg-white border-gray-300 hover:border-blue-400 cursor-pointer"
                              }`}
                            >
                              <option value="">Heure début</option>
                              {timeOptions.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                            <span className="text-gray-500 font-medium">-</span>
                            <select
                              key={`end-${index}-${day.isClosed}-${refreshKey}`}
                              value={parseHours(day.hours?.fr || "").end || ""}
                              disabled={day.isClosed}
                              onChange={(e) => {
                                const current = parseHours(day.hours?.fr || "")
                                const newHours = formatHours(current.start || "", e.target.value)
                                // Mettre à jour les deux langues avec la même valeur
                                const updatedHours = openingHours.hours.map((h, i) =>
                                  i === index
                                    ? { ...h, hours: { fr: newHours, ar: newHours }, isClosed: false }
                                    : h
                                )
                                setOpeningHours({ ...openingHours, hours: updatedHours })
                              }}
                              className={`flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                day.isClosed
                                  ? "bg-gray-100 cursor-not-allowed border-gray-200 opacity-60"
                                  : "bg-white border-gray-300 hover:border-blue-400 cursor-pointer"
                              }`}
                            >
                              <option value="">Heure fin</option>
                              {timeOptions.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Les horaires seront automatiquement appliqués aux deux langues (français et arabe)
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Note */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Note</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Note (Français)
                      </label>
                      <textarea
                        value={openingHours.note.fr}
                        onChange={(e) => {
                          setOpeningHours({
                            ...openingHours,
                            note: { ...openingHours.note, fr: e.target.value }
                          })
                        }}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-vertical"
                        placeholder="Note affichée sous les horaires"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        ملاحظة (العربية)
                      </label>
                      <textarea
                        value={openingHours.note.ar}
                        onChange={(e) => {
                          setOpeningHours({
                            ...openingHours,
                            note: { ...openingHours.note, ar: e.target.value }
                          })
                        }}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-vertical text-right"
                        dir="rtl"
                        placeholder="ملاحظة تظهر تحت الساعات"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
