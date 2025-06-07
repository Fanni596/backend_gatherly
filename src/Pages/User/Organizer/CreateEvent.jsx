"use client"

import { useState, useEffect, useCallback, useRef, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDropzone } from "react-dropzone"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import ReactMarkdown from "react-markdown"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../../../Contexts/authContext"
import eventService from "../../../Services/eventServices"
import { FiChevronUp, FiChevronDown, FiSave, FiArrowRight, FiArrowLeft } from "react-icons/fi"
import LocationPickerModal from "../../../Components/Global/LocationPickerModal"
import LocationViewModal from "../../../Components/Global/LocationViewModal"


// Constants
const steps = ["Overview", "Date & Location", "Details", "Tickets", "Review"]
const MAX_IMAGES = 5 // Maximum number of images allowed

const CreateEvent = () => {
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showLocationView, setShowLocationView] = useState(false)
  const [pickedLocation, setPickedLocation] = useState({ lng: 67.0011, lat: 24.8607 })
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeUploadSection, setActiveUploadSection] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [saveStatus, setSaveStatus] = useState("draft")
  const [isSaving, setIsSaving] = useState(false)
  const [publishStep, setPublishStep] = useState(false)
  const [error, setError] = useState(null)
  const [eventId, setEventId] = useState(null) // Track created event ID
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  // Add new state for FAB navigation
  const [fabExpanded, setFabExpanded] = useState(true)
  const fabRef = useRef(null)

  // Close FAB when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        // setFabExpanded(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])


  // Form Data State
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    description: "",
    date: new Date(),
    startTime: "10:00",
    endTime: "12:00",
    location: "",  // This will be the human-readable address
    latitude: null,     // Add latitude field
    longitude: null,     // Add longitude field
    ticketType: "free",
    ticketPrice: "",
    visibility: "public",
    registrationExpiry: null,
  })

  // Media State
  const [imageFiles, setImageFiles] = useState([])
  const [videoFile, setVideoFile] = useState(null)
  const maxSummaryLength = 140

  /**
   * Form Validation
   * Validates the form based on current step
   * @param {number} step - Current form step
   * @returns {boolean} - True if validation passes
   */
  const validate = (step) => {
    const newErrors = {}

    if (step === 0) {
      if (!formData.title.trim()) newErrors.title = "Event title is required"
      if (imageFiles.length === 0 && videoFile === null) {
        newErrors.media = "Image or Video is required"
      }
      if (!formData.summary.trim()) newErrors.summary = "Summary is required"
      else if (formData.summary.length < 30) newErrors.summary = "Summary should be at least 30 characters"
    }

    if (step === 1) {
      if (!formData.date) newErrors.date = "Date is required"
      if (!formData.startTime) newErrors.startTime = "Start time is required"
      if (!formData.endTime) newErrors.endTime = "End time is required"
      if (!formData.location.trim()) {
        newErrors.location = "Location is required for in-person events"
      } else if (!pickedLocation.lat || !pickedLocation.lng) {
        newErrors.location = "Location coordinates are required for in-person events"
      }
    }

    if (step === 2) {
      if (!formData.description.trim()) newErrors.description = "Description is required"
      else if (formData.description.length < 50) newErrors.description = "Description should be at least 50 characters"
    }

    if (step === 3 && formData.ticketType === "paid" && !formData.ticketPrice) {
      newErrors.ticketPrice = "Ticket price is required for paid events"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Image Upload Handling
   * Processes dropped image files and creates preview URLs
   */
  const filesToCleanup = useRef(new Set())
  const cleanupFiles = () => {
    filesToCleanup.current.forEach((url) => {
      URL.revokeObjectURL(url)
    })
    filesToCleanup.current.clear()
  }

  const onImageDrop = useCallback((acceptedFiles) => {
    setImageFiles((prev) => {
      const existingIds = new Set(prev.map((file) => file.id))
      const newFilesWithPreview = acceptedFiles
        .filter((newFile) => {
          const newFileId = `${newFile.name}-${newFile.lastModified}-${newFile.size}`
          return !existingIds.has(newFileId)
        })
        .map((file) => {
          const preview = URL.createObjectURL(file)
          filesToCleanup.current.add(preview)
          return {
            file, // Store the actual File object here
            preview,
            id: `${file.name}-${file.lastModified}-${file.size}`,
            uploaded: false,
          }
        })

      const combinedFiles = [...prev, ...newFilesWithPreview]

      if (combinedFiles.length > MAX_IMAGES) {
        const filesToRemove = combinedFiles.length - MAX_IMAGES
        combinedFiles.slice(0, filesToRemove).forEach((file) => {
          filesToCleanup.current.add(file.preview)
        })
        return combinedFiles.slice(filesToRemove)
      }

      return combinedFiles
    })
    setActiveUploadSection(null)
  }, [])

  const onVideoDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const preview = URL.createObjectURL(file)
      filesToCleanup.current.add(preview)
      setVideoFile({
        file,
        preview,
        id: `${file.name}-${file.lastModified}-${file.size}`,
        uploaded: false, // Track upload status
      })
    }
    setActiveUploadSection(null)
  }, [])

  // Dropzone Configuration for Images
  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({
    onDrop: onImageDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    maxFiles: MAX_IMAGES,
    multiple: true,
  })

  // Dropzone Configuration for Videos
  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    onDrop: onVideoDrop,
    accept: { "video/*": [".mp4", ".mov"] },
    maxFiles: 1,
    multiple: false,
  })

  // Clean up object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      cleanupFiles()
    }
  }, [])

  /**
   * Remove Image Handler
   * @param {string} id - ID of image to remove
   */
  const handleRemoveImage = (id) => {
    setImageFiles((prev) => {
      const newFiles = prev.filter((file) => file.id !== id)
      const removedFile = prev.find((file) => file.id === id)
      if (removedFile) {
        filesToCleanup.current.add(removedFile.preview)
      }
      return newFiles
    })

    if (currentImageIndex >= imageFiles.length - 1) {
      setCurrentImageIndex(Math.max(0, imageFiles.length - 1))
    }
  }

  /**
   * Remove Video Handler
   * Cleans up video preview URL and removes video
   */
  const handleRemoveVideo = () => {
    if (videoFile) {
      filesToCleanup.current.add(videoFile.preview)
      setVideoFile(null)
    }
  }

  /**
   * Summary Change Handler
   * Ensures summary doesn't exceed max length
   */
  const handleSummaryChange = (e) => {
    if (e.target.value.length <= maxSummaryLength) {
      setFormData({ ...formData, summary: e.target.value })
    }
  }

  /**
   * Field Blur Handler
   * Marks field as touched and validates
   * @param {string} field - Field name
   */
  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true })
    validate(currentStep)
  }

  // Animation variants for form steps
  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  /**
   * Next Step Handler
   * Validates current step before proceeding
   */
  const handleNext = () => {
    if (!validate(currentStep)) return
    if (currentStep === 4) {
      setCurrentStep((prev) => prev + 1)
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      setPublishStep(true) // Show review content but don't auto-publish
    }
  }

  const handlePrevious = () => {
    if (currentStep === 5) {
      setCurrentStep((prev) => prev - 1)
    }
    if (publishStep) {
      setPublishStep(false) // Go back from publish review
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  /**
   * Handle Submission
   */
  const handleSaveDraft = async () => {
    // Check if there's at least one media item
    if (imageFiles.length === 0 && !videoFile) {
      setError("At least one image or video is required");
      return;
    }
  
    setIsSaving(true);
    setError(null);
  
    try {
      if (!validateAllSteps()) {
        throw new Error("Please fix validation errors before saving");
      }
  
      // 1. Create main event
      const eventData = prepareEventData("draft");
      console.log("Event Data:", eventData);
      const response = await eventService.createEvent(eventData);
      const newEventId = response.eventId;
      setEventId(newEventId);
  
      // 2. For public events, create a default attendee list
      if (formData.visibility === "public") {
        await eventService.createDefaultList(newEventId, formData.title);
      }
  
      // 3. Upload images (if any)
      if (imageFiles.length > 0) {
        const filesToUpload = imageFiles.map((item) => item.file);
        await eventService.uploadImages(newEventId, filesToUpload);
      }
  
      // 4. Upload video (if exists)
      if (videoFile) {
        const videoToUpload = videoFile.file || videoFile;
        if (videoToUpload instanceof File) {
          await eventService.uploadVideo(newEventId, videoToUpload);
        }
      }
  
      setSaveStatus("draft");
      // Redirect to edit page after successful save
      window.location.href = `/events/edit/${newEventId}`;
    } catch (error) {
      console.error("Save error:", error);
      setError(error.message || "Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const validateAllSteps = () => {
    let isValid = true

    // First check media requirement explicitly
    if (imageFiles.length === 0 && !videoFile) {
      setError("At least one image or video is required")
      isValid = false
    }

    // Then check all other validations
    steps.forEach((_, index) => {
      if (!validate(index)) {
        isValid = false
      }
    })

    return isValid
  }

  const prepareEventData = (status) => {
    // Create FormData object since we're uploading files
    const formDataObj = new FormData()

    // Add all required fields with EXACT CASE MATCHING your backend
    formDataObj.append("Title", formData.title || "")
    formDataObj.append("Description", formData.description || "")
    formDataObj.append("summary", formData.summary || "")
    formDataObj.append("StartDate", formData.date.toISOString().split("T")[0])
    formDataObj.append("StartTime", formData.startTime + ":00")
    formDataObj.append("EndTime", formData.endTime + ":00")
    formDataObj.append("Latitude", formData.latitude || "")
    formDataObj.append("Longitude", formData.longitude || "")
    formDataObj.append("Location", formData.location || "")
    formDataObj.append("TicketType", formData.ticketType || "free")
    formDataObj.append("TicketPrice", formData.ticketType === "paid" ? Number.parseFloat(formData.ticketPrice) || 0 : 0)
    formDataObj.append("Status", status || "draft")
    formDataObj.append("Visibility", formData.visibility || "public")
    formDataObj.append("OrganizerName", user.firstName + " " + user.lastName) // Add organizer name
    formDataObj.append("OrganizerEmail", user.email) // Add organizer email

    // Handle registration expiry
    if (formData.registrationExpiry instanceof Date && !isNaN(formData.registrationExpiry.getTime())) {
      formDataObj.append("RegistrationExpiry", formData.registrationExpiry.toISOString())
    } else {
      formDataObj.append("RegistrationExpiry", "")
    }

    return formDataObj
  }

  /**
   * Renders the image upload section
   * @returns {JSX} - Image upload UI
   */
  const renderImageUploadSection = () => (
    <div className="border-2 border-dashed rounded-lg p-6 mb-4">
      <div
        {...getImageRootProps()}
        className={`p-8 text-center cursor-pointer transition-colors ${isImageDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
          }`}
      >
        <input {...getImageInputProps()} />
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm text-gray-700 font-medium">
            {isImageDragActive ? "Drop your images here..." : "Drag and drop your images here"}
          </p>
          <p className="text-xs text-gray-500">Recommended size: 2160x1080 pixels</p>
          <p className="text-xs text-gray-500">Maximum file size: 10MB per image</p>
          <p className="text-xs text-gray-500">Supported formats: JPEG, PNG</p>
          <p className="text-xs text-gray-500">
            You can upload up to {MAX_IMAGES} images (Currently have {imageFiles.length})
          </p>
        </div>
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={() => setActiveUploadSection(null)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  /**
   * Renders the video upload section
   * @returns {JSX} - Video upload UI
   */
  const renderVideoUploadSection = () => (
    <div className="border-2 border-dashed rounded-lg p-6 mb-4">
      <div
        {...getVideoRootProps()}
        className={`p-8 text-center cursor-pointer transition-colors ${isVideoDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
          }`}
      >
        <input {...getVideoInputProps()} />
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm text-gray-700 font-medium">
            {isVideoDragActive ? "Drop your video here..." : "Drag and drop your video here"}
          </p>
          <p className="text-xs text-gray-500">Minimum resolution: 480p</p>
          <p className="text-xs text-gray-500">Length: up to 1 minute</p>
          <p className="text-xs text-gray-500">Supported formats: MP4, MOV</p>
        </div>
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={() => setActiveUploadSection(null)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )



  // New navigation components to replace the bottom bar
  const FloatingNavigation = () => (
    <div className="fixed bottom-25 right-6 z-50" ref={fabRef}>
      <div className="flex flex-col items-end space-y-3">
        {/* Main FAB button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFabExpanded(!fabExpanded)}
          className={`p-4 rounded-full shadow-lg flex items-center justify-center ${fabExpanded ? "bg-indigo-700" : "bg-indigo-600"
            } text-white`}
        >
          {fabExpanded ? <FiChevronDown size={24} /> : <FiChevronUp size={24} />}
        </motion.button>

        {/* Expanded menu */}
        <AnimatePresence>
          {fabExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {/* Back button */}
              {(currentStep > 0 || publishStep) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handlePrevious()
                    // setFabExpanded(false)
                  }}
                  className="p-3 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700"
                  title="Back"
                >
                  <FiArrowLeft size={20} />
                </motion.button>
              )}



              {/* Next/Continue button */}
              {currentStep < steps.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleNext()
                    // setFabExpanded(false)
                  }}
                  className="p-3 bg-indigo-600 rounded-full shadow-md flex items-center justify-center text-white"
                  title="Continue"
                >
                  <FiArrowRight size={20} />
                </motion.button>
              ) : !publishStep ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleNext()
                    // setFabExpanded(false)
                  }}
                  className="p-3 bg-indigo-600 rounded-full shadow-md flex items-center justify-center text-white"
                  title="Review"
                >
                  <FiArrowRight size={20} />
                </motion.button>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )

  const StepProgressIndicator = () => (
    <div className="fixed top-4 right-4 z-40 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md">
      <div className="flex items-center space-x-1">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${currentStep === index || (index === steps.length - 1 && publishStep)
              ? "bg-indigo-600 w-4"
              : "bg-gray-300"
              }`}
          />
        ))}
      </div>
      <div className="text-xs text-center mt-1 text-gray-600 font-medium">
        Step {publishStep ? steps.length : currentStep + 1} of {steps.length}
      </div>
    </div>
  )

  /**
   * Renders the event preview modal
   * @returns {JSX} - Preview modal UI
   */
  const renderPreviewModal = () => {
    if (!showPreview) return null

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold text-gray-900">Event Preview</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close preview"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content - Scrollable Area */}
          <div className="overflow-y-auto flex-1">
            {/* Hero Section with Media */}
            <div className="relative">
              {/* Main Media Display */}
              {imageFiles.length > 0 ? (
                <div className="relative w-full h-96 bg-gray-100 group">
                  <img
                    src={imageFiles[currentImageIndex].preview || "/placeholder.svg"}
                    alt={`Event preview ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-in-out"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=400&width=800"
                    }}
                  />

                  {/* Image Gallery Controls */}
                  {imageFiles.length > 1 && (
                    <>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {imageFiles.map((_, index) => (
                          <button
                            key={`indicator-${index}`}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === currentImageIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
                              }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) => (prev - 1 + imageFiles.length) % imageFiles.length)
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 p-3 rounded-full hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                        aria-label="Previous image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % imageFiles.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 p-3 rounded-full hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                        aria-label="Next image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              ) : videoFile ? (
                <div className="relative w-full h-96 bg-gray-100">
                  <video src={videoFile.preview} className="w-full h-full object-cover" controls autoPlay muted loop />
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    Video Preview
                  </div>
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Event Details Section */}
            <div className="p-6 md:p-8">
              <div className="max-w-4xl mx-auto">
                {/* Event Title */}
                <h1 className="text-3xl md:text-4xl break-words text-m sm:text-base font-bold mb-6 text-gray-900">{formData.title || "Event Title"}</h1>


                {/* Event Meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Date & Time */}
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-100 p-3 rounded-full flex-shrink-0">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Date & Time</h3>
                      <p className="text-gray-700">
                        {formData.date.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-gray-700">
                        {formData.startTime} - {formData.endTime}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start space-x-4">
                    <div className="bg-emerald-100 p-3 rounded-full flex-shrink-0">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Location</h3>
                      <p className="text-gray-700">{formData.location || "Location not specified"}</p>
                      {formData.location && formData.latitude && formData.longitude && (
                        <button
                          className="text-indigo-600 text-sm font-medium mt-1 flex items-center"
                          onClick={() => {
                            // Open a map view using the coordinates
                            console.log('Coordinates:', formData.latitude, formData.longitude);
                            setShowLocationView(true)
                          }}
                        >
                          View on map
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>
                      )}
                      {showLocationView && (
                        <LocationViewModal
                          onClose={() => setShowLocationView(false)}
                          onSave={(location) => {
                            // setPickedLocation(location)
                            setFormData(prev => ({
                              ...prev,
                              lat: location.lat,
                              lng: location.lng,
                              location: location.placeName

                              // Optionally store the coordinates in the location field if needed
                              // location: `Lat: ${location.lat}, Lng: ${location.lng}`,
                            }))
                          }}
                          initialLngLat={pickedLocation}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${formData.visibility === "public"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-purple-100 text-purple-800"
                      }`}
                  >
                    {formData.visibility === "public" ? "Public" : "Private"} Event
                  </span>
                  {formData.visibility === "private" && (
                    <button className="text-xs text-indigo-600 hover:underline">Copy invite link</button>
                  )}
                </div>

                {/* About Section */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">About this event</h2>
                  <div className="bg-gray-50 p-6 rounded-xl mb-6">
                    <p
                      className={`break-words text-sm sm:text-base ${!formData.summary ? "text-gray-400 italic" : "text-gray-700"}`}
                    >
                      {formData.summary || "Not provided"}
                    </p>
                  </div>
                  <div
                    className={`prose max-w-none break-words text-sm sm:text-base ${!formData.description ? "text-gray-400 italic" : "text-gray-700"
                      }`}
                  >
                    {formData.description ? (
                      <ReactMarkdown>{formData.description}</ReactMarkdown>
                    ) : (
                      <p>No description provided</p>
                    )}
                  </div>
                </div>

                {/* Gallery Section */}
                {imageFiles.length > 1 && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imageFiles.map((file, index) => (
                        <button
                          key={`gallery-${file.id}`}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative group overflow-hidden rounded-lg ${index === currentImageIndex ? "ring-4 ring-indigo-500" : ""
                            }`}
                        >
                          <img
                            src={file.preview || "/placeholder.svg"}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-40 object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Organizer Section */}
                <div className="mb-10 border-t pt-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Organizer</h2>
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full overflow-hidden flex items-center justify-center text-indigo-600 text-xl font-bold">
                      {user?.firstName?.charAt(0) || "O"}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{user?.firstName || "Your Organization"}</h3>
                      <p className="text-gray-600 mb-4">Hosted by your team</p>
                      <div className="flex space-x-4">
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                          Contact
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Ticket Section */}
          <div className="sticky bottom-0 bg-white border-t p-4 shadow-lg">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Starting at</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formData.ticketType === "free" ? "FREE" : `$${formData.ticketPrice || "0.00"}`}
                </p>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-lg text-lg font-medium transition-colors shadow-sm">
                {formData.ticketType === "free" ? "Register Now" : "Get Tickets"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Component Render
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 bg-white rounded-xl shadow-sm">
      {renderPreviewModal()}
      <FloatingNavigation />
      <StepProgressIndicator />
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        {/* Left Sidebar */}
        <div className="w-full lg:w-1/3 space-y-6 lg:sticky lg:top-4 lg:self-start">
          {/* Back button */}
          <Link to="/events-page" className="inline-flex items-center text-indigo-600 font-medium group">
            <svg
              className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="group-hover:underline">Back to events</span>
          </Link>

          {/* Event title and basic info */}
          <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
            <h1 className="text-xl font-bold text-gray-900 line-clamp-2">{formData.title || "Untitled Event"}</h1>

            <div className="flex items-center space-x-2 text-gray-600">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {!formData.date ? "" : formData.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {formData.startTime && ` • ${formData.startTime}`}
              </span>
            </div>

            {/* Registration Expiry */}
            <div className="flex items-center space-x-2 text-gray-600">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">
                {formData.registrationExpiry
                  ? `Registration closes: ${formData.registrationExpiry.toLocaleDateString()}`
                  : "No registration deadline"}
              </span>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-amber-100 text-amber-800">Draft</span>
              <button
                onClick={() => setShowPreview(true)}
                className="text-sm text-indigo-600 hover:underline flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Preview
              </button>
            </div>
          </div>

          {/* Status and actions */}
          {currentStep > 4 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Event Actions</h3>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-lg flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                    Save as Draft
                  </>
                )}
              </button>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          )}

          {/* Steps indicator */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Progress</h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${currentStep === index || (index === steps.length - 1 && publishStep)
                    ? "bg-indigo-50"
                    : "hover:bg-gray-50"
                    }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${currentStep > index || (index === steps.length - 1 && publishStep)
                      ? "bg-indigo-600 text-white"
                      : currentStep === index
                        ? "border-2 border-indigo-600 text-indigo-600"
                        : "border-2 border-gray-300 text-gray-500"
                      }`}
                  >
                    {currentStep > index || (index === steps.length - 1 && publishStep) ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{step}</h3>
                    {currentStep === index && <p className="text-xs text-indigo-600">In progress</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Main Form Content */}
        <div className="w-full lg:w-2/3">
          {/* Animated Form Steps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={publishStep ? "publish" : currentStep}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              {/* Step 0: Overview */}
              {currentStep === 0 && (
                <>
                  {/* Media Upload Section */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Upload photos and video</h2>
                    {errors.media && (
                      <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          {errors.media}
                        </p>
                      </div>
                    )}
                    {activeUploadSection === "image" ? (
                      renderImageUploadSection()
                    ) : activeUploadSection === "video" ? (
                      renderVideoUploadSection()
                    ) : (
                      <>
                        {/* Initial Upload Buttons */}
                        {imageFiles.length === 0 && !videoFile && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <button
                              type="button"
                              onClick={() => setActiveUploadSection("image")}
                              className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors text-center group"
                            >
                              <div className="space-y-3">
                                <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                  <svg
                                    className="w-6 h-6 text-indigo-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <h3 className="text-base font-medium text-gray-900">Upload Images</h3>
                                <p className="text-sm text-gray-500">Up to {MAX_IMAGES} images</p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveUploadSection("video")}
                              className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors text-center group"
                            >
                              <div className="space-y-3">
                                <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                  <svg
                                    className="w-6 h-6 text-indigo-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <h3 className="text-base font-medium text-gray-900">Upload Video</h3>
                                <p className="text-sm text-gray-500">1 video max</p>
                              </div>
                            </button>
                          </div>
                        )}

                        {/* Image Previews */}
                        {imageFiles.length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-base font-medium mb-3 text-gray-900">
                              Event Images ({imageFiles.length}/{MAX_IMAGES})
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {imageFiles.map((file, index) => (
                                <div key={file.id} className="relative aspect-square group">
                                  <img
                                    src={file.preview || "/placeholder.svg"}
                                    alt={`Event preview ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(file.id)}
                                    className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    aria-label="Remove image"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                                    <p className="text-white text-xs truncate">
                                      {file.file?.name || `Image ${index + 1}`}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {/* Add More Images Button */}
                              {imageFiles.length < MAX_IMAGES && (
                                <button
                                  type="button"
                                  onClick={() => setActiveUploadSection("image")}
                                  className="border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors flex flex-col items-center justify-center aspect-square"
                                >
                                  <svg
                                    className="w-8 h-8 text-indigo-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                  <span className="text-sm text-indigo-600 font-medium mt-2">Add Image</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Video Preview */}
                        {videoFile && (
                          <div className="mb-6">
                            <h3 className="text-base font-medium mb-3 text-gray-900">Event Video</h3>
                            <div className="relative group">
                              <video
                                src={videoFile.preview}
                                className="w-full h-64 object-cover rounded-lg border border-gray-200"
                                controls
                              />
                              <button
                                type="button"
                                onClick={handleRemoveVideo}
                                className="absolute top-4 right-4 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                aria-label="Remove video"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-lg">
                                <p className="text-white text-sm truncate">{videoFile.file?.name || "Event Video"}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Add More Media Buttons */}
                        {(imageFiles.length > 0 || videoFile) && (
                          <div className="flex flex-wrap gap-3">
                            {imageFiles.length < MAX_IMAGES && (
                              <button
                                type="button"
                                onClick={() => setActiveUploadSection("image")}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors flex items-center font-medium"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                                Add {imageFiles.length === 0 ? "Images" : "More Images"}
                              </button>
                            )}
                            {!videoFile && (
                              <button
                                type="button"
                                onClick={() => setActiveUploadSection("video")}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors flex items-center font-medium"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                                Add Video
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Event Overview Form */}
                  <div className="border-t pt-6 mt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Event Overview</h2>

                    {/* Event Title */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="event-title" className="text-base font-medium text-gray-900">
                          Event title
                        </label>
                        <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                          Required
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Be clear and descriptive with a title that tells people what your event is about.
                      </p>
                      <div className="relative">
                        <input
                          id="event-title"
                          type="text"
                          placeholder="Enter your event title"
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.title && touched.title ? "border-red-500 bg-red-50" : "border-gray-300"
                            }`}
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          onBlur={() => handleBlur("title")}
                        />
                        {errors.title && touched.title && (
                          <p className="text-sm text-red-600 mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            {errors.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Event Summary */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="event-summary" className="text-base font-medium text-gray-900">
                          Summary
                        </label>
                        <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                          Required
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Grab people's attention with a short description about your event. Attendees will see this at
                        the top of your event page.
                      </p>
                      <div className="relative">
                        <textarea
                          id="event-summary"
                          placeholder="Enter a short summary of your event"
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-24 transition-colors ${errors.summary && touched.summary ? "border-red-500 bg-red-50" : "border-gray-300"
                            }`}
                          value={formData.summary}
                          onChange={handleSummaryChange}
                          onBlur={() => handleBlur("summary")}
                          maxLength={maxSummaryLength}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {errors.summary && touched.summary ? (
                            <p className="text-sm text-red-600 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              {errors.summary}
                            </p>
                          ) : (
                            <span className="text-xs text-gray-500">Min 30 characters</span>
                          )}
                          <span
                            className={`text-xs ${formData.summary.length === maxSummaryLength
                              ? "text-red-500 font-medium"
                              : formData.summary.length > maxSummaryLength * 0.8
                                ? "text-amber-500"
                                : "text-gray-500"
                              }`}
                          >
                            {formData.summary.length} / {maxSummaryLength}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 1: Date and Location */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Event Visibility</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        className={`p-4 border-2 rounded-lg transition-colors ${formData.visibility === "public"
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-300 hover:border-gray-400"
                          }`}
                        onClick={() => setFormData({ ...formData, visibility: "public" })}
                      >
                        <div className="flex items-center mb-2">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${formData.visibility === "public" ? "border-indigo-600 bg-indigo-600" : "border-gray-400"
                              }`}
                          >
                            {formData.visibility === "public" && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">Public Event</span>
                        </div>
                        <div className="text-sm text-gray-600 ml-7">Anyone can find and register for your event</div>
                      </button>
                      <button
                        type="button"
                        className={`p-4 border-2 rounded-lg transition-colors ${formData.visibility === "private"
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-300 hover:border-gray-400"
                          }`}
                        onClick={() => setFormData({ ...formData, visibility: "private" })}
                      >
                        <div className="flex items-center mb-2">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${formData.visibility === "private" ? "border-indigo-600 bg-indigo-600" : "border-gray-400"
                              }`}
                          >
                            {formData.visibility === "private" && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">Private Event</span>
                        </div>
                        <div className="text-sm text-gray-600 ml-7">Only people with the link can register</div>
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Date and Location</h2>

                    {/* Date and Time Selection */}
                    <div className="space-y-4 mb-8">
                      <h3 className="text-base font-medium text-gray-900">Date and time</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <DatePicker
                            selected={formData.date}
                            onChange={(date) => setFormData({ ...formData, date })}
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.date ? "border-red-500 bg-red-50" : "border-gray-300"
                              }`}
                            dateFormat="MMMM d, yyyy"
                            minDate={new Date()}
                            onBlur={() => handleBlur("date")}
                            wrapperClassName="w-full"
                          />
                          {errors.date && (
                            <p className="text-sm text-red-600 mt-1 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              {errors.date}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Start time</label>
                            <input
                              type="time"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              value={formData.startTime}
                              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">End time</label>
                            <input
                              type="time"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              value={formData.endTime}
                              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location Selection */}
                    <div className="space-y-4 mb-8">
                      <h3 className="text-base font-medium text-gray-900">Location</h3>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          Venue address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter venue address"
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.location ? "border-red-500 bg-red-50" : "border-gray-300"
                            }`}
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          onBlur={() => handleBlur("location")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLocationPicker(true)}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Pick Location on Map
                        </button>
                        {showLocationPicker && (
                          <LocationPickerModal
                            onClose={() => setShowLocationPicker(false)}
                            onSave={(location) => {
                              setPickedLocation(location)
                              setFormData(prev => ({
                                ...prev,
                                latitude: location.lat,
                                longitude: location.lng,
                                location: location.placeName

                                // Optionally store the coordinates in the location field if needed
                                // location: `Lat: ${location.lat}, Lng: ${location.lng}`,
                              }))
                            }}
                            initialLngLat={pickedLocation}
                          />
                        )}

                        {errors.location && (
                          <p className="text-sm text-red-600 mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            {errors.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-base font-medium text-gray-900">Registration Deadline</h3>
                      <p className="text-sm text-gray-600">Set when registration should close (optional)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">Date</label>
                          <DatePicker
                            selected={
                              formData.registrationExpiry && !isNaN(new Date(formData.registrationExpiry))
                                ? new Date(formData.registrationExpiry)
                                : null
                            }
                            onChange={(date) => {
                              if (date) {
                                // If we have an existing time, preserve it
                                if (formData.registrationExpiry) {
                                  const oldDate = new Date(formData.registrationExpiry)
                                  const newDate = new Date(date)
                                  newDate.setHours(oldDate.getHours())
                                  newDate.setMinutes(oldDate.getMinutes())
                                  setFormData({ ...formData, registrationExpiry: newDate })
                                } else {
                                  // New date with default time (midnight)
                                  setFormData({ ...formData, registrationExpiry: date })
                                }
                              } else {
                                // Clear the date
                                setFormData({ ...formData, registrationExpiry: null })
                              }
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            dateFormat="MMMM d, yyyy"
                            minDate={new Date()}
                            isClearable
                            placeholderText="No deadline"
                            wrapperClassName="w-full"
                          />
                        </div>
                        {formData.registrationExpiry && (
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Time</label>
                            <input
                              type="time"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              value={
                                formData.registrationExpiry
                                  ? `${String(new Date(formData.registrationExpiry).getHours()).padStart(2, "0")}:${String(new Date(formData.registrationExpiry).getMinutes()).padStart(2, "0")}`
                                  : "00:00"
                              }
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(":")
                                const newDate = new Date(formData.registrationExpiry)
                                newDate.setHours(Number.parseInt(hours))
                                newDate.setMinutes(Number.parseInt(minutes))
                                setFormData({ ...formData, registrationExpiry: newDate })
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Event Details</h2>

                  {/* Event Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="event-description" className="text-base font-medium text-gray-900">
                        Description
                      </label>
                      <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                        Required
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Tell attendees more about your event. You can use markdown formatting.
                    </p>
                    <textarea
                      id="event-description"
                      placeholder="Tell attendees more about your event..."
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-64 ${errors.description ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      onBlur={() => handleBlur("description")}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        {errors.description}
                      </p>
                    )}
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Minimum 50 characters. You can use markdown for formatting.</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 rounded-md">**bold**</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-md">*italic*</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-md"># Heading</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-md">- List item</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Section */}
                  {formData.description && (
                    <div className="mt-6 border-t pt-6">
                      <h3 className="text-base font-medium text-gray-900 mb-3">Description Preview</h3>
                      <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                        <div className="prose max-w-none break-words whitespace-pre-wrap">
                          <ReactMarkdown>{formData.description}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Tickets */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Tickets</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      className={`p-4 rounded-lg text-left transition-colors ${formData.ticketType === "free"
                        ? "border-2 border-indigo-600 bg-indigo-50"
                        : "border-2 hover:border-gray-400"
                        }`}
                      onClick={() => setFormData({ ...formData, ticketType: "free", ticketPrice: "" })}
                    >
                      <div className="flex items-center mb-2">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${formData.ticketType === "free" ? "border-indigo-600 bg-indigo-600" : "border-gray-400"
                            }`}
                        >
                          {formData.ticketType === "free" && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">Free</span>
                      </div>
                      <div className="text-sm text-gray-600 ml-7">No payment required</div>
                    </button>
                    <button
                      type="button"
                      className={`p-4 rounded-lg text-left transition-colors ${formData.ticketType === "paid"
                        ? "border-2 border-indigo-600 bg-indigo-50"
                        : "border-2 hover:border-gray-400"
                        }`}
                      onClick={() => setFormData({ ...formData, ticketType: "paid" })}
                    >
                      <div className="flex items-center mb-2">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${formData.ticketType === "paid" ? "border-indigo-600 bg-indigo-600" : "border-gray-400"
                            }`}
                        >
                          {formData.ticketType === "paid" && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">Paid</span>
                      </div>
                      <div className="text-sm text-gray-600 ml-7">Collect payment</div>
                    </button>
                  </div>

                  {/* Ticket Price (if paid) */}
                  {formData.ticketType === "paid" && (
                    <div className="mt-6 p-5 bg-indigo-50 rounded-lg border border-indigo-100">
                      <label className="block text-base font-medium mb-2 text-gray-900">
                        Ticket Price ($) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          className={`w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.ticketPrice ? "border-red-500 bg-red-50" : "border-gray-300"
                            }`}
                          value={formData.ticketPrice}
                          onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                          onBlur={() => handleBlur("ticketPrice")}
                          min="0"
                          step="0.01"
                        />
                        {errors.ticketPrice && (
                          <p className="text-sm text-red-600 mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            {errors.ticketPrice}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Enter the price per ticket. You'll be able to create different ticket tiers after publishing.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {(currentStep === steps.length - 1 || publishStep) && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Review Your Event</h2>
                  <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 space-y-4">
                    <div className="flex items-center text-indigo-700 mb-2">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="font-medium">Final Review</h3>
                    </div>

                    {/* Responsive Grid Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-5 rounded-lg border border-indigo-100">
                      {/* Title */}
                      <div className="sm:col-span-2">
                        <h4 className="font-medium text-gray-700 mb-1">Title</h4>
                        <p
                          className={`break-words text-base ${!formData.title ? "text-gray-400 italic" : "text-gray-900"}`}
                        >
                          {formData.title || "Not provided"}
                        </p>
                      </div>

                      {/* Summary */}
                      <div className="sm:col-span-2">
                        <h4 className="font-medium text-gray-700 mb-1">Summary</h4>
                        <p
                          className={`break-words text-base ${!formData.summary ? "text-gray-400 italic" : "text-gray-900"}`}
                        >
                          {formData.summary || "Not provided"}
                        </p>
                      </div>

                      {/* Date & Time */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Date & Time</h4>
                        <p className="text-gray-900">
                          {formData.date.toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          <br />
                          {formData.startTime} - {formData.endTime}
                        </p>
                      </div>

                      {/* Location */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Location</h4>
                        <p
                          className={`break-words text-base ${!formData.location ? "text-gray-400 italic" : "text-gray-900"}`}
                        >
                          {formData.location || "No location specified"}
                        </p>
                      </div>

                      {/* Ticket Type */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Ticket Type</h4>
                        <p className="text-gray-900">
                          {formData.ticketType === "free" ? (
                            <span className="text-emerald-600 font-medium">Free</span>
                          ) : (
                            <span>
                              Paid - <span className="font-medium">${formData.ticketPrice || "0.00"}</span>
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Visibility */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Visibility</h4>
                        <p className="text-gray-900 capitalize">
                          {formData.visibility}
                          {formData.visibility === "private" && (
                            <span className="text-xs ml-2 text-gray-500">(Invite only)</span>
                          )}
                        </p>
                      </div>

                      {/* Description (full width) */}
                      <div className="sm:col-span-2">
                        <h4 className="font-medium text-gray-700 mb-1">Description</h4>
                        <div
                          className={`prose max-w-none break-words text-base ${!formData.description ? "text-gray-400 italic" : "text-gray-900"
                            }`}
                        >
                          {formData.description ? (
                            <ReactMarkdown>{formData.description}</ReactMarkdown>
                          ) : (
                            <p>No description provided</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Media Section */}
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Media</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {imageFiles.length} image(s) and {videoFile ? "1 video" : "0 videos"} uploaded
                      </p>
                      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-lg border border-indigo-100">
                        {imageFiles.map((file, index) => (
                          <div key={`preview-${file.id}`} className="relative w-16 h-16 sm:w-20 sm:h-20">
                            <img
                              src={file.preview || "/placeholder.svg"}
                              alt={`Event preview ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg border border-gray-200"
                            />
                            <span className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                        {videoFile && (
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                            <video
                              src={videoFile.preview}
                              className="w-full h-full object-cover rounded-lg border border-gray-200"
                            />
                            <span className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg">
                              Video
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Call to Action */}
                    <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <h4 className="font-semibold text-emerald-800 text-base mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Almost done!
                      </h4>
                      <p className="text-emerald-700 text-sm">
                        Click "Save as Draft" to save your event. You can edit it later before publishing.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>


        </div>
      </div>
    </div>
  )
}

export default CreateEvent
