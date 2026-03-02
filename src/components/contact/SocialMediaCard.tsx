"use client"

import React, { useEffect, useState } from "react"
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  ExternalLink,
  Heart,
  LucideIcon
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "@/i18n/navigation"

interface SocialLink {
  id: string
  url: string
  icon: string
  className: string
  name: string
  isActive: boolean
  order: number
}

const iconMap: Record<string, LucideIcon> = {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  ExternalLink
}

const SocialMediaCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [socialMediaLinks, setSocialMediaLinks] = useState<SocialLink[]>([])

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const response = await fetch("/api/hero-content", {
          cache: "no-store"
        })
        
        if (!response.ok) {
          console.error("Erreur HTTP:", response.status)
          return
        }
        
        const result = await response.json()
        if (result.success && result.data?.socialLinks) {
          // Filtrer et trier
          const activeLinks = result.data.socialLinks
            .filter((link: SocialLink) => link.isActive)
            .sort((a: SocialLink, b: SocialLink) => a.order - b.order)
          
          setSocialMediaLinks(activeLinks)
        } else {
          console.warn("Aucun lien social trouvé ou données invalides:", result)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des réseaux sociaux:", error)
      }
    }

    fetchHeroContent()
  }, [])

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <div className="fixed top-1/3 left-4 z-50">
      {/* Heart button */}
      <motion.button
        onClick={toggleMenu}
        className="relative flex items-center justify-center w-10 h-10 bg-red-500 shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: isOpen
            ? "0 0 0 0 rgba(239, 68, 68, 0.7), 0 0 0 10px rgba(239, 68, 68, 0)"
            : "0 0 0 0 rgba(239, 68, 68, 0.7)"
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          animate={{
            scale: isOpen ? [1, 1.2, 1] : 1
          }}
          transition={{ duration: 0.7, repeat: isOpen ? Infinity : 0 }}
        >
          <Heart className="text-white" size={20} fill="white" />
        </motion.div>
      </motion.button>

      {/* Animated menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8, rotateX: -90 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.8, rotateX: -90 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="absolute top-16 left-0 bg-white/95 backdrop-blur-md  shadow-2xl border border-white/20 p-3 min-w-[180px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50"></div>

            <div className="relative z-10">
              {socialMediaLinks.length > 0 ? (
                socialMediaLinks.map((social, index) => {
                  const IconComponent = iconMap[social.icon] || ExternalLink
                  if (!iconMap[social.icon]) {
                    console.warn(`Icône non trouvée pour: ${social.icon}, utilisation de ExternalLink par défaut`)
                  }
                  return (
                    <motion.div
                      key={social.id || index}
                      initial={{ opacity: 0, x: -30, rotateY: -90 }}
                      animate={{ opacity: 1, x: 0, rotateY: 0 }}
                      transition={{
                        delay: index * 0.1,
                        duration: 0.4,
                        ease: "easeOut"
                      }}
                    >
                      <Link
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition-all duration-300 group backdrop-blur-sm"
                      >
                        <motion.div
                          whileHover={{
                            scale: 1.2,
                            rotate: 5,
                            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <IconComponent
                            size={20}
                            className={`${social.className} transition-all duration-300`}
                          />
                        </motion.div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                          {social.name}
                        </span>
                      </Link>
                    </motion.div>
                  )
                })
              ) : (
                <p className="text-gray-500 text-sm text-center px-4 py-3">
                  Aucun réseau social disponible
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay click to close */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default SocialMediaCard
