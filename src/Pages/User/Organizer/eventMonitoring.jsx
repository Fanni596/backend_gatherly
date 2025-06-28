"use client"

import { useMemo } from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaPlay,
  FaPause,
  FaStop,
  FaUsers,
  FaUserCheck,
  FaEnvelope,
  FaSms,
  FaSearch,
  FaSync,
  FaClock,
  FaCalendarAlt,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaSpinner,
  FaTimes,
  FaExclamationTriangle,
  FaPlayCircle,
  FaPauseCircle,
  FaStopCircle,
  FaUserCog,
  FaCamera,
  FaSort,
  FaUserFriends,
  FaFingerprint,
  FaPlus,
  FaMinus,
  FaCheckCircle,
} from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import eventMonitoringService from "../../../Services/eventMonitoringServices"

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const slideInRight = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Enhanced Loading Component
const EnhancedLoader = ({ message = "Loading event monitoring...", progress = null }) => {
  const [dots, setDots] = useState("")

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 z-50"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="relative mx-auto mb-8"
        >
          <div className="h-20 w-20 rounded-full border-4 border-indigo-200"></div>
          <div className="absolute inset-0 h-20 w-20 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
          <div className="absolute inset-2 h-16 w-16 rounded-full border-r-4 border-purple-400 animate-spin animation-delay-150"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-gray-800">
            {message}
            {dots}
          </h3>

          {progress !== null && (
            <div className="w-64 mx-auto">
              <div className="bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{progress}% Complete</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

// Enhanced Status Indicator
const StatusIndicator = ({ status, size = "md", showLabel = true, animated = true }) => {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
    xl: "h-5 w-5",
  }

  const statusConfig = {
    not_checked_in: {
      color: "bg-gray-400",
      pulse: false,
      label: "Not Checked In",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
    },
    partially_checked_in: {
      color: "bg-yellow-500",
      pulse: true,
      label: "Partially Checked In",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
    },
    checked_in: {
      color: "bg-green-500",
      pulse: true,
      label: "Fully Checked In",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    }
  }
  const config = statusConfig[status] || statusConfig.not_checked_in

  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.8 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : false}
      className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}
    >
      <motion.div
        animate={config.pulse && animated ? { scale: [1, 1.2, 1] } : {}}
        transition={config.pulse ? { duration: 2, repeat: Number.POSITIVE_INFINITY } : {}}
        className={`${sizeClasses[size]} ${config.color} rounded-full`}
      />
      {showLabel && <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>}
    </motion.div>
  )
}

// Enhanced People Counter Component
const PeopleCounter = ({
  current,
  max,
  onChange,
  disabled = false,
  label = "Number of People",
  error = null,
  showProgress = true,
}) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleIncrement = useCallback(() => {
    if (current < max && !disabled) {
      setIsAnimating(true)
      onChange(current + 1)
      setTimeout(() => setIsAnimating(false), 200)
    }
  }, [current, max, disabled, onChange])

  const handleDecrement = useCallback(() => {
    if (current > 1 && !disabled) {
      setIsAnimating(true)
      onChange(current - 1)
      setTimeout(() => setIsAnimating(false), 200)
    }
  }, [current, disabled, onChange])

  const handleInputChange = useCallback(
    (e) => {
      const value = Number.parseInt(e.target.value) || 1
      if (value >= 1 && value <= max && !disabled) {
        onChange(value)
      }
    },
    [max, disabled, onChange],
  )

  const progressPercentage = (current / max) * 100

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>

      <div className="flex items-center justify-center space-x-4">
        <motion.button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || current <= 1}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 border-2 border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-all duration-200"
        >
          <FaMinus className="h-4 w-4 text-gray-600" />
        </motion.button>

        <div className="flex-1 text-center space-y-2">
          <motion.input
            type="number"
            min="1"
            max={max}
            value={current}
            onChange={handleInputChange}
            disabled={disabled}
            animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
            className="w-24 px-4 py-3 text-2xl font-bold text-center border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100 transition-all duration-200"
          />
          <p className="text-xs text-gray-500 font-medium">Max: {max}</p>
        </div>

        <motion.button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || current >= max}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 border-2 border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-all duration-200"
        >
          <FaPlus className="h-4 w-4 text-gray-600" />
        </motion.button>
      </div>

      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>
              {current} of {max} people
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            />
          </div>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 text-red-600 text-sm"
        >
          <FaExclamationTriangle className="h-4 w-4" />
          <span>{error}</span>
        </motion.div>
      )}
    </motion.div>
  )
}

