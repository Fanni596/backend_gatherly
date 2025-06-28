"use client"

import { useState, useEffect, useContext } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaTicketAlt,
  FaShareAlt,
  FaBookmark,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaEdit,
  FaCog,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaLink,
  FaWhatsapp,
  FaUserFriends,
  FaPhone,
  FaEnvelope,
  FaArrowLeft,
  FaRegBookmark,
  FaRegHeart,
  FaHeart,
  FaMapMarkedAlt,
  FaRegClock,
  FaUserCircle,
  FaRegCalendarAlt,
  FaRegStar,
  FaRegCheckCircle
} from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import eventService from "../../../Services/eventServices"
import AttendeeeventViewService from "../../../Services/AttendeeeventViewServices"
import listService from "../../../Services/listServices"
import { AuthContext }  from "../../../Contexts/authContext"
import LocationViewModal from "../../../Components/Global/LocationViewModal"
import ReactMarkdown from "react-markdown"
import feedbackService from "../../../Services/feedbackService"

const VITE_API_IMG_BASE_URL = import.meta.env.VITE_API_IMG_BASE_URL; // Replace with your actual API URL
// Loader component with improved animation
const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin"></div>
        <div className="mt-4 text-indigo-600 font-medium">Loading event details...</div>
      </div>
    </div>
  )
}
const formatDateTime = (date) => {
  const pad = (n) => n.toString().padStart(2, "0")
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  )
}
// Enhanced ImageGallery component
const ImageGallery = ({ images, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrev = (e) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = (e) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative h-[28rem] w-full rounded-2xl overflow-hidden group">
      {/* Main image */}
      <div
        className="h-full w-full bg-gray-100 cursor-pointer transition-transform duration-500 hover:scale-105"
        onClick={() => onImageClick(currentIndex)}
      >
        <img
          src={VITE_API_IMG_BASE_URL + images[currentIndex].file_path}
          alt={`Event ${currentIndex + 1}`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-3 rounded-full hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
            aria-label="Previous image"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-3 rounded-full hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
            aria-label="Next image"
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Thumbnail indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2 transition-opacity duration-300">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentIndex ? "bg-white w-6" : "bg-white/60 hover:bg-white/80"
                }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image counter */}
      <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}

// Enhanced VideoPlayer component
const VideoPlayer = ({ video }) => {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="mb-6 group">
      <div className="relative w-full rounded-xl overflow-hidden bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md">
        <video
          controls
          className="w-full aspect-video object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={VITE_API_IMG_BASE_URL + `/${video.file_path}`} type={video.type} />
          Your browser does not support the video tag.
        </video>
        {!isPlaying && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        )}
      </div>
      <p className="mt-3 text-gray-700 font-medium">{video.name || "Event Video"}</p>
    </div>
  )
}

