"use client"

import { useState, useEffect, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  FaEnvelope, 
  FaPhone, 
  FaArrowRight, 
  FaSpinner, 
  FaLock, 
  FaUserCircle,
  FaCheckCircle
} from "react-icons/fa"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import attendeeLoginService from "../../../Services/attendeeLoginServices"
import { AuthContext } from "../../../Contexts/authContext"

const AttendeeLogin = () => {
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [step, setStep] = useState(1) // 1 = enter identifier, 2 = enter OTP
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState("email") // 'email' or 'phone'
  const [countdown, setCountdown] = useState(0)
  const [otpSent, setOtpSent] = useState(false)
  const navigate = useNavigate()
  const { attendeeUser, checkAuth } = useContext(AuthContext)
  
  console.log(attendeeUser)

  useEffect(() => {
    if (attendeeUser?.role === "Attendee") {
      navigate('/events')
    }
  }, [attendeeUser, navigate])

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const startCountdown = () => {
    setCountdown(60) // 60 seconds countdown
    setOtpSent(true)
  }

  const handleSendOtp = async () => {
    if (!identifier) {
      toast.error(`Please enter your ${loginMethod === "email" ? "email" : "phone number"}`)
      return
    }

    // Simple validation
    if (loginMethod === "email" && !identifier.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    if (loginMethod === "phone" && !/^\+?\d{10,15}$/.test(identifier.replace(/\s/g, ''))) {
      toast.error("Please enter a valid phone number")
      return
    }

    setIsLoading(true)
    try {
      // Determine if identifier is email or phone
      const isEmail = identifier.includes("@")
      
      if (isEmail) {
        await attendeeLoginService.sendEmailVerification(identifier)
      } else {
        await attendeeLoginService.sendPhoneVerification(identifier)
      }
      
      setLoginMethod(isEmail ? "email" : "phone")
      setStep(2)
      startCountdown()
      toast.success(`OTP sent to your ${isEmail ? "email" : "phone"}`, {
        icon: <FaCheckCircle className="text-green-500" />
      })
    } catch (error) {
      toast.error(error.message || "Failed to send OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    
    setIsLoading(true)
    try {
      const isEmail = identifier.includes("@")
      
      if (isEmail) {
        await attendeeLoginService.sendEmailVerification(identifier)
      } else {
        await attendeeLoginService.sendPhoneVerification(identifier)
      }
      
      startCountdown()
      toast.success(`OTP resent to your ${isEmail ? "email" : "phone"}`, {
        icon: <FaCheckCircle className="text-green-500" />
      })
    } catch (error) {
      toast.error(error.message || "Failed to resend OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value === "" || /^[0-9]$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      
      // Auto-focus next input
      if (value !== "" && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        if (nextInput) nextInput.focus()
      }
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace to move to previous input
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim()
    
    if (/^\d+$/.test(pastedData) && pastedData.length <= 6) {
      const digits = pastedData.split("")
      const newOtp = [...otp]
      
      digits.forEach((digit, index) => {
        if (index < 6) newOtp[index] = digit
      })
      
      setOtp(newOtp)
      
      // Focus the next empty input or the last one
      const lastFilledIndex = Math.min(digits.length - 1, 5)
      const nextEmptyIndex = newOtp.findIndex((digit, index) => digit === "" && index > lastFilledIndex)
      
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : lastFilledIndex
      const nextInput = document.getElementById(`otp-${focusIndex}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("")
    
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP")
      return
    }

    setIsLoading(true)
    try {
      await attendeeLoginService.verifyAttendeeOtp({
        identifier,
        Otpcode: otpCode
      })
      
      toast.success("Login successful!", {
        icon: <FaCheckCircle className="text-green-500" />
      })
      
      // Refresh auth context
      await checkAuth()
            
      // Redirect to events page after login
      navigate("/attendee/")
    } catch (error) {
      toast.error(error.message || "Invalid OTP")
    } finally {
      setIsLoading(false)

    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center">
            <FaUserCircle className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 
            ? "Sign in to access your events and tickets" 
            : `Enter the verification code sent to your ${loginMethod}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-100">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                  {loginMethod === "email" ? "Email address" : "Phone number"}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loginMethod === "email" ? (
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    id="identifier"
                    name="identifier"
                    type={loginMethod === "email" ? "email" : "tel"}
                    autoComplete={loginMethod === "email" ? "email" : "tel"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="py-3 pl-10 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                    placeholder={loginMethod === "email" ? "email@example.com" : "+1234567890"}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => setLoginMethod("email")}
                  className={`flex-1 px-4 py-3 border rounded-md text-sm font-medium transition-all ${
                    loginMethod === "email"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FaEnvelope className="inline-block mr-2" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod("phone")}
                  className={`flex-1 px-4 py-3 border rounded-md text-sm font-medium transition-all ${
                    loginMethod === "phone"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FaPhone className="inline-block mr-2" />
                  Phone
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      Continue with OTP <FaArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Don't have an account?
                    </span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link
                    to="/signup"
                    className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create an account
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <FaLock className="h-5 w-5 text-indigo-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-700 mb-1">
                      We sent a 6-digit verification code to:
                    </p>
                    <p className="font-medium text-gray-900 break-all">
                      {identifier}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-3">
                  Enter verification code
                </label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-12 text-center text-xl font-semibold border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              {otpSent && (
                <div className="text-center text-sm">
                  {countdown > 0 ? (
                    <p className="text-gray-600">
                      Resend code in <span className="font-medium">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Resend verification code
                    </button>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setOtp(["", "", "", "", "", ""])
                    setOtpSent(false)
                  }}
                  className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.join("").length !== 6}
                  className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin h-5 w-5" />
                  ) : (
                    "Verify & Sign In"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Return to home page
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AttendeeLogin
