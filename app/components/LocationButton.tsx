"use client"

import { MapPin } from "lucide-react"
import type { ButtonHTMLAttributes } from "react"

interface LocationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export default function LocationButton({
  onClick,
  className = "",
  variant = "default",
  size = "md",
  disabled,
  ...props
}: Readonly<LocationButtonProps>) {
  const sizeClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3",
  }

  const variantClasses = {
    default: "bg-white hover:bg-gray-100 text-black shadow-sm",
    outline: "border border-gray-300 hover:bg-gray-50 text-black",
    ghost: "hover:bg-gray-100 text-black",
  }

  const iconSize = {
    sm: 16,
    md: 24,
    lg: 32,
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      disabled={disabled}
      {...props}
    >
    <MapPin size={iconSize[size]}
      className="text-primary"
    />
    </button>
  )
}