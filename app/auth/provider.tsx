"use client"

import { useEffect, useMemo, useState } from "react"
import { AuthContext } from "./context"
import dynamic from "next/dynamic"
const ToastCenter = dynamic(() => import("../components/ToastCenter"), { ssr: false });
import { JWTStrategy } from "./strategies/jwt"
import { LoginRequestBody, User } from "../../types"

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const strategy = useMemo(() => new JWTStrategy(), [])

  useEffect(() => {
    strategy.getUser().then(setUser)
  }, [strategy])

  const login = async (credentials: LoginRequestBody) => {
    const res = await strategy.login(credentials)
    const userData:User = await strategy.getUser()
    setUser(userData)
    return res
  }
  
  const logout = async () => {
    await strategy.logout()
    setUser(null)
  }

  const getAccessToken = async () => {
    if (typeof strategy.getAccessToken === "function") {
      return strategy.getAccessToken()
    }
    return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  }

  const value = useMemo(() => ({
    login,
    logout,
    getAccessToken,
    user,
    strategy
  }), [user])

  return (
    <AuthContext.Provider value={value}>
      {/** Curator feature toast center (client-only) */}
      <ToastCenter />
      {children}
    </AuthContext.Provider>
  )
}
