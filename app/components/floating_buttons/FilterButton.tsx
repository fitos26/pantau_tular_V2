"use client"

import { useState } from "react"
import type { ButtonHTMLAttributes } from "react"

// Simple utility function to combine class names
const combineClasses = (...classes: (string | undefined)[]): string => {
  return classes.filter(Boolean).join(' ')
}

interface FilterButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
  variant?: "default" | "outline"
  size?: "sm" | "md" | "lg"
  className?: string
  isActive?: boolean
}

export default function FilterButton({
  onClick,
  className = "",
  variant = "default",
  size = "md",
  disabled,
  isActive: externalIsActive,
  ...props
}: Readonly<FilterButtonProps>) {
  const [internalIsActive, setInternalIsActive] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const isActive = externalIsActive !== undefined ? externalIsActive : internalIsActive

  // Size mappings with fixed width and height
  const sizeClasses = {
    sm: "h-8 px-3 py-1 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-5 py-2.5 text-base",
  }

  // Icon size based on button size
  const iconSize = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-8 w-8",
  }

  // Icon wrapper background colors
  const iconWrapperClasses = {
    default: isActive ? "bg-[#0066cc]" : "bg-[#333333]",
    outline: isActive ? "bg-[#0066cc]" : "bg-[#333333]"
  }

  // Variant styles for the button
  const variantClasses = {
    default: isActive ? "bg-[#0066cc] text-white" : "bg-white text-black",
    outline: isActive
      ? "border-2 border-[#0066cc] bg-[#0066cc] text-white"
      : "border-2 border-[#333333] bg-white text-black",
  }

  const handleClick = () => {
    if (externalIsActive === undefined) {
      setInternalIsActive(!internalIsActive)
    }
    if (onClick) onClick()
  }

  return (
    <button
      className={combineClasses(
        "flex items-center gap-2 rounded-full transition-colors",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      onClick={handleClick}
      disabled={disabled}
      aria-label={isActive ? "Close filters" : "Open filters"}
      {...props}
    >
      <div className={combineClasses("flex items-center justify-center rounded-full", iconSize[size], iconWrapperClasses[variant])}>
        {isActive ? (
          <svg width="100%" height="100%" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M28 14C28 17.713 26.525 21.274 23.8995 23.8995C21.274 26.525 17.713 28 14 28C10.287 28 6.72601 26.525 4.10051 23.8995C1.475 21.274 0 17.713 0 14C0 10.287 1.475 6.72601 4.10051 4.10051C6.72601 1.475 10.287 0 14 0C17.713 0 21.274 1.475 23.8995 4.10051C26.525 6.72601 28 10.287 28 14ZM9.3695 8.1305C9.2052 7.9662 8.98236 7.87389 8.75 7.87389C8.51764 7.87389 8.2948 7.9662 8.1305 8.1305C7.9662 8.2948 7.87389 8.51764 7.87389 8.75C7.87389 8.98236 7.9662 9.2052 8.1305 9.3695L12.7628 14L8.1305 18.6305C8.04915 18.7119 7.98461 18.8084 7.94058 18.9147C7.89656 19.021 7.87389 19.1349 7.87389 19.25C7.87389 19.3651 7.89656 19.479 7.94058 19.5853C7.98461 19.6916 8.04915 19.7881 8.1305 19.8695C8.2948 20.0338 8.51764 20.1261 8.75 20.1261C8.86505 20.1261 8.97898 20.1034 9.08527 20.0594C9.19157 20.0154 9.28815 19.9509 9.3695 19.8695L14 15.2372L18.6305 19.8695C18.7119 19.9509 18.8084 20.0154 18.9147 20.0594C19.021 20.1034 19.1349 20.1261 19.25 20.1261C19.3651 20.1261 19.479 20.1034 19.5853 20.0594C19.6916 20.0154 19.7881 19.9509 19.8695 19.8695C19.9509 19.7881 20.0154 19.6916 20.0594 19.5853C20.1034 19.479 20.1261 19.3651 20.1261 19.25C20.1261 19.1349 20.1034 19.021 20.0594 18.9147C20.0154 18.8084 19.9509 18.7119 19.8695 18.6305L15.2372 14L19.8695 9.3695C19.9509 9.28815 20.0154 9.19157 20.0594 9.08527C20.1034 8.97898 20.1261 8.86505 20.1261 8.75C20.1261 8.63495 20.1034 8.52102 20.0594 8.41473C20.0154 8.30843 19.9509 8.21185 19.8695 8.1305C19.7881 8.04915 19.6916 7.98461 19.5853 7.94058C19.479 7.89656 19.3651 7.87389 19.25 7.87389C19.1349 7.87389 19.021 7.89656 18.9147 7.94058C18.8084 7.98461 18.7119 8.04915 18.6305 8.1305L14 12.7628L9.3695 8.1305Z"
              fill="white"
            />
          </svg>
        ) : (
          <svg width="100%" height="100%" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10H21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 14H19" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 18H17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <span className="font-medium">Filter</span>
    </button>
  )
}