// Enhanced ShareModal component
const ShareModal = ({ isOpen, onClose, url, title }) => {
  if (!isOpen) return null

  const sharePlatforms = [
    {
      name: "Facebook",
      icon: <FaFacebook className="text-[#1877F2] text-2xl" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      bgColor: "bg-blue-50",
    },
    {
      name: "Twitter",
      icon: <FaTwitter className="text-[#1DA1F2] text-2xl" />,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      bgColor: "bg-blue-50",
    },
    {
      name: "LinkedIn",
      icon: <FaLinkedin className="text-[#0A66C2] text-2xl" />,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      bgColor: "bg-blue-50",
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp className="text-[#25D366] text-2xl" />,
      url: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      bgColor: "bg-green-50",
    },
  ]

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard!")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Share this event</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {sharePlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center p-4 rounded-xl ${platform.bgColor} hover:shadow-md transition-all duration-300 transform hover:-translate-y-1`}
                aria-label={`Share on ${platform.name}`}
              >
                {platform.icon}
                <span className="mt-2 text-sm font-medium text-gray-800">{platform.name}</span>
              </a>
            ))}
          </div>

          <div className="flex">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 border border-gray-300 rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-700"
            />
            <button
              onClick={copyToClipboard}
              className="bg-indigo-600 text-white px-4 py-3 rounded-r-lg hover:bg-indigo-700 transition-colors flex items-center font-medium"
            >
              <FaLink className="mr-2 h-4 w-4" /> Copy
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Main EventView component
const AttendeeEventView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [event, setEvent] = useState(null)
  const [media, setMedia] = useState({ images: [], videos: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [showAttendeeModal, setShowAttendeeModal] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showLocationView, setShowLocationView] = useState(false)
  const [pickedLocation, setPickedLocation] = useState({ lng: 67.0011, lat: 24.8607 })
  // Define state variables for conditional logic
  const [canRegister, setCanRegister] = useState(false)
  const [isRegistrationExpired, setIsRegistrationExpired] = useState(false)
  const [attendeeRegistrationStatus, setAttendeeRegistrationStatus] = useState(null)
  const [totalAttendees, setTotalAttendees] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
const { attendeeUser } = useContext(AuthContext) || {};
  const [feedback, setFeedback] = useState([]);
const [averageRating, setAverageRating] = useState(0);
const [totalFeedback, setTotalFeedback] = useState(0);
const [loadingFeedback, setLoadingFeedback] = useState(false);
const [feedbackError, setFeedbackError] = useState(null);

// Add this component inside the EventView component
const FeedbackSection = () => {
  if (loadingFeedback) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (feedbackError) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
        {feedbackError}
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="text-center py-8">
        <FaRegStar className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <p className="text-gray-500">No feedback yet for this event</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Event Feedback</h3>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Average Rating</p>
            <div className="flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-500 ml-1">/5</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Reviews</p>
            <p className="text-2xl font-bold text-gray-900">{totalFeedback}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {feedback.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                {item.attendeeName?.charAt(0) || "A"}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    {item.attendeeName || "Anonymous"}
                  </h4>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FaRegStar
                        key={i}
                        className={`h-4 w-4 ${i < item.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {item.comment && (
                  <p className="mt-3 text-gray-700">{item.comment}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Add this useEffect to fetch feedback data
useEffect(() => {
  const fetchFeedback = async () => {
    try {
      setLoadingFeedback(true);
      const feedbackData = await feedbackService.getEventFeedback(id);
      setFeedback(feedbackData.feedback || []);
      setAverageRating(feedbackData.stats?.averageRating || 0);
      setTotalFeedback(feedbackData.stats?.totalFeedback || 0);
    } catch (err) {
      setFeedbackError(err.message || "Failed to load feedback");
      console.error("Error fetching feedback:", err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  fetchFeedback();
}, [id]);
  // Add this helper function inside the EventView component
  const extractScheduleFromDescription = (description) => {
    if (!description) return []

    // Look for a schedule section in the description
    const scheduleMatch = description.match(/## Event Schedule\s*\n([\s\S]*?)(\n##|$)/)

    if (!scheduleMatch) return []

    // Parse the schedule items
    const scheduleText = scheduleMatch[1]
    const scheduleItems = scheduleText
      .split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => {
        // Extract time and activity from format like "- **10:00** - Registration"
        const match = line.match(/- \*\*(.*?)\*\* - (.*)/)
        if (match) {
          return {
            time: match[1],
            activity: match[2],
          }
        }
        return null
      })
      .filter((item) => item !== null)

    return scheduleItems
  }
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)

        // Fetch event and media in parallel
        const [eventData, mediaData] = await Promise.all([
          AttendeeeventViewService.getEventById(id),
          AttendeeeventViewService.getEventMedia(id),
        ])
        const response = await AttendeeeventViewService.checkRegistrationStatus(id);
        setAttendeeRegistrationStatus(response);
        console.log(response)
        const response2 = await AttendeeeventViewService.getEventAttendeeLists(id);
        console.log(response2)
        if (response2?.length > 0) {
          const totalAttendees = await AttendeeeventViewService.getEventAttendeesStatistics(response2[0].Id);
        setTotalAttendees(totalAttendees.totalAllowedPeople)

              }
        setEvent(eventData) // Assuming API returns array
        console.log(eventData)

        setPickedLocation({ lng: eventData.longitude, lat: eventData.latitude })

        // Process media data
        const processedMedia = {
          images: mediaData.images || [],
          videos: mediaData.videos || [],
        }
        setMedia(processedMedia)
        // Determine registration status
        if (eventData.registration_expiry) {
          const expiryDate = new Date(eventData.registration_expiry)
          const n = new Date()
          setIsRegistrationExpired(expiryDate < n)
          setCanRegister(!expiryDate < n)
        } else {
          setCanRegister(true) // If no expiry, registration is always open
        }

        setLoading(false)
      } catch (err) {
        setError(err.message || "Failed to load event")
        setLoading(false)
        toast.error(err.message || "Failed to load event")
      }
    }

    fetchEventData()
  }, [id, user])

  const handleImageClick = (index) => {
    setCurrentImageIndex(index)
    setShowImageModal(true)
  }

  const handlePrevImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? media.images.length - 1 : prev - 1))
  }

  const handleNextImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === media.images.length - 1 ? 0 : prev + 1))
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

const handleSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      // Call API to toggle save status
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/AttendeeEvents/${event.id}/save`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update saved status")
      }

      const data = await response.json()
      setIsSaved(data.isSaved)
      toast.success(data.isSaved ? "Added to saved events" : "Removed from saved events")
    } catch (error) {
      if (error.message.includes("sign in")) {
        toast.error("Please sign in to save events")
      } else {
        toast.error(error.message || "Failed to update saved status")
      }
    }
  }

const handleLike = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      // Call API to toggle like status
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/AttendeeEvents/${event.id}/like`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update like status")
      }

      const data = await response.json()
      setIsLiked(data.isLiked)
      setLikeCount(data.likeCount)
      toast.success(data.isLiked ? "Added to liked events" : "Removed from liked events")
    } catch (error) {
      if (error.message.includes("sign in")) {
        toast.error("Please sign in to like events")
      } else {
        toast.error(error.message || "Failed to update like status")
      }
    }
  }

  const formatDate = (dateString) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("en-US", options)
  }

  const formatTime = (timeString) => {
    if (!timeString) return ""
    const time = new Date(`1970-01-01T${timeString}`)
    return time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">Published</span>
        )
      case "draft":
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded-full">Draft</span>
      case "cancelled":
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full">Cancelled</span>
      default:
        return null
    }
  }

  const handleEditEvent = () => {
    navigate(`/events/edit/${id}`)
  }

  const handleManageEvent = () => {
    navigate(`/events/manage/${id}`)
  }

  // const handleViewAttendees = () => {
  //   setShowAttendeeModal(true)
  // }

  const handleRegister = () => {
    console.log("Registering for event:", canRegister, isRegistrationExpired)
    navigate(`/attendee/events/${id}/register`)
  }

  if (loading) {
    return <Loader />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 text-red-600 p-3 rounded-full inline-flex mb-6">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Event</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium inline-flex items-center"
          >
            <FaArrowLeft className="mr-2" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="bg-gray-100 text-gray-600 p-3 rounded-full inline-flex mb-6">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or may have been removed.</p>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium inline-flex items-center"
          >
            <FaArrowLeft className="mr-2" />
            Browse Events
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />

      {/* Image modal */}
      <AnimatePresence>
        {showImageModal && media.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl w-full max-h-screen"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-300 bg-black/30 p-2 rounded-full"
                aria-label="Close"
              >
                <FaTimes />
              </button>

              <div className="relative h-full">
                <img
                  src={VITE_API_IMG_BASE_URL + `/${media.images[currentImageIndex].file_path}`}
                  alt={`Event ${currentImageIndex + 1}`}
                  className="max-w-full max-h-[85vh] mx-auto object-contain rounded-lg"
                />

                {media.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-3 rounded-full hover:bg-white transition-all duration-200 shadow-lg"
                      aria-label="Previous image"
                    >
                      <FaChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-3 rounded-full hover:bg-white transition-all duration-200 shadow-lg"
                      aria-label="Next image"
                    >
                      <FaChevronRight className="h-6 w-6" />
                    </button>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                      {media.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentImageIndex(index)
                          }}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentImageIndex ? "bg-white w-6" : "bg-white/60 hover:bg-white/80"
                            }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={window.location.href}
        title={event.title}
      />

      {/* Attendee list modal */}
      {/* <AttendeeListModal isOpen={showAttendeeModal} onClose={() => setShowAttendeeModal(false)} event={event} /> */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center text-gray-600 hover:text-indigo-600 mb-8 transition-colors"
        >
          <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back to Events</span>
        </button>

        {/* Event header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{event.title}</h1>
              {getStatusBadge(event.status)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-gray-600">
              <span className="flex items-center font-medium text-gray-700">{event.organizer_name}</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center">
                <FaRegCalendarAlt className="mr-1.5 h-4 w-4 text-gray-500" />
                {formatDate(event.start_date)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleShare}
              className="flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <FaShareAlt className="mr-2 h-4 w-4" /> Share
            </button>
          </div>
        </div>

        {/* Organizer-only section */}
        {isOrganizer && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
              <FaUserCircle className="mr-2 h-5 w-5" />
              Organizer Dashboard
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 mb-1">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{event.views || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 mb-1">Bookmarks</p>
                <p className="text-2xl font-bold text-gray-900">{event.bookmarks || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{event.status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image gallery */}
            {media.images.length > 0 ? (
              <ImageGallery images={media.images} onImageClick={handleImageClick} />
            ) : (
              <div className="bg-gray-100 h-64 rounded-xl flex items-center justify-center">
                <span className="text-gray-400">No images available</span>
              </div>
            )}

            {/* Event details */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FaRegCalendarAlt className="mr-2 h-5 w-5 text-indigo-600" />
                  Event Details
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                    <FaCalendarAlt className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-gray-900 font-medium">{formatDate(event.start_date)}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                    <FaClock className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Time</p>
                    <p className="text-gray-900 font-medium">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                    <FaMapMarkerAlt className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-gray-900 font-medium">{event.location || "Online"}</p>
                    {event.latitude && event.longitude && (
                      <button className="text-indigo-600 text-sm mt-1 hover:text-indigo-700 hover:underline flex items-center"
                        onClick={() => {
                          // Open a map view using the coordinates
                          setShowLocationView(true)
                        }}
                      >
                        <FaMapMarkedAlt className="mr-1 h-3.5 w-3.5" />
                        View on map
                      </button>
                    )}
                    {showLocationView && (
                      <LocationViewModal
                        onClose={() => setShowLocationView(false)}
                        initialLngLat={pickedLocation}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                    <FaUsers className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Capacity</p>
                    <p className="text-gray-900 font-medium">
                      {event.capacity ? `${event.capacity} people` : "Unlimited"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                    <FaTicketAlt className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Ticket Type</p>
                    <p className="text-gray-900 font-medium">
                      {event.ticket_type === "paid" ? `Paid - ${event.ticket_price} ${event.currency}` : "Free"}
                    </p>
                  </div>
                </div>

                {event.registration_expiry && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                      <FaRegClock className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Registration Deadline</p>
                      <p className="text-gray-900 font-medium">{formatDate(event.registration_expiry)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Event Schedule */}
            {extractScheduleFromDescription(event.description).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <FaClock className="mr-2 h-5 w-5 text-indigo-600" />
                    Event Schedule
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {extractScheduleFromDescription(event.description).map((item, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                          <FaClock className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">{item.time}</p>
                          <p className="text-gray-900 font-medium">{item.activity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden break-words">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Description</h2>
              </div>
              <div className="p-6">
                {event.description ? (
                  <div className="prose max-w-none text-gray-700">
                    <ReactMarkdown>{event.description}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No description provided.</p>
                )}
              </div>
            </div>


            {/* Videos */}
            {media.videos.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Videos</h2>
                </div>
                <div className="p-6 space-y-6">
                  {media.videos.map((video, index) => (
                    <VideoPlayer key={`video-${index}`} video={video} />
                  ))}
                </div>
              </div>
            )}

            {/* Organizer info */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">About the Organizer</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                    {event.organizer_name?.charAt(0) || "O"}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-gray-900">{event.organizer_name}</h3>
                    <p className="text-gray-600">{event.organizer_email}</p>
                  </div>
                </div>
              </div>
            </div>
                        {/* // Add this after the Organizer info section in the left column */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FaRegStar className="mr-2 h-5 w-5 text-indigo-600" />
                  Attendee Feedback
                </h2>
              </div>
              <div className="p-6">
                <FeedbackSection />
              </div>
            </div>
          </div>

          {/* Right column (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden mb-6"
              >
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Registration</h2>
                </div>
                <div className="p-6">
                  {isOrganizer ? (
                    <>
                      <div className="mb-6">
                        <p className="text-lg font-medium text-gray-700">Organizer Tools</p>
                      </div>
                      <button
                        onClick={handleViewAttendees}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm mb-3 flex items-center justify-center"
                      >
                        <FaUserFriends className="mr-2 h-4 w-4" />
                        View Attendees
                      </button>
                  
                    </>
                  ) : (
                    <>
                      {isRegistrationExpired && !(attendeeRegistrationStatus.isPaid || (attendeeRegistrationStatus.isConfirmed && event.ticket_type === "free")) ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <p className="text-red-700 font-medium">Registration closed</p>
                          <p className="text-red-600 text-sm mt-1">
                            Registration ended on {formatDate(event.registration_expiry)}
                          </p>
                        </div>
                      ) : (
                        <>
                          {isRegistrationExpired && <p className="text-red-700 font-medium">Registration closed on {formatDate(event.registration_expiry)}</p>}
                          {event.ticket_type === "paid" ? (
                            <div className="mb-6">
                              <p className="text-3xl font-bold text-gray-900 mb-1">
                                {event.ticket_price} {event.currency}
                              </p>
                              <p className="text-gray-500 text-sm">Per ticket</p>
                            </div>
                          ) : (
                            <div className="mb-6">
                              <p className="text-3xl font-bold text-emerald-600 mb-1">Free</p>
                              <p className="text-gray-500 text-sm">No payment required</p>
                            </div>
                          )}

                                  {attendeeUser ? (
                                    <>
                          {/* Dynamic Registration Message */}
                          {attendeeRegistrationStatus.isRegistered && attendeeRegistrationStatus.isInvited ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                              <p className="text-green-700 font-medium">You are registered for this event!</p>
                              <p className="text-green-600 text-sm mt-1">
                                {attendeeRegistrationStatus.isInvited
                                  ? "You have been invited to this event."
                                  : "You are registered for this event."}
                                {attendeeRegistrationStatus.isConfirmed
                                  ? "Your registration is confirmed."
                                  : "Please check your email for confirmation details."}

                                {attendeeRegistrationStatus.isPaid && event.ticket_type === "paid"
                                  ? " Your payment has been received."
                                  : " Payment is required to confirm your registration."}
                              </p>
                            </div>
                          ) : canRegister ? (
                            <p className="text-gray-500 mb-4">
                              Click the button below to register for this event.
                            </p>
                          ) : (
                            <p className="text-gray-500 mb-4">
                              Registration not currently available.
                            </p>
                          )}
                          {/* Registration Button */}
                          <button
                            onClick={() =>
                              handleRegister()
                            }
                            disabled={isRegistrationExpired && !(attendeeRegistrationStatus.isPaid || (attendeeRegistrationStatus.isConfirmed && event.ticket_type === "free"))}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 px-4 rounded-lg transition-colors shadow-sm mb-4"
                          >
                            <span className="flex items-center justify-center">
                              <FaRegCheckCircle className="mr-2 h-4 w-4" />
                              {attendeeRegistrationStatus.isRegistered && attendeeRegistrationStatus.isConfirmed && attendeeRegistrationStatus.isPaid ? "Registered" : ""}
                              {attendeeRegistrationStatus.isRegistered && attendeeRegistrationStatus.isConfirmed && event.ticket_type === "free" ? "Registered" : ""}
                              {attendeeRegistrationStatus.isRegistered && attendeeRegistrationStatus.isInvited && !attendeeRegistrationStatus.isConfirmed && !attendeeRegistrationStatus.isPaid ? "Confirm Registration" : ""}
                              {attendeeRegistrationStatus.isRegistered && !attendeeRegistrationStatus.isInvited && !attendeeRegistrationStatus.isConfirmed && !attendeeRegistrationStatus.isPaid ? "Register" : ""}
                              {attendeeRegistrationStatus.isRegistered && attendeeRegistrationStatus.isConfirmed && !attendeeRegistrationStatus.isPaid && event.ticket_type === "paid" ? "Confirm Payment" : ""}
                              {!attendeeRegistrationStatus.isRegistered && canRegister ? "Register Now" : ""}
                              {!attendeeRegistrationStatus.isRegistered && canRegister && totalAttendees >= event.capacity ? "Registration Closed - Event Full" : ""}
                              {!attendeeRegistrationStatus.isRegistered && !canRegister ? "Registration Closed" : ""}
                            </span>
                          </button>
                            </>
                          
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                <p className="text-gray-700 font-medium">No User Found</p>
                                <p className="text-gray-600 text-sm mt-1">
                                  Please log in to register for this event.
                                  <button>
                                    <Link to="/attendee/login" className="text-indigo-600 hover:underline ml-1">
                                      Log In
                                    </Link>
                                  </button>
                                </p>
                              </div>
                            )
                          
                          }




                          <div className="text-center text-sm text-gray-500">

                          {event.capacity - totalAttendees < 0 && (
                            <p className="flex items-center justify-center">
                              <FaUsers className="mr-1.5 h-4 w-4 text-gray-400" />
                              <p className="ml-1 text-gray-500">{-(event.capacity - totalAttendees)} Extra Attendees Added By Organizer</p>
                            </p>
                          )}
                          </div>
                          {/* Capacity */}
                          <div className="text-center text-sm text-gray-500">
                            {event.capacity - totalAttendees < 0 ? (
                              <p className="flex items-center justify-center">
                                <FaUsers className="mr-1.5 h-4 w-4 text-gray-400" />
                                Total 0 out of {event.capacity} spots available
                                {totalAttendees >= event.capacity ? " - Event Full" : ""}
                              </p>
                            ) : (
                              <p className="flex items-center justify-center">
                                <FaUsers className="mr-1.5 h-4 w-4 text-gray-400" />
                                Total {event.capacity - totalAttendees} out of {event.capacity} spots available
                                {totalAttendees >= event.capacity ? " - Event Full" : ""}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </motion.div>



              {/* Additional info card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Event Information</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Event Type</p>
                      <p className="text-gray-900 font-medium capitalize">{event.event_type || "Standard"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Visibility</p>
                      <p className="text-gray-900 font-medium capitalize">{event.visibility || "Public"}</p>
                    </div>
                    {event.tags && event.tags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {event.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Created On</p>
                      <p className="text-gray-900 font-medium">{formatDate(event.created_at || event.start_date)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AttendeeEventView
