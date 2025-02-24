"use client"

import { useState, useEffect } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import axios from "axios"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { serverURL } from "@/utils/utils"
import { CheckCircle, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"

export default function StaffLogin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      setIsLoggedIn(true)
      router.push("/staff/dashboard")
    }
  }, [router])

  const login = async () => {
    try {
      const response = await axios.post(`${serverURL}/users/staff-login`, {
        email,
        password,
      })
      toast.success("Logged In!")
      localStorage.setItem("token", response.data.token)
      setIsLoggedIn(true)
      router.push("/staff/dashboard")
    } catch (error) {
      console.error(error)
      toast.error("Email or Password is incorrect")
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem("token")
    toast.success("Logged out successfully!")
    router.push("/staff")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md">
        <Card className="border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5 rounded-lg shadow-lg">
          <div className="bg-black rounded-lg">
            <CardHeader className="text-center space-y-2 p-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">
                CheckTurnitin
              </h1>
            </CardHeader>
            <CardContent className="space-y-6 text-white p-6">
              {isLoggedIn ? (
                <div className="text-center space-y-4">
                  <p className="text-xl font-semibold">Welcome to the Staff Panel!</p>
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center space-x-2 py-3 rounded-md shadow-md transition-all duration-200"
                  >
                    <Lock size={20} />
                    <span>Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">
                    Staff Login
                  </h2>
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <Input
                        className="w-full pl-10 bg-gray-900 text-white placeholder-gray-400 border-gray-800 focus:ring-2 focus:ring-indigo-500 rounded-md"
                        placeholder="Enter your email"
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                      />
                    </div>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <Input
                        className="w-full pl-10 bg-gray-900 text-white placeholder-gray-400 border-gray-800 focus:ring-2 focus:ring-indigo-500 rounded-md"
                        placeholder="Password"
                        type="password"
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={login}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center space-x-2 py-3 rounded-md shadow-md transition-all duration-200"
                  >
                    <CheckCircle size={20} />
                    <span>Login</span>
                  </Button>
                  <div className="text-right">
                    <Link
                      href="/forgotpassword"
                      className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors duration-200"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-black rounded-b-lg p-6">
              <p className="text-center text-sm text-gray-400 w-full">
                © 2023 CheckTurnitin. All rights reserved.
              </p>
            </CardFooter>
          </div>
        </Card>
      </div>
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  )
}