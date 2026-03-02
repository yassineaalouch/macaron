'use client';

import React, { useState, useEffect } from 'react';
import { Navigation, MapPin } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useToast } from "@/components/ui/Toast";

interface SiteInfo {
  location: {
    fr: string
    ar: string
  }
}

const LocationSection: React.FC = () => {
  const locale = useLocale()
  const { showToast } = useToast()
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)

  useEffect(() => {
    fetchSiteInfo()
  }, [])

  const fetchSiteInfo = async () => {
    try {
      const response = await fetch("/api/site-info")
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération")
      }
      const data = await response.json()
      if (data.success) {
        setSiteInfo(data.siteInfo)
      } else {
        showToast(data.message || "Erreur lors du chargement", "error")
      }
    } catch (error) {
      showToast("Erreur lors du chargement des informations de localisation", "error")
    }
  }

  const handleOpenMap = () => {
    const address = siteInfo?.location?.[locale as "fr" | "ar"] || "Zone Industrielle Sidi Bernoussi, Rue des Entrepreneurs, Lot 45, 20150 Casablanca, Maroc";
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(googleMapsUrl, '_blank');
  };

  const locationText = siteInfo?.location?.[locale as "fr" | "ar"] || "Zone Industrielle Sidi Bernoussi, Rue des Entrepreneurs, Lot 45, 20150 Casablanca, Maroc"

  return (
    <div className="bg-secondColor/30 shadow-lg overflow-hidden border border-firstColor/20">
      <div className="p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-red-500 text-white flex items-center justify-center">
            <Navigation size={40} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Notre Localisation</h3>
        <div className="text-center space-y-3">
          <p className="text-gray-600">
            <strong>Sweet Macarons</strong>
          </p>
          <p className="text-gray-600 whitespace-pre-line">
            {locationText}
          </p>
          <div className="pt-4">
            <button 
              onClick={handleOpenMap}
              className="bg-red-500 text-white px-6 py-3 hover:bg-red-600 transition-colors duration-300 flex items-center mx-auto"
            >
              <Navigation size={20} className="mr-2" />
              Voir sur Google Maps
            </button>
          </div>
        </div>
      </div>
      
      {/* Carte fictive */}
      <div className="h-64 bg-gray-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 opacity-80"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-paletteCream p-4 shadow-lg text-center">
            <MapPin className="text-red-500 mx-auto mb-2" size={32} />
            <p className="text-sm font-semibold text-gray-800">Sweet Macaron</p>
            <p className="text-xs text-gray-600">Casablanca</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSection;