// Enhanced Statistics Card Component
const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = "indigo",
  loading = false,
  onClick,
  subtitle = null,
  animated = true,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const colorClasses = {
    indigo: {
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      text: "text-indigo-600",
      border: "border-indigo-200",
      hover: "hover:from-indigo-100 hover:to-indigo-200",
      icon: "bg-indigo-500 text-white",
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-green-100",
      text: "text-green-600",
      border: "border-green-200",
      hover: "hover:from-green-100 hover:to-green-200",
      icon: "bg-green-500 text-white",
    },
    yellow: {
      bg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
      text: "text-yellow-600",
      border: "border-yellow-200",
      hover: "hover:from-yellow-100 hover:to-yellow-200",
      icon: "bg-yellow-500 text-white",
    },
    red: {
      bg: "bg-gradient-to-br from-red-50 to-red-100",
      text: "text-red-600",
      border: "border-red-200",
      hover: "hover:from-red-100 hover:to-red-200",
      icon: "bg-red-500 text-white",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      text: "text-purple-600",
      border: "border-purple-200",
      hover: "hover:from-purple-100 hover:to-purple-200",
      icon: "bg-purple-500 text-white",
    },
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      text: "text-blue-600",
      border: "border-blue-200",
      hover: "hover:from-blue-100 hover:to-blue-200",
      icon: "bg-blue-500 text-white",
    },
  }

  const colors = colorClasses[color]

  return (
    <motion.div
      variants={animated ? fadeInUp : {}}
      initial={animated ? "initial" : false}
      animate={animated ? "animate" : false}
      whileHover={{ y: -5, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative p-6 rounded-2xl border-2 ${colors.bg} ${colors.border} ${colors.hover} transition-all duration-300 ${onClick ? "cursor-pointer" : ""} overflow-hidden`}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-current"></div>
        <div className="absolute -left-2 -bottom-2 w-16 h-16 rounded-full bg-current"></div>
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-2">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 mb-2">{subtitle}</p>}

          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <motion.div animate={isHovered ? { scale: 1.05 } : { scale: 1 }} className="space-y-2">
              <p className="text-3xl font-bold text-gray-900">
                {typeof value === "number" && !isNaN(value) ? value : 0}
              </p>

              {trend && trendValue && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center text-sm ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"
                    }`}
                >
                  {trend === "up" ? (
                    <FaArrowUp className="h-3 w-3 mr-1" />
                  ) : trend === "down" ? (
                    <FaArrowDown className="h-3 w-3 mr-1" />
                  ) : null}
                  <span className="font-medium">{trendValue}</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        <motion.div
          animate={isHovered ? { rotate: 10, scale: 1.1 } : { rotate: 0, scale: 1 }}
          className={`p-4 rounded-2xl ${colors.icon} shadow-lg`}
        >
          <Icon className="h-8 w-8" />
        </motion.div>
      </div>
    </motion.div>
  )
}

// Enhanced Modal Component
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
}) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-7xl",
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      >
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`bg-white rounded-3xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] flex flex-col overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
              {showCloseButton && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-all duration-200"
                >
                  <FaTimes className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Enhanced Button Component
const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon: Icon = null,
  className = "",
  ...props
}) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl",
    secondary:
      "bg-white border-2 border-gray-300 hover:border-indigo-400 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50",
    success:
      "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl",
    danger:
      "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl",
    warning:
      "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl",
  }

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        font-semibold rounded-xl transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed 
        flex items-center justify-center space-x-2
        ${className}
      `}
      {...props}
    >
      {loading ? <FaSpinner className="animate-spin h-4 w-4" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </motion.button>
  )
}

