"use client"

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useLocale } from "next-intl"

interface Product {
  _id: string
  name: {
    fr: string
    ar: string
  }
  inStock: boolean
  quantity: number
}

interface PackItem {
  productId: string
  quantity: number
  product?: Product
}

interface Pack {
  items: PackItem[]
}

interface PackAvailabilityAlertProps {
  pack: Pack
}

export function PackAvailabilityAlert({ pack }: PackAvailabilityAlertProps) {
  // Vérifier la disponibilité de chaque produit
  const locale = useLocale() as "fr" | "ar"
  const unavailableProducts = pack.items
    .filter((item) => {
      if (!item.product) return true
      return !item.product.inStock || item.product.quantity < item.quantity
    })
    .map((item) => ({
      name: item.product?.name[locale] || `Produit ${item.productId}`,
      requiredQty: item.quantity,
      availableQty: item.product?.quantity || 0,
      inStock: item.product?.inStock || false
    }))

  const allAvailable = unavailableProducts.length === 0
  const someUnavailable = unavailableProducts.length > 0

  if (allAvailable) {
    return (
      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">
              Tous les produits sont disponibles
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Ce pack peut être commandé immédiatement
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (someUnavailable) {
    const allOutOfStock = unavailableProducts.every((p) => !p.inStock)

    return (
      <div
        className={`rounded-xl border-2 p-4 ${
          allOutOfStock
            ? "border-red-200 bg-red-50"
            : "border-yellow-200 bg-yellow-50"
        }`}
      >
        <div className="flex items-start gap-3">
          {allOutOfStock ? (
            <XCircle className="h-6 w-6 flex-shrink-0 text-red-600 mt-0.5" />
          ) : (
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-yellow-600 mt-0.5" />
          )}
          <div className="flex-1">
            <h3
              className={`font-semibold ${
                allOutOfStock ? "text-red-900" : "text-yellow-900"
              }`}
            >
              {allOutOfStock
                ? "Pack actuellement indisponible"
                : "Disponibilité limitée"}
            </h3>
            <p
              className={`text-sm mt-1 ${
                allOutOfStock ? "text-red-700" : "text-yellow-700"
              }`}
            >
              Certains produits de ce pack ne sont pas disponibles en quantité
              suffisante :
            </p>

            <ul className="mt-3 space-y-2">
              {unavailableProducts.map((product, index) => (
                <li
                  key={index}
                  className={`text-sm ${
                    allOutOfStock ? "text-red-800" : "text-yellow-800"
                  }`}
                >
                  <span className="font-medium">• {product.name}</span>
                  {!product.inStock ? (
                    <span className="ml-2 text-xs">(Rupture de stock)</span>
                  ) : (
                    <span className="ml-2 text-xs">
                      (Requis: {product.requiredQty}, Disponible:{" "}
                      {product.availableQty})
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {!allOutOfStock && (
              <p
                className={`text-sm mt-3 ${
                  allOutOfStock ? "text-red-700" : "text-yellow-700"
                }`}
              >
                Vous pouvez toujours ajouter ce pack au panier, mais la
                livraison pourrait être retardée.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
