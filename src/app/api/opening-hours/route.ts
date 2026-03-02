// app/api/opening-hours/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import OpeningHours from "@/models/OpeningHours"

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

interface ValidationError extends Error {
  name: "ValidationError"
  errors: {
    [key: string]: {
      message: string
    }
  }
}

function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ValidationError"
  )
}

// GET - Récupérer les horaires d'ouverture (un seul document)
export async function GET() {
  try {
    await connectToDatabase()

    // Récupérer le document unique
    let openingHours = await OpeningHours.findOne({ singleton: "opening_hours" })

    // Si aucun document n'existe, créer les données par défaut
    if (!openingHours) {
      const defaultHours = {
        hours: [
          {
            day: { fr: "Lundi", ar: "الاثنين" },
            hours: { fr: "08:00 - 18:00", ar: "08:00 - 18:00" },
            isClosed: false,
            order: 1
          },
          {
            day: { fr: "Mardi", ar: "الثلاثاء" },
            hours: { fr: "08:00 - 18:00", ar: "08:00 - 18:00" },
            isClosed: false,
            order: 2
          },
          {
            day: { fr: "Mercredi", ar: "الأربعاء" },
            hours: { fr: "08:00 - 18:00", ar: "08:00 - 18:00" },
            isClosed: false,
            order: 3
          },
          {
            day: { fr: "Jeudi", ar: "الخميس" },
            hours: { fr: "08:00 - 18:00", ar: "08:00 - 18:00" },
            isClosed: false,
            order: 4
          },
          {
            day: { fr: "Vendredi", ar: "الجمعة" },
            hours: { fr: "08:00 - 18:00", ar: "08:00 - 18:00" },
            isClosed: false,
            order: 5
          },
          {
            day: { fr: "Samedi", ar: "السبت" },
            hours: { fr: "09:00 - 16:00", ar: "09:00 - 16:00" },
            isClosed: false,
            order: 6
          },
          {
            day: { fr: "Dimanche", ar: "الأحد" },
            hours: { fr: "Fermé", ar: "مغلق" },
            isClosed: true,
            order: 7
          }
        ],
        note: {
          fr: "Nous sommes également disponibles sur rendez-vous en dehors de ces horaires.",
          ar: "نحن متاحون أيضًا بموعد خارج هذه الساعات."
        },
        singleton: "opening_hours"
      }

      openingHours = await OpeningHours.create(defaultHours)
    }

    return NextResponse.json(
      { success: true, data: openingHours },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des horaires:", error)
    const errorMessage =
      error instanceof Error
        ? `Impossible de récupérer les horaires d'ouverture : ${error.message}`
        : "Une erreur inconnue s'est produite lors de la récupération des horaires d'ouverture"
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour les horaires d'ouverture (un seul document)
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = (await request.json()) as OpeningHoursData

    // Validation des données
    if (!body.hours || !Array.isArray(body.hours)) {
      return NextResponse.json(
        {
          success: false,
          message: "Les horaires sont requis. Veuillez fournir un tableau d'horaires valide."
        },
        { status: 400 }
      )
    }

    if (body.hours.length !== 7) {
      return NextResponse.json(
        {
          success: false,
          message: `Le nombre de jours est incorrect. Vous devez fournir exactement 7 jours (actuellement ${body.hours.length}).`
        },
        { status: 400 }
      )
    }

    // Validation que chaque jour a les champs requis
    for (let i = 0; i < body.hours.length; i++) {
      const day = body.hours[i]
      if (!day.day || !day.day.fr || !day.day.ar) {
        return NextResponse.json(
          {
            success: false,
            message: `Le jour ${i + 1} est incomplet. Veuillez fournir le nom du jour en français et en arabe.`
          },
          { status: 400 }
        )
      }
      if (typeof day.isClosed !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: `Le statut "fermé" du jour ${i + 1} est invalide. Il doit être un booléen (true ou false).`
          },
          { status: 400 }
        )
      }
      if (typeof day.order !== "number" || day.order < 1 || day.order > 7) {
        return NextResponse.json(
          {
            success: false,
            message: `L'ordre du jour ${i + 1} est invalide. Il doit être un nombre entre 1 et 7.`
          },
          { status: 400 }
        )
      }
      // Si le jour n'est pas fermé, les horaires doivent être remplis et valides
      if (!day.isClosed) {
        if (!day.hours || !day.hours.fr || !day.hours.fr.trim()) {
          return NextResponse.json(
            {
              success: false,
              message: `Le jour ${i + 1} (${day.day.fr}) n'est pas fermé mais les horaires en français sont vides. Veuillez sélectionner les heures de début et de fin ou cocher "Fermé ce jour".`
            },
            { status: 400 }
          )
        }
        if (!day.hours || !day.hours.ar || !day.hours.ar.trim()) {
          return NextResponse.json(
            {
              success: false,
              message: `Le jour ${i + 1} (${day.day.fr}) n'est pas fermé mais les horaires en arabe sont vides. Veuillez sélectionner les heures de début et de fin ou cocher "Fermé ce jour".`
            },
            { status: 400 }
          )
        }
        // Vérifier que les horaires contiennent bien un format valide (ex: "08:00 - 18:00")
        const hoursPattern = /^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/
        if (!hoursPattern.test(day.hours.fr.trim())) {
          return NextResponse.json(
            {
              success: false,
              message: `Le jour ${i + 1} (${day.day.fr}) a un format d'horaires invalide en français. Format attendu : "08:00 - 18:00".`
            },
            { status: 400 }
          )
        }
        if (!hoursPattern.test(day.hours.ar.trim())) {
          return NextResponse.json(
            {
              success: false,
              message: `Le jour ${i + 1} (${day.day.fr}) a un format d'horaires invalide en arabe. Format attendu : "08:00 - 18:00".`
            },
            { status: 400 }
          )
        }
      } else {
        // Si le jour est fermé, on s'assure que les horaires sont vides
        day.hours = { fr: "", ar: "" }
      }
    }

    // Préparer les données avec les horaires vides pour les jours fermés
    const preparedHours = body.hours.map((day) => ({
      ...day,
      hours: day.isClosed ? { fr: "", ar: "" } : day.hours
    }))

    // Mettre à jour ou créer le document unique
    // On désactive runValidators car on fait la validation manuellement
    const openingHours = await OpeningHours.findOneAndUpdate(
      { singleton: "opening_hours" },
      {
        hours: preparedHours,
        note: body.note || {
          fr: "Nous sommes également disponibles sur rendez-vous en dehors de ces horaires.",
          ar: "نحن متاحون أيضًا بموعد خارج هذه الساعات."
        }
      },
      {
        new: true, // Retourner le document mis à jour
        upsert: true, // Créer si n'existe pas
        runValidators: false // Désactiver les validations Mongoose car on valide manuellement
      }
    )

    return NextResponse.json(
      {
        success: true,
        message: "Horaires d'ouverture mis à jour avec succès",
        data: openingHours
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour des horaires:", error)

    if (isValidationError(error)) {
      const validationErrors = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ")
      return NextResponse.json(
        {
          success: false,
          message: `Erreur de validation des données : ${validationErrors}`,
          errors: Object.values(error.errors).map((e) => e.message)
        },
        { status: 400 }
      )
    }

    const errorMessage =
      error instanceof Error
        ? `Impossible de mettre à jour les horaires d'ouverture : ${error.message}`
        : "Une erreur inconnue s'est produite lors de la mise à jour des horaires d'ouverture"
    return NextResponse.json(
      {
        success: false,
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

