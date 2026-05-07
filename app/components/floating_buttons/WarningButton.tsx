import type React from "react"
import { useState } from "react"
import { AlertTriangle } from "lucide-react"

interface WarningButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg"
  variant?: "filled" | "outline"
  label?: string
}

export default function WarningButton({
  size = "md",
  variant = "filled",
  label,
  className = "",
  ...props
}: Readonly<WarningButtonProps>) {
  const [isHovered, setIsHovered] = useState(false)

  // Size mappings
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  }

  // Variant styles
  const variantClasses = {
    filled: "bg-red-500 text-white hover:bg-red-600",
    outline: "bg-white text-red-500 border-2 border-red-500 hover:bg-red-50",
  }

  // Icon size based on button size
  let iconSize: string
  switch (size) {
    case "sm":
      iconSize = "w-4 h-4"
      break
    case "md":
      iconSize = "w-6 h-6"
      break
    case "lg":
      iconSize = "w-8 h-8"
      break
  }

  return (
    <div className="relative">
      {/* Dark overlay when warning is shown */}
      {isHovered && (
        <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity duration-300 z-10"></div>
      )}

      {/* Warning Button */}
      <button
        type="button"
        className={`relative rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-default ${sizeClasses[size]} ${variantClasses[variant]} ${className} z-20`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={label ?? "Warning"}
        {...props}
      >
        <div className="relative flex items-center justify-center">
          <AlertTriangle className={iconSize} />
        </div>
      </button>

      {/* Warning Message Box */}
      {isHovered && (
        <div className="absolute left-0 mt-2 bg-white shadow-lg rounded-md p-3 w-64 z-30 animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <span className="font-semibold text-red-600">Waspada!</span>
          </div>
          <p className="text-sm text-gray-700 mt-1">Terdapat kasus penyakit menular di sekitarmu.</p>
        </div>
      )}
    </div>
  )
}