// Facial Recognition Modal Component
const FacialRecognitionModal = ({ isOpen, onClose, eventId, onSuccess }) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [numberOfPeople, setNumberOfPeople] = useState(1)
  const [matchedAttendee, setMatchedAttendee] = useState(null)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1) // 1: capture, 2: confirm, 3: people count

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      setIsCapturing(true)
    } catch (error) {
      setError("Failed to access camera. Please check permissions.")
      toast.error("Failed to access camera")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      const imageData = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedImage(imageData)
      stopCamera()
      setStep(2)

      // Simulate facial recognition matching
      setTimeout(() => {
        setMatchedAttendee({
          id: "mock_id",
          name: "John Doe",
          email: "john@example.com",
          allowedPeople: 5,
          currentCheckedIn: 1,
        })
        setStep(3)
      }, 2000)
    }
  }

  const processFacialRecognition = async () => {
    if (!capturedImage || !matchedAttendee) return

    setLoading(true)
    try {
      const facialData = {
        imageData: capturedImage,
        timestamp: new Date().toISOString(),
        features: "mock_facial_features_data",
        attendeeId: matchedAttendee.id,
        numberOfPeople: numberOfPeople,
      }

      const requestData = {
        facialDataJson: JSON.stringify(facialData),
        imageData: capturedImage,
        numberOfPeople: numberOfPeople,
      }

      const result = await eventMonitoringService.facialCheckIn(eventId, requestData)

      toast.success(
        `Successfully checked in ${numberOfPeople} ${numberOfPeople === 1 ? "person" : "people"}`,
      )
      onSuccess()
      handleClose()
    } catch (error) {
      toast.error(error.message || "Facial check-in failed")
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    stopCamera()
    setCapturedImage(null)
    setMatchedAttendee(null)
    setNumberOfPeople(1)
    setError(null)
    setStep(1)
    onClose()
  }

  const resetCapture = () => {
    setCapturedImage(null)
    setMatchedAttendee(null)
    setNumberOfPeople(1)
    setError(null)
    setStep(1)
    startCamera()
  }

  const getMaxPeople = () => {
    if (!matchedAttendee) return 1;
    return Math.max(0, matchedAttendee.allowedPeople - matchedAttendee.currentCheckedIn);
  }

  useEffect(() => {
    if (isOpen && step === 1) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isOpen, step])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center space-x-3">
          <FaCamera className="text-indigo-600" />
          <span>Facial Recognition Check-in</span>
        </div>
      }
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <motion.div
                animate={{
                  backgroundColor: step >= stepNum ? "#4F46E5" : "#E5E7EB",
                  scale: step === stepNum ? 1.1 : 1,
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
              >
                {step > stepNum ? <FaCheckCircle /> : stepNum}
              </motion.div>
              {stepNum < 3 && <div className={`w-12 h-1 mx-2 ${step > stepNum ? "bg-indigo-500" : "bg-gray-300"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Camera Capture */}
        {step === 1 && (
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{ height: "400px" }}>
              {error ? (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                  <div className="text-center">
                    <FaExclamationTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{error}</p>
                    <Button onClick={startCamera} className="mt-4" variant="primary">
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : isCapturing ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <FaCamera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-4">Camera not active</p>
                    <Button onClick={startCamera} variant="primary">
                      <FaCamera />
                      Start Camera
                    </Button>
                  </div>
                </div>
              )}

              {/* Camera overlay */}
              {isCapturing && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-4 border-white/30 rounded-2xl" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white rounded-full" />
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex justify-center">
              {isCapturing && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={captureImage} size="lg" variant="primary">
                    <FaCamera />
                    Capture Photo
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Processing */}
        {step === 2 && (
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Image</h3>
              <p className="text-gray-600">Analyzing facial features and matching with attendee database...</p>
            </div>

            {capturedImage && (
              <div className="flex justify-center">
                <img
                  src={capturedImage || "/placeholder.svg"}
                  alt="Captured"
                  className="w-48 h-48 object-cover rounded-2xl border-4 border-indigo-200"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: People Count */}
        {step === 3 && matchedAttendee && (
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
            {/* Matched Attendee Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-green-900">Attendee Matched!</h4>
                  <p className="text-green-700 font-medium">{matchedAttendee.name}</p>
                  <p className="text-green-600 text-sm">{matchedAttendee.email}</p>
                  <p className="text-green-600 text-sm mt-1">
                    Can check in {getMaxPeople()} more people
                  </p>
                </div>
              </div>
            </motion.div>

            {/* People Counter */}
            <PeopleCounter
              current={numberOfPeople}
              max={getMaxPeople()}
              onChange={setNumberOfPeople}
              label="Number of People to Check In"
              error={numberOfPeople > getMaxPeople() ? `Cannot exceed ${getMaxPeople()} people` : null}
            />

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button onClick={resetCapture} variant="secondary">
                <FaSync />
                Retake Photo
              </Button>
              <Button
                onClick={processFacialRecognition}
                disabled={loading || numberOfPeople === 0 || numberOfPeople > getMaxPeople()}
                loading={loading}
                variant="primary"
                size="lg"
              >
                <FaFingerprint />
                Check In {numberOfPeople} {numberOfPeople === 1 ? "Person" : "People"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}

// Self Service Modal Component
const SelfServiceModal = ({ isOpen, onClose, eventId, onSuccess, attendee }) => {
  const [identifier, setIdentifier] = useState("")
  const [method, setMethod] = useState("email")
  const [otp, setOtp] = useState("")
  const [numberOfPeople, setNumberOfPeople] = useState(1)
  const [attendeeInfo, setAttendeeInfo] = useState(null)
  const [step, setStep] = useState(1) // 1: identifier, 2: otp, 3: people count
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [otpTimer, setOtpTimer] = useState(0)

  const validateIdentifier = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\+?[\d\s-()]+$/

    if (!value.trim()) {
      return "Please enter your email or phone number"
    }

    if (!emailRegex.test(value) && !phoneRegex.test(value)) {
      return "Please enter a valid email or phone number"
    }

    return null
  }

  const validateOtp = (value) => {
    if (!value.trim()) {
      return "Please enter the verification code"
    }

    if (value.length !== 6) {
      return "Verification code must be 6 digits"
    }

    return null
  }

  const handleSendOtp = async () => {
    const identifierError = validateIdentifier(identifier)
    if (identifierError) {
      setErrors({ identifier: identifierError })
      return
    }
    // Get attendee info after successful verification
    const attendeeData = await eventMonitoringService.searchAttendees(eventId, identifier)
    const matchedAttendee = attendeeData[0] || attendee

    setLoading(true)
    setErrors({})

    try {
      // Determine if identifier is email or phone
      const isEmail = identifier.includes("@")
      const methodType = isEmail ? "otp_email" : "otp_sms"

      if (method !== "manual") {
        // Send OTP using the service
        await eventMonitoringService.sendMessage({
          identifier,
          method: methodType,
          message: `Your check-in verification code for the event.`
        })

        toast.success(`Verification code sent via ${isEmail ? "email" : "SMS"}`)
        setStep(2)
        setOtpTimer(60) // Start 60 second timer

        const timer = setInterval(() => {
          setOtpTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        // For manual method, skip OTP and go to people count
        setAttendeeInfo({
          id: matchedAttendee.Id,
          name: matchedAttendee.FirstName + " " + matchedAttendee.LastName,
          email: isEmail ? identifier : matchedAttendee.Email || "",
          phone: isEmail ? matchedAttendee.Phone || "" : identifier,
          allowedPeople: matchedAttendee.AllowedPeople || 1,
          currentCheckedIn: matchedAttendee.checked_in_count || 0
        })
        setStep(3)
      }
    } catch (error) {
      setErrors({ identifier: error.message || "Failed to send verification code" })
      toast.error(error.message || "Failed to send verification code")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otpError = validateOtp(otp)
    if (otpError) {
      setErrors({ otp: otpError })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Verify OTP using the service
      const verificationResult = await eventMonitoringService.verifyOtp(identifier, otp)
      console.log(verificationResult)
      if (!verificationResult) {
        throw new Error("Invalid verification code")
      }

      // Get attendee info after successful verification
      const attendeeData = await eventMonitoringService.searchAttendees(eventId, identifier)
      const matchedAttendee = attendeeData[0] || attendee

      setAttendeeInfo({
        id: matchedAttendee.Id,
        name: matchedAttendee.FirstName + " " + matchedAttendee.LastName,
        email: matchedAttendee.Email,
        phone: matchedAttendee.Phone,
        allowedPeople: matchedAttendee.AllowedPeople || 1,
        currentCheckedIn: matchedAttendee.checked_in_count || 0
      })

      toast.success("Verification successful!")
      setStep(3)
    } catch (error) {
      setErrors({ otp: error.message || "Invalid verification code" })
      toast.error(error.message || "Invalid verification code")
    } finally {
      setLoading(false)
    }
  }

  const handleSelfService = async () => {
    if (numberOfPeople === 0 || numberOfPeople > getMaxPeople()) {
      setErrors({ people: "Invalid number of people" })
      return
    }
    // Get attendee info after successful verification
    const attendeeData = await eventMonitoringService.searchAttendees(eventId, identifier)
    const matchedAttendee = attendeeData[0] || attendee

    setLoading(true)
    setErrors({})

    try {
      await eventMonitoringService.manualCheckIn(eventId, matchedAttendee.Id, {
        identifier,
        method: "otp",
        numberOfPeople
      })

      toast.success(
        `Successfully checked in ${numberOfPeople} ${numberOfPeople === 1 ? "person" : "people"}`,
      )
      onSuccess()
      handleClose()
    } catch (error) {
      setErrors({ submit: error.message || "Self check-in failed" })
      toast.error(error.message || "Self check-in failed")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIdentifier("")
    setMethod("email")
    setOtp("")
    setNumberOfPeople(1)
    setAttendeeInfo(null)
    setStep(1)
    setErrors({})
    setOtpTimer(0)
    onClose()
  }

  const getMaxPeople = () => {
    if (!attendeeInfo) return 1
    return Math.max(0, attendeeInfo.allowedPeople - attendeeInfo.currentCheckedIn)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center space-x-3">
          <FaUserCog className="text-indigo-600" />
          <span>Self Check-in</span>
        </div>
      }
      size="md"
    >
      <div className="p-6 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <motion.div
                animate={{
                  backgroundColor: step >= stepNum ? "#4F46E5" : "#E5E7EB",
                  scale: step === stepNum ? 1.1 : 1,
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
              >
                {step > stepNum ? <FaCheckCircle /> : stepNum}
              </motion.div>
              {stepNum < 3 && <div className={`w-12 h-1 mx-2 ${step > stepNum ? "bg-indigo-500" : "bg-gray-300"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Identifier Input */}
        {step === 1 && (
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email or Phone Number</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  if (errors.identifier) {
                    setErrors({ ...errors, identifier: null })
                  }
                }}
                placeholder="Enter your email or phone number"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${errors.identifier ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"
                  }`}
              />
              {errors.identifier && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm mt-2 flex items-center"
                >
                  <FaExclamationTriangle className="h-4 w-4 mr-1" />
                  {errors.identifier}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="email">Email Verification</option>
                <option value="otp_sms">SMS Verification</option>
                <option value="manual">Manual (No Verification)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <Button onClick={handleClose} variant="secondary">
                Cancel
              </Button>
              <Button
                onClick={handleSendOtp}
                disabled={loading || !identifier.trim()}
                loading={loading}
                variant="primary"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {method === "email" ? (
                  <FaEnvelope className="h-8 w-8 text-indigo-600" />
                ) : (
                  <FaSms className="h-8 w-8 text-indigo-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Code Sent</h3>
              <p className="text-gray-600">
                Enter the 6-digit code sent to your {method === "email" ? "email" : "phone"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setOtp(value)
                  if (errors.otp) {
                    setErrors({ ...errors, otp: null })
                  }
                }}
                placeholder="Enter 6-digit code"
                className={`w-full px-4 py-3 border-2 rounded-xl text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${errors.otp ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"
                  }`}
                maxLength={6}
              />
              {errors.otp && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm mt-2 flex items-center"
                >
                  <FaExclamationTriangle className="h-4 w-4 mr-1" />
                  {errors.otp}
                </motion.p>
              )}
            </div>

            {otpTimer > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Resend code in {otpTimer} seconds</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button onClick={() => setStep(1)} variant="secondary">
                Back
              </Button>
              <Button
                onClick={handleVerifyOtp}
                disabled={loading || !otp.trim() || otp.length !== 6}
                loading={loading}
                variant="primary"
              >
                Verify Code
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: People Count */}
        {step === 3 && attendeeInfo && (
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
            {/* Welcome Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <FaUserCheck className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-blue-900">Welcome, {attendeeInfo.name}!</h4>
                  <p className="text-blue-700">{attendeeInfo.email}</p>
                  <p className="text-blue-600 text-sm mt-1">
                    You can check in up to {getMaxPeople()} more people
                  </p>
                </div>
              </div>
            </motion.div>

            {/* People Counter */}
            <PeopleCounter
              current={numberOfPeople}
              max={getMaxPeople()}
              onChange={setNumberOfPeople}
              label="Number of People to Check In"
              error={errors.people}
            />

            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4"
              >
                <div className="flex items-center">
                  <FaExclamationTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-700 font-medium">{errors.submit}</p>
                </div>
              </motion.div>
            )}

            <div className="flex justify-end space-x-3">
              <Button onClick={() => setStep(method === "manual" ? 1 : 2)} variant="secondary">
                Back
              </Button>
              <Button
                onClick={handleSelfService}
                disabled={loading || numberOfPeople === 0 || numberOfPeople > getMaxPeople()}
                loading={loading}
                variant="primary"
                size="lg"
              >
                Check In {numberOfPeople} {numberOfPeople === 1 ? "Person" : "People"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}

// Enhanced Attendee Management Modal
const AttendeeManagementModal = ({ isOpen, onClose, eventId, attendees, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [selectedAttendees, setSelectedAttendees] = useState([])
  const [bulkAction, setBulkAction] = useState("")
  const [loading, setLoading] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [currentAttendee, setCurrentAttendee] = useState(null)
  const [checkInCount, setCheckInCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Calculate attendance status
  const getAttendanceStatus = useCallback((attendee) => {
    let checkedInCount = 0;
    const rawCount = attendee?.checked_in_count;

    if (typeof rawCount === 'number') {
      checkedInCount = rawCount;
    } else if (typeof rawCount === 'object' && rawCount !== null) {
      checkedInCount = rawCount.count || rawCount.total || 0;
    }

    const allowedPeople = Number(attendee?.AllowedPeople) || 1;

    if (checkedInCount === 0) {
      return "not_checked_in";
    } else if (checkedInCount === allowedPeople) {
      return "checked_in";
    } else if (checkedInCount > 0) {
      return "partially_checked_in";
    }
    return "not_checked_in";
  }, []);

  // Enhanced filtering and sorting
  const filteredAndSortedAttendees = useMemo(() => {
    return attendees
      .map((attendee) => ({
        ...attendee,
        calculated_status: getAttendanceStatus(attendee),
      }))
      .filter((attendee) => {
        const matchesSearch =
          searchTerm === "" ||
          `${attendee.FirstName} ${attendee.LastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attendee.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attendee.Phone.includes(searchTerm)

        const matchesFilter = filterStatus === "all" || attendee.calculated_status === filterStatus

        return matchesSearch && matchesFilter
      })
      .sort((a, b) => {
        let aValue, bValue

        switch (sortBy) {
          case "name":
            aValue = `${a.FirstName} ${a.LastName}`.toLowerCase()
            bValue = `${b.FirstName} ${b.LastName}`.toLowerCase()
            break
          case "email":
            aValue = a.Email.toLowerCase()
            bValue = b.Email.toLowerCase()
            break
          case "status":
            aValue = a.calculated_status
            bValue = b.calculated_status
            break
          case "checkin_time":
            aValue = a.check_in_time || ""
            bValue = b.check_in_time || ""
            break
          default:
            aValue = a[sortBy]
            bValue = b[sortBy]
        }

        if (sortOrder === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
  }, [attendees, searchTerm, filterStatus, sortBy, sortOrder, getAttendanceStatus])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAttendees.length / itemsPerPage)
  const paginatedAttendees = filteredAndSortedAttendees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const handleSelectAll = () => {
    if (selectedAttendees.length === paginatedAttendees.length) {
      setSelectedAttendees([])
    } else {
      setSelectedAttendees(paginatedAttendees.map((a) => a.Id))
    }
  }

  const handleSelectAttendee = (attendeeId) => {
    setSelectedAttendees((prev) =>
      prev.includes(attendeeId) ? prev.filter((id) => id !== attendeeId) : [...prev, attendeeId],
    )
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedAttendees.length === 0) return

    setLoading(true)
    try {
      switch (bulkAction) {
        case "bulk_checkin":
          await eventMonitoringService.bulkCheckIn(eventId, { AttendeeIds: selectedAttendees })
          toast.success(`Successfully processed bulk check-in for ${selectedAttendees.length} attendees`)
          break
        default:
          break
      }
      setSelectedAttendees([])
      setBulkAction("")
      onRefresh()
    } catch (error) {
      toast.error(error.message || "Bulk action failed")
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheckIn = (attendee) => {
    setCurrentAttendee(attendee)
    setCheckInCount(1)
    setShowCheckInModal(true)
  }

  const executeManualCheckIn = async () => {
    setLoading(true)
    try {
      await eventMonitoringService.manualCheckIn(eventId, currentAttendee.Id, {
        method: "organizer",
        numberOfPeople: checkInCount,
      })
      toast.success(`Successfully checked in ${checkInCount} ${checkInCount === 1 ? "person" : "people"}`)
      setShowCheckInModal(false)
      onRefresh()
    } catch (error) {
      toast.error(error.message || "Check-in failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center space-x-3">
            <FaUsers className="text-indigo-600" />
            <span>Attendee Management</span>
            <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-2 py-1 rounded-full">
              {filteredAndSortedAttendees.length}
            </span>
          </div>
        }
        size="full"
      >
        <div className="p-6 space-y-6">
          {/* Enhanced Search and Filter Controls */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <motion.div variants={fadeInUp} className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search attendees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="not_checked_in">Not Checked In</option>
                <option value="partially_checked_in">Partially Checked In</option>
                <option value="checked_in">Fully Checked In</option>
              </select>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
                <option value="status">Sort by Status</option>
                <option value="checkin_time">Sort by Check-in Time</option>
              </select>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                variant="secondary"
                className="w-full"
              >
                <FaSort />
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </Button>
            </motion.div>
          </motion.div>

          {/* Bulk Actions */}
          <AnimatePresence>
            {selectedAttendees.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{selectedAttendees.length}</span>
                    </div>
                    <span className="text-indigo-900 font-semibold">{selectedAttendees.length} attendees selected</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="px-4 py-2 border-2 border-indigo-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Action</option>
                      <option value="bulk_checkin">Bulk Check-in</option>
                    </select>
                    <Button
                      onClick={handleBulkAction}
                      disabled={!bulkAction || loading}
                      loading={loading}
                      variant="primary"
                      size="sm"
                    >
                      Execute
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attendee List Header */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-3 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={selectedAttendees.length === paginatedAttendees.length && paginatedAttendees.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Select All ({paginatedAttendees.length})</span>
            </label>

            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Showing {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredAndSortedAttendees.length)} of{" "}
              {filteredAndSortedAttendees.length}
            </div>
          </div>

          {/* Attendee List */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            {paginatedAttendees.map((attendee, index) => (
              <motion.div
                key={attendee.Id}
                variants={fadeInUp}
                custom={index}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedAttendees.includes(attendee.Id)}
                      onChange={() => handleSelectAttendee(attendee.Id)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    >
                      {String(attendee.FirstName || "").charAt(0)}
                      {String(attendee.LastName || "").charAt(0)}
                    </motion.div>

                    <div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {attendee.FirstName} {attendee.LastName}
                      </h4>
                      <p className="text-gray-600">{attendee.Email}</p>
                      <p className="text-gray-500 text-sm">{attendee.Phone}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                          {String(
                            typeof attendee.checked_in_count === 'object' && attendee.checked_in_count !== null
                              ? attendee.checked_in_count.count || 0
                              : attendee.checked_in_count || 0
                          )}/{String(attendee.AllowedPeople || 0)}
                        </div>
                        {attendee.check_in_time && (
                          <div className="text-xs text-gray-500">
                            {(() => {
                              const rawDate = attendee?.check_in_time;
                              const date = rawDate ? new Date(rawDate) : null;
                              return date instanceof Date && !isNaN(date)
                                ? date.toLocaleString()
                                : 'Not Checked In';
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <StatusIndicator status={attendee.calculated_status} size="lg" />

                    <div className="flex items-center space-x-2">
                      {/* Action buttons based on status */}
                      {(attendee.calculated_status === "not_checked_in" ||
                        attendee.calculated_status === "partially_checked_in") && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleManualCheckIn(attendee)}
                            disabled={loading}
                            className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 transition-all duration-200"
                            title="Manual Check-in"
                          >
                            <FaUserCheck className="h-5 w-5" />
                          </motion.button>
                        )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center items-center space-x-2"
            >
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                <FaArrowLeft />
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    variant={currentPage === pageNum ? "primary" : "secondary"}
                    size="sm"
                    className="w-10"
                  >
                    {String(pageNum)}
                  </Button>
                )
              })}

              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
              >
                <FaArrowRight />
              </Button>
            </motion.div>
          )}

          {/* Empty State */}
          {filteredAndSortedAttendees.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No attendees found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? "Try adjusting your search terms." : "No attendees match the selected filter."}
              </p>
              {searchTerm && (
                <Button onClick={() => setSearchTerm("")} variant="primary">
                  Clear Search
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </Modal>

      {/* Check-in Modal */}
      <Modal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="Manual Check-in" size="md">
        {currentAttendee && (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                {currentAttendee.FirstName.charAt(0)}
                {currentAttendee.LastName.charAt(0)}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {currentAttendee.FirstName} {currentAttendee.LastName}
              </h3>
              <p className="text-gray-600">{currentAttendee.Email}</p>
            </div>
            <PeopleCounter
              current={checkInCount}
              max={currentAttendee.AllowedPeople - (currentAttendee.checked_in_count || 0)}
              onChange={setCheckInCount}
              label="Number of People to Check In"
            />

            <div className="flex justify-end space-x-3">
              <Button onClick={() => setShowCheckInModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button
                onClick={executeManualCheckIn}
                disabled={loading || checkInCount === 0}
                loading={loading}
                variant="success"
              >
                Check In {checkInCount} {checkInCount === 1 ? "Person" : "People"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

// Main Event Monitoring Component
const EventMonitoring = () => {
  const { eventId: id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [eventStatus, setEventStatus] = useState("not_started")
  const [attendees, setAttendees] = useState([])
  const [attendanceStats, setAttendanceStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAttendeeModal, setShowAttendeeModal] = useState(false)
  const [showFacialModal, setShowFacialModal] = useState(false)
  const [showSelfServiceModal, setShowSelfServiceModal] = useState(false)
  const [realTimeData, setRealTimeData] = useState({
    totalCheckedIn: 0,
    totalCapacity: 0,
    lastUpdate: new Date(),
  })

  // Auto-refresh interval
  const refreshInterval = useRef(null)

  // Fetch initial data
  useEffect(() => {
    fetchEventData()
    startRealTimeUpdates()
  }, [id])

  const fetchEventData = async () => {
    try {
      setLoading(true);

      const statusData = await eventMonitoringService.getEventStatus(id);
      setEventStatus(statusData.status);
      setEvent(statusData);

      const attendanceData = await eventMonitoringService.getEventAttendance(id);
      const attendeesArray = Array.isArray(attendanceData) ? attendanceData : [];
      setAttendees(attendeesArray);

      const statsData = await eventMonitoringService.getAttendanceStats(id);
      setAttendanceStats(statsData);

      // Totals
      let totalAllowed = 0;
      let totalCheckedIn = 0;
      const checkInMethods = {};

      attendeesArray.forEach((attendee) => {
        // Allowed people
        const allowed = Number(attendee.AllowedPeople) || 0;
        totalAllowed += allowed;

        // Checked-in count
        let checkedIn = 0;
        const rawCheckedIn = attendee.checked_in_count;
        if (typeof rawCheckedIn === 'number') {
          checkedIn = rawCheckedIn;
        } else if (typeof rawCheckedIn === 'object' && rawCheckedIn !== null) {
          checkedIn = rawCheckedIn.count || rawCheckedIn.total || 0;
        }
        totalCheckedIn += checkedIn;

        // Group by method
        const method = String(attendee?.check_in_method || 'unknown').trim();
        checkInMethods[method] = (checkInMethods[method] || 0) + checkedIn;
      });

      // Set Top Summary Stats
      setRealTimeData({
        totalCheckedIn,
        totalCapacity: totalAllowed,
        lastUpdate: new Date(),
      });

      // Set Detailed Stats
      setAttendanceStats({
        total_allowed_people: totalAllowed,
        total_checked_in: totalCheckedIn,
        check_in_methods: checkInMethods,
      });

    } catch (err) {
      console.error("Error fetching event data:", err);
      setError(err.message || "Failed to load event data");
      toast.error(err.message || "Failed to load event data");

      setAttendees([]);
      setAttendanceStats({});
      setRealTimeData({
        totalCheckedIn: 0,
        totalCapacity: 0,
        lastUpdate: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeUpdates = () => {
    // Update every 30 seconds if needed
  }

  const handleStatusChange = async (action) => {
    setActionLoading(true)
    try {
      switch (action) {
        case "start":
          await eventMonitoringService.startEvent(id)
          setEventStatus("in_progress")
          toast.success("Event started successfully")
          break
        case "pause":
          await eventMonitoringService.pauseEvent(id)
          setEventStatus("paused")
          toast.success("Event paused successfully")
          break
        case "resume":
          await eventMonitoringService.resumeEvent(id)
          setEventStatus("in_progress")
          toast.success("Event resumed successfully")
          break
        case "end":
          await eventMonitoringService.endEvent(id)
          setEventStatus("ended")
          toast.success("Event ended successfully")
          break
        default:
          break
      }
      fetchEventData()
    } catch (error) {
      toast.error(error.message || "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const getAttendanceStatusCounts = () => {
    const counts = {
      not_checked_in: 0,
      partially_checked_in: 0,
      checked_in: 0,
    }

    if (!Array.isArray(attendees) || attendees.length === 0) {
      return counts
    }

    attendees.forEach((attendee) => {
      if (!attendee) return

      const checkedInCount = Number(attendee.checked_in_count) || 0
      const allowedPeople = Number(attendee.AllowedPeople) || 1

      if (checkedInCount === 0) {
        counts.not_checked_in++
      } else if (checkedInCount === allowedPeople) {
        counts.checked_in++
      } else if (checkedInCount > 0) {
        counts.partially_checked_in++
      }
    })

    return counts
  }

  if (loading) {
    return <EnhancedLoader message="Loading event monitoring..." />
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50 px-4"
      >
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <FaExclamationTriangle className="h-12 w-12" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Error Loading Event</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <Button onClick={() => navigate(-1)} variant="primary" size="lg">
            <FaArrowLeft />
            Go Back
          </Button>
        </div>
      </motion.div>
    )
  }

  const statusCounts = getAttendanceStatusCounts()

  return (
    <div className="bg-gradient-to-br from-gray-50 to-indigo-50 min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
        toastClassName="rounded-xl"
      />

      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="p-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
              >
                <FaArrowLeft className="h-6 w-6" />
              </motion.button>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event?.title}</h1>
                <div className="flex items-center space-x-6 mt-2">
                  <div className="flex items-center text-gray-500">
                    <FaCalendarAlt className="h-5 w-5 mr-2" />
                    <span className="font-medium">{event?.start_date}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <FaClock className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      {event?.start_time} - {event?.end_time}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* <StatusIndicator status={eventStatus} size="xl" /> */}
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="font-semibold text-gray-900">{realTimeData.lastUpdate.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Statistics Overview */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <StatCard
            title="Total Attendees"
            value={attendees.length}
            subtitle={`${realTimeData.totalCapacity} people capacity`}
            icon={FaUsers}
            color="indigo"
            onClick={() => setShowAttendeeModal(true)}
            animated={true}
          />
          <StatCard
            title="People Checked In"
            value={realTimeData.totalCheckedIn}
            subtitle={`${statusCounts.checked_in + statusCounts.partially_checked_in} attendees`}
            icon={FaUserCheck}
            color="green"
            trend="up"
            trendValue={`${Math.round((realTimeData.totalCheckedIn / realTimeData.totalCapacity) * 100)}% capacity`}
            animated={true}
          />
          <StatCard
            title="Currently Present"
            value={realTimeData.totalCheckedIn}
            subtitle="People in venue"
            icon={FaUserCog}
            color="blue"
            animated={true}
          />
        </motion.div>

        {/* Enhanced Action Buttons */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <motion.div variants={fadeInUp}>
            <Button
              onClick={() => setShowFacialModal(true)}
              variant="primary"
              className="w-full h-20 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <div className="text-center">
                <FaCamera className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-semibold">Facial Check-in</span>
              </div>
            </Button>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Button
              onClick={() => setShowSelfServiceModal(true)}
              variant="primary"
              className="w-full h-20 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
            >
              <div className="text-center">
                <FaUserFriends className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-semibold">Self Check-in</span>
              </div>
            </Button>
          </motion.div>
        </motion.div>

        {/* Enhanced Attendance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Attendance Overview</h3>
            <Button onClick={() => setShowAttendeeModal(true)} variant="primary">
              <FaUsers />
              Manage Attendees
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { key: "not_checked_in", label: "Not Checked In", color: "gray" },
              { key: "partially_checked_in", label: "Partially Checked In", color: "yellow" },
              { key: "checked_in", label: "Fully Checked In", color: "green" },
            ].map((status) => {
              const colorClass =
                status.color === "gray"
                  ? "text-gray-900"
                  : status.color === "yellow"
                    ? "text-yellow-900"
                    : "text-green-900"

              return (
                <motion.div
                  key={status.key}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-2xl border-2 ${status.color === "gray"
                      ? "bg-gray-50 border-gray-200"
                      : status.color === "yellow"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-green-50 border-green-200"
                    }`}
                >
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${colorClass}`}>{String(statusCounts[status.key] || 0)}</p>
                    <p
                      className={`text-sm font-medium ${status.color === "gray"
                          ? "text-gray-700"
                          : status.color === "yellow"
                            ? "text-yellow-700"
                            : "text-green-700"
                        }`}
                    >
                      {status.label}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Enhanced Progress Bar */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-semibold">Overall Check-in Progress</span>
              <span className="font-semibold">
                {realTimeData.totalCheckedIn} / {realTimeData.totalCapacity} people (
                {realTimeData.totalCapacity > 0
                  ? Math.round((realTimeData.totalCheckedIn / realTimeData.totalCapacity) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${realTimeData.totalCapacity > 0
                      ? (realTimeData.totalCheckedIn / realTimeData.totalCapacity) * 100
                      : 0
                    }%`,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full shadow-lg"
              />
            </div>
          </div>
        </motion.div>

        {/* Event Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                {eventStatus === "not_started" && <FaPlayCircle className="h-8 w-8 text-white" />}
                {eventStatus === "in_progress" && <FaPauseCircle className="h-8 w-8 text-white" />}
                {eventStatus === "paused" && <FaPlayCircle className="h-8 w-8 text-white" />}
                {eventStatus === "ended" && <FaStopCircle className="h-8 w-8 text-white" />}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Event Control</h3>
                {/* <StatusIndicator status={eventStatus} size="lg" /> */}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Time</p>
              <p className="text-2xl font-bold text-gray-900">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {eventStatus === "not_started" && (
              <Button
                onClick={() => handleStatusChange("start")}
                disabled={actionLoading}
                loading={actionLoading}
                variant="success"
                size="lg"
                className="h-16"
              >
                <div className="text-center">
                  <FaPlay className="h-6 w-6 mx-auto mb-1" />
                  <span>Start Event</span>
                </div>
              </Button>
            )}

            {eventStatus === "in_progress" && (
              <>
                <Button
                  onClick={() => handleStatusChange("pause")}
                  disabled={actionLoading}
                  loading={actionLoading}
                  variant="warning"
                  size="lg"
                  className="h-16"
                >
                  <div className="text-center">
                    <FaPause className="h-6 w-6 mx-auto mb-1" />
                    <span>Pause Event</span>
                  </div>
                </Button>
                <Button
                  onClick={() => handleStatusChange("end")}
                  disabled={actionLoading}
                  loading={actionLoading}
                  variant="danger"
                  size="lg"
                  className="h-16"
                >
                  <div className="text-center">
                    <FaStop className="h-6 w-6 mx-auto mb-1" />
                    <span>End Event</span>
                  </div>
                </Button>
              </>
            )}

            {eventStatus === "paused" && (
              <>
                <Button
                  onClick={() => handleStatusChange("resume")}
                  disabled={actionLoading}
                  loading={actionLoading}
                  variant="success"
                  size="lg"
                  className="h-16"
                >
                  <div className="text-center">
                    <FaPlay className="h-6 w-6 mx-auto mb-1" />
                    <span>Resume Event</span>
                  </div>
                </Button>
                <Button
                  onClick={() => handleStatusChange("end")}
                  disabled={actionLoading}
                  loading={actionLoading}
                  variant="danger"
                  size="lg"
                  className="h-16"
                >
                  <div className="text-center">
                    <FaStop className="h-6 w-6 mx-auto mb-1" />
                    <span>End Event</span>
                  </div>
                </Button>
              </>
            )}

            {eventStatus === "ended" && (
              <div className="col-span-full">
                <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 text-center">
                  <FaCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Event Completed</h4>
                  <p className="text-gray-600">The event has ended. You can view analytics and export data.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* All Modals */}
      <AttendeeManagementModal
        isOpen={showAttendeeModal}
        onClose={() => setShowAttendeeModal(false)}
        eventId={id}
        attendees={attendees}
        onRefresh={fetchEventData}
      />

      <FacialRecognitionModal
        isOpen={showFacialModal}
        onClose={() => setShowFacialModal(false)}
        eventId={id}
        onSuccess={fetchEventData}
      />

      <SelfServiceModal
        isOpen={showSelfServiceModal}
        onClose={() => setShowSelfServiceModal(false)}
        eventId={id}
        onSuccess={fetchEventData}
        attendee={attendees}
      />
    </div>
  )
}

export default EventMonitoring