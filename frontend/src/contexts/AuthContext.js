"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Set up axios interceptor for auth token
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }

    // Response interceptor to handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout()
          toast.error("Session expired. Please login again.")
        }
        return Promise.reject(error)
      },
    )

    return () => {
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const response = await axios.get("/auth/me")
          setUser(response.data.user)
        } catch (error) {
          localStorage.removeItem("token")
          delete axios.defaults.headers.common["Authorization"]
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post("/auth/login", { email, password })
      const { user, token } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      toast.success("Login successful!")
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || "Login failed"
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (email, password, role = "user") => {
    try {
      const response = await axios.post("/auth/register", { email, password, role })
      const { user, token } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      toast.success("Registration successful!")
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || "Registration failed"
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
    toast.success("Logged out successfully")
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
