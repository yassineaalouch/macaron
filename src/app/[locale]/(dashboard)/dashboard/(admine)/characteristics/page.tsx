"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import { Trash2, Edit3, Save, X, Plus, Search, Filter, Eraser } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ICharacteristic } from "@/types/characteristic"
import { useToast } from "@/components/ui/Toast"
import { isColorCharacteristic, normalizeHexColor } from "@/utils/colorCharacteristic"

export default function CharacteristicsPage() {
  const { showToast } = useToast()
  const [characteristics, setCharacteristics] = useState<ICharacteristic[]>([])
  const [newChar, setNewChar] = useState<ICharacteristic>({
    _id: crypto.randomUUID(),
    name: { ar: "", fr: "" },
    values: []
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editChar, setEditChar] = useState<ICharacteristic | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isColorChar, setIsColorChar] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    id: string | null
    name: string
    productsCount: number
    loading: boolean
  }>({ open: false, id: null, name: "", productsCount: 0, loading: false })
  const [cleanupLoading, setCleanupLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const res = await axios.get("/api/characteristics")
    setCharacteristics(res.data)
  }

  // Vérifier si une caractéristique de couleur existe déjà
  const hasColorCharacteristic = characteristics.some(
    (char) => isColorCharacteristic(char.name.fr) || isColorCharacteristic(char.name.ar)
  )

  // Filtrage des caractéristiques
  const filteredCharacteristics = characteristics.filter((char) => {
    const matchesSearch =
      char.name.fr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.name.ar.includes(searchTerm)
    return matchesSearch
  })

  // ----------------- Ajout de nouvelle caractéristique -----------------
  function addValueField() {
    setNewChar({
      ...newChar,
      values: [...newChar.values, { name: { ar: "", fr: "" } }]
    })
  }

  function removeNewValue(index: number) {
    const updated = [...newChar.values]
    updated.splice(index, 1)
    setNewChar({ ...newChar, values: updated })
  }

  async function addCharacteristic() {
    if (!newChar.name.fr.trim() || !newChar.name.ar.trim()) {
      alert("Veuillez remplir les noms en français et arabe")
      return
    }

    // Vérifier si l'utilisateur essaie d'ajouter une caractéristique de couleur alors qu'une existe déjà
    const isTryingToAddColor = isColorCharacteristic(newChar.name.fr) || isColorCharacteristic(newChar.name.ar)
    if (isTryingToAddColor && hasColorCharacteristic) {
      alert("Une caractéristique de couleur existe déjà. Vous ne pouvez avoir qu'une seule caractéristique de type couleur.")
      return
    }

    setLoading(true)
    try {
      const res = await axios.post("/api/characteristics", {
        ...newChar,
        createdAt: new Date().toISOString()
      })
      setCharacteristics([...characteristics, res.data])
      setNewChar({
        _id: "",
        name: { ar: "", fr: "" },
        values: []
      })
      setIsColorChar(false)
      setIsAddingNew(false)
      showToast("Caractéristique ajoutée avec succès", "success")
    } catch (error) {
      showToast("Erreur lors de l'ajout de la caractéristique", "error")
    }
    setLoading(false)
  }

  function cancelAdd() {
    setIsAddingNew(false)
    setIsColorChar(false)
    setNewChar({
      _id: crypto.randomUUID(),
      name: { ar: "", fr: "" },
      values: []
    })
  }

  // ----------------- Edition -----------------
  function startEdit(char: ICharacteristic) {
    setEditingId(char._id!)
    setEditChar(JSON.parse(JSON.stringify(char)))
    // Détecter si c'est une caractéristique de couleur
    const isColor = isColorCharacteristic(char.name.fr) || isColorCharacteristic(char.name.ar)
    setIsColorChar(isColor)
  }

  // Vérifier si une autre caractéristique de couleur existe (pour l'édition)
  const hasOtherColorCharacteristic = (currentId?: string) => {
    return characteristics.some(
      (char) => 
        char._id !== currentId && 
        (isColorCharacteristic(char.name.fr) || isColorCharacteristic(char.name.ar))
    )
  }

  function cancelEdit() {
    setEditingId(null)
    setEditChar(null)
    setIsColorChar(false)
  }

  function addEditValueField() {
    if (!editChar) return
    setEditChar({
      ...editChar,
      values: [...editChar.values, { name: { ar: "", fr: "" } }]
    })
  }

  function removeEditValue(index: number) {
    if (!editChar) return
    const updated = [...editChar.values]
    updated.splice(index, 1)
    setEditChar({ ...editChar, values: updated })
  }

  async function saveEdit() {
    if (!editChar || !editChar._id) return
    
    // Vérifier si l'utilisateur essaie de modifier une caractéristique en couleur alors qu'une autre existe déjà
    const isTryingToMakeColor = isColorCharacteristic(editChar.name.fr) || isColorCharacteristic(editChar.name.ar)
    if (isTryingToMakeColor && hasOtherColorCharacteristic(editChar._id)) {
      alert("Une autre caractéristique de couleur existe déjà. Vous ne pouvez avoir qu'une seule caractéristique de type couleur.")
      return
    }

    setLoading(true)
    try {
      await axios.put(`/api/characteristics/${editChar._id}`, editChar)
      await fetchData()
      setEditingId(null)
      setEditChar(null)
      setIsColorChar(false)
      showToast("Caractéristique modifiée avec succès", "success")
    } catch (error) {
      showToast("Erreur lors de la modification de la caractéristique", "error")
    }
    setLoading(false)
  }

  // ----------------- Suppression -----------------
  async function openDeleteConfirm(char: ICharacteristic) {
    if (!char._id) return
    setDeleteModal((m) => ({ ...m, open: true, id: char._id!, name: char.name?.fr || char.name?.ar || "Cette caractéristique", productsCount: -1, loading: true }))
    try {
      const { data } = await axios.get<{ productsCount: number }>(`/api/characteristics/${char._id}?productsCount=1`)
      setDeleteModal((m) => ({ ...m, productsCount: data.productsCount ?? 0, loading: false }))
    } catch {
      setDeleteModal((m) => ({ ...m, productsCount: 0, loading: false }))
    }
  }

  function closeDeleteModal() {
    setDeleteModal({ open: false, id: null, name: "", productsCount: 0, loading: false })
  }

  async function confirmDeleteCharacteristic() {
    const { id } = deleteModal
    if (!id) return
    setDeleteModal((m) => ({ ...m, loading: true }))
    try {
      await axios.delete(`/api/characteristics/${id}`)
      setCharacteristics(characteristics.filter((c) => c._id !== id))
      closeDeleteModal()
      showToast("Caractéristique supprimée avec succès", "success")
    } catch (error) {
      showToast("Erreur lors de la suppression de la caractéristique", "error")
      setDeleteModal((m) => ({ ...m, loading: false }))
    }
  }

  async function cleanupProducts() {
    if (
      !confirm(
        "Retirer des produits toutes les références aux caractéristiques déjà supprimées ? Les produits concernés seront mis à jour."
      )
    )
      return
    setCleanupLoading(true)
    try {
      const { data } = await axios.post<{
        success: boolean
        updated: number
        totalProcessed: number
      }>("/api/characteristics/cleanup")
      if (data.updated === 0) {
        showToast("Aucune référence orpheline trouvée. Tous les produits sont à jour.", "success")
      } else {
        showToast(
          `${data.updated} produit(s) mis à jour : références orphelines supprimées.`,
          "success"
        )
      }
    } catch {
      showToast("Erreur lors du nettoyage des produits", "error")
    } finally {
      setCleanupLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec statistiques */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des Caractéristiques
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez les caractéristiques de vos produits
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
              <button
                onClick={cleanupProducts}
                disabled={cleanupLoading}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                title="Parcourt tous les produits et retire du tableau « Caractéristiques » les entrées qui pointent vers une caractéristique déjà supprimée (références orphelines). Utile après avoir supprimé des caractéristiques utilisées par des produits avant la mise en place de la suppression en cascade."
              >
                {cleanupLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Eraser className="w-4 h-4" />
                )}
                Nettoyer les produits
              </button>
              <button
                onClick={() => setIsAddingNew(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouvelle Caractéristique
              </button>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une caractéristique..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout intégré dans la page */}
        <AnimatePresence>
          {isAddingNew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Nouvelle Caractéristique
                </h2>
                <button
                  onClick={cancelAdd}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Checkbox pour détecter automatiquement "Couleur" - cachée si une couleur existe déjà */}
                {!hasColorCharacteristic && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="isColorChar"
                      checked={isColorChar}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setIsColorChar(checked)
                        if (checked) {
                          // Remplir automatiquement les noms
                          setNewChar({
                            ...newChar,
                            name: { fr: "Couleur", ar: "لون" }
                          })
                        } else {
                          // Réinitialiser si décoché
                          setNewChar({
                            ...newChar,
                            name: { fr: "", ar: "" }
                          })
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isColorChar" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Cette caractéristique est une couleur
                    </label>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom (Français) *
                    </label>
                    <input
                      placeholder="Ex: Couleur, Taille..."
                      value={newChar.name.fr}
                      onChange={(e) => {
                        const value = e.target.value
                        setNewChar({
                          ...newChar,
                          name: { ...newChar.name, fr: value }
                        })
                        // Détecter automatiquement si c'est une couleur
                        const detected = isColorCharacteristic(value)
                        if (detected) {
                          if (hasColorCharacteristic) {
                            alert("Une caractéristique de couleur existe déjà. Vous ne pouvez avoir qu'une seule caractéristique de type couleur.")
                            setNewChar({
                              ...newChar,
                              name: { ...newChar.name, fr: "" }
                            })
                            return
                          }
                          if (!isColorChar) {
                            setIsColorChar(true)
                            setNewChar({
                              ...newChar,
                              name: { fr: "Couleur", ar: "لون" }
                            })
                          }
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isColorChar}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم (العربية) *
                    </label>
                    <input
                      placeholder="مثال: لون، مقاس..."
                      dir="rtl"
                      value={newChar.name.ar}
                      onChange={(e) => {
                        const value = e.target.value
                        setNewChar({
                          ...newChar,
                          name: { ...newChar.name, ar: value }
                        })
                        // Détecter automatiquement si c'est une couleur
                        const detected = isColorCharacteristic(value)
                        if (detected) {
                          if (hasColorCharacteristic) {
                            alert("Une caractéristique de couleur existe déjà. Vous ne pouvez avoir qu'une seule caractéristique de type couleur.")
                            setNewChar({
                              ...newChar,
                              name: { ...newChar.name, ar: "" }
                            })
                            return
                          }
                          if (!isColorChar) {
                            setIsColorChar(true)
                            setNewChar({
                              ...newChar,
                              name: { fr: "Couleur", ar: "لون" }
                            })
                          }
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      disabled={isColorChar}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Valeurs Possibles
                    </h3>
                    <button
                      onClick={addValueField}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une valeur
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newChar.values.map((v, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`grid ${isColorChar ? "md:grid-cols-3" : "md:grid-cols-2"} gap-3 items-center`}
                      >
                        {isColorChar ? (
                          // Mode couleur : color picker
                          <>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={normalizeHexColor(v.name.fr || "#000000")}
                                onChange={(e) => {
                                  const hexColor = normalizeHexColor(e.target.value)
                                  const updated = [...newChar.values]
                                  updated[i].name.fr = hexColor
                                  updated[i].name.ar = hexColor
                                  setNewChar({ ...newChar, values: updated })
                                }}
                                className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                              />
                              <input
                                type="text"
                                placeholder="#000000"
                                value={v.name.fr || ""}
                                onChange={(e) => {
                                  const hexColor = normalizeHexColor(e.target.value)
                                  const updated = [...newChar.values]
                                  updated[i].name.fr = hexColor
                                  updated[i].name.ar = hexColor
                                  setNewChar({ ...newChar, values: updated })
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-sm font-mono"
                                maxLength={7}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                                style={{ backgroundColor: normalizeHexColor(v.name.fr || "#000000") }}
                              />
                              <span className="text-sm text-gray-600">
                                {normalizeHexColor(v.name.fr || "#000000")}
                              </span>
                            </div>
                            <button
                              onClick={() => removeNewValue(i)}
                              className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          // Mode normal : champs texte
                          <>
                            <input
                              placeholder="Valeur en français"
                              value={v.name.fr}
                              onChange={(e) => {
                                const updated = [...newChar.values]
                                updated[i].name.fr = e.target.value
                                setNewChar({ ...newChar, values: updated })
                              }}
                              className="p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                              <input
                                placeholder="القيمة بالعربية"
                                dir="rtl"
                                value={v.name.ar}
                                onChange={(e) => {
                                  const updated = [...newChar.values]
                                  updated[i].name.ar = e.target.value
                                  setNewChar({ ...newChar, values: updated })
                                }}
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-right"
                              />
                              <button
                                onClick={() => removeNewValue(i)}
                                className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                    {newChar.values.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Aucune valeur ajoutée. Cliquez sur &apos;Ajouter une
                        valeur&apos; pour commencer.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={cancelAdd}
                    className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={addCharacteristic}
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
                        Créer la Caractéristique
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tableau des caractéristiques */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caractéristique
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valeurs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créée le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredCharacteristics.map((char, index) => {
                    const isEditing = editingId === char._id
                    return (
                      <motion.tr
                        key={char._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing && editChar ? (
                            <div className="space-y-3">
                              {/* Checkbox pour mode couleur en édition - cachée si une autre couleur existe */}
                              {!hasOtherColorCharacteristic(editChar._id) && (
                                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <input
                                    type="checkbox"
                                    id="isColorCharEdit"
                                    checked={isColorChar}
                                    onChange={(e) => {
                                      const checked = e.target.checked
                                      setIsColorChar(checked)
                                      if (checked) {
                                        setEditChar({
                                          ...editChar,
                                          name: { fr: "Couleur", ar: "لون" }
                                        })
                                      }
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor="isColorCharEdit" className="text-xs font-medium text-gray-700 cursor-pointer">
                                    Caractéristique de couleur
                                  </label>
                                </div>
                              )}
                              <div className="flex flex-col space-y-2">
                                <input
                                  value={editChar.name.fr}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    setEditChar({
                                      ...editChar,
                                      name: {
                                        ...editChar.name,
                                        fr: value
                                      }
                                    })
                                    // Détecter automatiquement si c'est une couleur
                                    const detected = isColorCharacteristic(value)
                                    if (detected) {
                                      if (hasOtherColorCharacteristic(editChar._id)) {
                                        alert("Une autre caractéristique de couleur existe déjà. Vous ne pouvez avoir qu'une seule caractéristique de type couleur.")
                                        setEditChar({
                                          ...editChar,
                                          name: {
                                            ...editChar.name,
                                            fr: editChar.name.fr
                                          }
                                        })
                                        return
                                      }
                                      if (!isColorChar) {
                                        setIsColorChar(true)
                                        setEditChar({
                                          ...editChar,
                                          name: { fr: "Couleur", ar: "لون" }
                                        })
                                      }
                                    }
                                  }}
                                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  disabled={isColorChar}
                                />
                                <input
                                  value={editChar.name.ar}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    setEditChar({
                                      ...editChar,
                                      name: {
                                        ...editChar.name,
                                        ar: value
                                      }
                                    })
                                    // Détecter automatiquement si c'est une couleur
                                    const detected = isColorCharacteristic(value)
                                    if (detected) {
                                      if (hasOtherColorCharacteristic(editChar._id)) {
                                        alert("Une autre caractéristique de couleur existe déjà. Vous ne pouvez avoir qu'une seule caractéristique de type couleur.")
                                        setEditChar({
                                          ...editChar,
                                          name: {
                                            ...editChar.name,
                                            ar: editChar.name.ar
                                          }
                                        })
                                        return
                                      }
                                      if (!isColorChar) {
                                        setIsColorChar(true)
                                        setEditChar({
                                          ...editChar,
                                          name: { fr: "Couleur", ar: "لون" }
                                        })
                                      }
                                    }
                                  }}
                                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-right"
                                  dir="rtl"
                                  disabled={isColorChar}
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {char.name.fr}
                              </div>
                              <div
                                className="text-sm text-gray-500 text-right"
                                dir="rtl"
                              >
                                {char.name.ar}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {isEditing && editChar ? (
                            <div className="space-y-2">
                              {editChar.values.map((v, i) => {
                                const isColor = isColorCharacteristic(editChar.name.fr) || isColorCharacteristic(editChar.name.ar)
                                return (
                                  <div
                                    key={i}
                                    className={`flex gap-2 items-center ${isColor ? "flex-wrap" : ""}`}
                                  >
                                    {isColor ? (
                                      // Mode couleur : color picker
                                      <>
                                        <div className="flex items-center gap-2 flex-1">
                                          <input
                                            type="color"
                                            value={normalizeHexColor(v.name.fr || "#000000")}
                                            onChange={(e) => {
                                              const hexColor = normalizeHexColor(e.target.value)
                                              const updated = [...editChar.values]
                                              updated[i].name.fr = hexColor
                                              updated[i].name.ar = hexColor
                                              setEditChar({
                                                ...editChar,
                                                values: updated
                                              })
                                            }}
                                            className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                                          />
                                          <input
                                            type="text"
                                            placeholder="#000000"
                                            value={v.name.fr || ""}
                                            onChange={(e) => {
                                              const hexColor = normalizeHexColor(e.target.value)
                                              const updated = [...editChar.values]
                                              updated[i].name.fr = hexColor
                                              updated[i].name.ar = hexColor
                                              setEditChar({
                                                ...editChar,
                                                values: updated
                                              })
                                            }}
                                            className="flex-1 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm font-mono"
                                            maxLength={7}
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                                            style={{ backgroundColor: normalizeHexColor(v.name.fr || "#000000") }}
                                          />
                                        </div>
                                        <button
                                          onClick={() => removeEditValue(i)}
                                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </>
                                    ) : (
                                      // Mode normal : champs texte
                                      <>
                                        <input
                                          value={v.name.fr}
                                          onChange={(e) => {
                                            const updated = [...editChar.values]
                                            updated[i].name.fr = e.target.value
                                            setEditChar({
                                              ...editChar,
                                              values: updated
                                            })
                                          }}
                                          className="flex-1 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                                          placeholder="FR"
                                        />
                                        <input
                                          value={v.name.ar}
                                          onChange={(e) => {
                                            const updated = [...editChar.values]
                                            updated[i].name.ar = e.target.value
                                            setEditChar({
                                              ...editChar,
                                              values: updated
                                            })
                                          }}
                                          className="flex-1 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm text-right"
                                          placeholder="AR"
                                          dir="rtl"
                                        />
                                        <button
                                          onClick={() => removeEditValue(i)}
                                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )
                              })}
                              <button
                                onClick={addEditValueField}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Ajouter une valeur
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {char.values.slice(0, 3).map((value, idx) => {
                                const isColor = isColorCharacteristic(char.name.fr) || isColorCharacteristic(char.name.ar)
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full ${
                                      isColor ? "bg-white border border-gray-300" : ""
                                    }`}
                                  >
                                    {isColor && value.name.fr ? (
                                      <>
                                        <div
                                          className="w-4 h-4 rounded-full border border-gray-400"
                                          style={{ backgroundColor: normalizeHexColor(value.name.fr) }}
                                        />
                                        <span className="font-mono text-xs">{normalizeHexColor(value.name.fr)}</span>
                                      </>
                                    ) : (
                                      value.name.fr
                                    )}
                                  </span>
                                )
                              })}
                              {char.values.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{char.values.length - 3} plus
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {char.createdAt
                            ? new Date(char.createdAt).toLocaleDateString(
                                "fr-FR"
                              )
                            : "N/A"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={saveEdit}
                                disabled={loading}
                                className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                                title="Sauvegarder"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                                title="Annuler"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => startEdit(char)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                                title="Modifier"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => openDeleteConfirm(char)}
                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredCharacteristics.length === 0 && !isAddingNew && (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune caractéristique trouvée</p>
              {characteristics.length === 0 && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Créer la première caractéristique
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modale de confirmation de suppression */}
        <AnimatePresence>
          {deleteModal.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={closeDeleteModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmer la suppression
                </h3>
                {deleteModal.loading && deleteModal.productsCount === -1 ? (
                  <p className="text-gray-600 mb-4">Vérification des produits concernés...</p>
                ) : (
                  <p className="text-gray-600 mb-4">
                    La caractéristique <strong>« {deleteModal.name} »</strong> est utilisée par{" "}
                    <strong>{deleteModal.productsCount} produit(s)</strong>. Sa suppression
                    entraînera son retrait du tableau des caractéristiques de tous ces produits.
                    <br />
                    <br />
                    Souhaitez-vous continuer ?
                  </p>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={deleteModal.loading}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteCharacteristic}
                    disabled={deleteModal.loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleteModal.loading && deleteModal.productsCount !== -1 ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      "Confirmer la suppression"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
