"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"
import { useMapStore } from "../../../store/store"

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
}

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
}

interface HeatmapButtonProps {
  onClick?: () => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export default function HeatmapButton({
  onClick,
  className = "",
  size = "md",
}: Readonly<HeatmapButtonProps>) {
  const { mapService, activeButton, setActiveButton } = useMapStore()
  const isActive = activeButton === "heatmap"
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    const nextActive = !isActive
    setActiveButton(nextActive ? "heatmap" : null)
    onClick?.()
  }

  useEffect(() => {
    if (mapService) {
      if (isActive) mapService.showCaseHeatmapLayer()
      if (activeButton == null) mapService.hideAllLayers()
    }
  }, [activeButton, isActive, mapService])

  return (
    <div className="relative">
      <button
        type="button"
        className={`relative flex items-center justify-center rounded-full transition-colors duration-300 ${
          isActive ? "bg-rose-600 text-white" : "bg-white text-rose-600 border border-gray-200"
        } ${sizeClasses[size]} ${className}`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-pressed={isActive}
        aria-label="Toggle case heatmap view"
      >
        <Activity size={iconSizes[size]} />
      </button>
      {isHovered && (
        <div className="absolute right-0 mt-2 bg-black text-white text-xs rounded py-1 px-2 z-30 whitespace-nowrap">
          Peta Sebaran: Heatmap
        </div>
      )}
    </div>
  )
}
