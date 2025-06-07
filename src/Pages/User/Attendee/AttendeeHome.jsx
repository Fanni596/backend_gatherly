"use client"

import { useState, useEffect, useCallback, useContext } from "react"
import { Link } from "react-router-dom"
import { AuthContext } from "../../../Contexts/authContext"
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaSearch,
  FaFilter,
  FaArrowRight,
  FaRegBookmark,
  FaBookmark,
  FaRegHeart,
  FaHeart,
  FaSpinner,
  FaTicketAlt,
  FaUserFriends,
  FaChevronLeft,
  FaChevronRight,
  FaGlobe,
  FaStar,
  FaCheckCircle,
} from "react-icons/fa"
import { toast } from "react-toastify"
import eventViewService from "../../../Services/eventViewServices"
import { motion, AnimatePresence } from "framer-motion"
const VITE_API_IMG_BASE_URL = import.meta.env.VITE_API_IMG_BASE_URL; // Replace with your actual API URL

// Event Card Component
const EventCard = ({ event, featured = false }) => {
  const [isSaved, setIsSaved] = useState(event.is_saved || false)
  const [isLiked, setIsLiked] = useState(event.is_liked || false)
  const [likeCount, setLikeCount] = useState(event.like_count || 0)
  const formatDate = (dateString) => {
    const options = { weekday: "short", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString("en-US", options)
  }

  const formatTime = (timeString) => {
    if (!timeString) return ""
    const time = new Date(`1970-01-01T${timeString}`)
    return time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
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

  return (
    <Link to={`/events/${event.id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all h-full border ${featured ? "border-indigo-200" : "border-gray-100"}`}
      >
        {/* {console.log(`https://localhost:7255/${event.thumbnail.file_path}`)} */}
        <div className="relative h-48 bg-gray-200">
          {event.thumbnail ? (
            <img
              src={VITE_API_IMG_BASE_URL + `/${event.thumbnail.file_path}`}
              alt={event.title}
              className="w-full h-full object-cover"
              // onError={(e) => {
              //   e.target.onerror = null
              //   e.target.src = "/placeholder.svg?height=192&width=384"
              // }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400">
              <FaCalendarAlt className="h-12 w-12" />
            </div>
          )}

          {featured && (
            <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm flex items-center">
              <FaStar className="mr-1" /> Featured
            </div>
          )}

          <div className="absolute top-3 right-3 flex space-x-2">
            <button
              onClick={handleSave}
              className={`p-2 rounded-full ${
                isSaved ? "bg-indigo-600 text-white" : "bg-white/90 text-gray-700 hover:bg-white"
              } transition-colors shadow-sm`}
              aria-label={isSaved ? "Unsave event" : "Save event"}
            >
              {isSaved ? <FaBookmark className="h-4 w-4" /> : <FaRegBookmark className="h-4 w-4" />}
            </button>
            <button
              onClick={handleLike}
              className={`p-2 rounded-full ${
                isLiked ? "bg-pink-600 text-white" : "bg-white/90 text-gray-700 hover:bg-white"
              } transition-colors shadow-sm flex items-center`}
              aria-label={isLiked ? "Unlike event" : "Like event"}
            >
              {isLiked ? <FaHeart className="h-4 w-4" /> : <FaRegHeart className="h-4 w-4" />}
              {likeCount > 0 && <span className="ml-1 text-xs">{likeCount}</span>}
            </button>
          </div>

          {event.ticket_type === "paid" && (
            <div className="absolute bottom-3 left-3 bg-white/90 text-indigo-600 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm flex items-center">
              <FaTicketAlt className="mr-1" />
              {event.ticket_price} {event.currency}
            </div>
          )}

          {event.ticket_type === "free" && (
            <div className="absolute bottom-3 left-3 bg-green-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm flex items-center">
              <FaTicketAlt className="mr-1" />
              FREE
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <FaCalendarAlt className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
            <span>{formatDate(event.start_date)}</span>
            <span className="mx-1.5">•</span>
            <FaClock className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
            <span>{formatTime(event.start_time)}</span>
          </div>

          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-lg">{event.title}</h3>

          <div className="flex items-center text-sm text-gray-500 mb-3">
            <FaMapMarkerAlt className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
            <span className="truncate">{event.location || "Online Event"}</span>
          </div>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {event.summary || event.description?.substring(0, 100) + "..."}
          </p>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 flex items-center">
              <FaUserFriends className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
              <span>{event.capacity ? `${event.capacity} spots` : "Unlimited"}</span>
            </div>

            <div className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
              <span>View Details</span>
              <FaArrowRight className="ml-1 h-3 w-3" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// Filter Component
const EventFilters = ({ filters, setFilters, onApply }) => {
  const [localFilters, setLocalFilters] = useState({ ...filters })

  const handleChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    setFilters(localFilters)
    onApply()
  }

  const handleReset = () => {
    const resetFilters = {
      category: "",
      date: "",
      price: "",
      location: "",
    }
    setLocalFilters(resetFilters)
    setFilters(resetFilters)
    onApply()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 flex items-center">
          <FaFilter className="mr-2 h-4 w-4 text-indigo-600" />
          Filters
        </h3>
        <button onClick={handleReset} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={localFilters.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="conference">Conference</option>
            <option value="workshop">Workshop</option>
            <option value="webinar">Webinar</option>
            <option value="networking">Networking</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <select
            value={localFilters.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Any Date</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this-week">This Week</option>
            <option value="this-weekend">This Weekend</option>
            <option value="next-week">Next Week</option>
            <option value="this-month">This Month</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <select
            value={localFilters.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Any Price</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={localFilters.location}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="Enter location"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleApply}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
        >
          Apply Filters
        </button>
      </div>
    </motion.div>
  )
}

// Loader Component
const Loader = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="h-12 w-12 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin"></div>
    <p className="mt-4 text-indigo-600 font-medium">{message}</p>
  </div>
)

// Hero Section Component
const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-r from-indigo-700 to-indigo-500 text-white overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Discover Amazing Events Near You</h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-8">
            Find and attend events that match your interests, connect with like-minded people, and create unforgettable
            memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/events"
              className="bg-white text-indigo-700 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition-colors shadow-md inline-flex items-center justify-center"
            >
              <FaSearch className="mr-2 h-5 w-5" />
              Browse Events
            </Link>
            <Link
              to="/create-event"
              className="bg-indigo-800 text-white hover:bg-indigo-900 font-bold py-3 px-6 rounded-lg transition-colors shadow-md inline-flex items-center justify-center"
            >
              <FaCalendarAlt className="mr-2 h-5 w-5" />
              Create Event
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-indigo-800 opacity-20"></div>
      <div className="absolute top-16 -right-16 w-32 h-32 rounded-full bg-indigo-400 opacity-20"></div>
    </div>
  )
}

// Categories Section Component
const CategoriesSection = () => {
  const categories = [
    {
      id: 1,
      name: "Conferences",
      icon: "🎤",
      color: "bg-blue-100",
      textColor: "text-blue-800",
      hoverColor: "hover:bg-blue-200",
    },
    {
      id: 2,
      name: "Workshops",
      icon: "🛠️",
      color: "bg-green-100",
      textColor: "text-green-800",
      hoverColor: "hover:bg-green-200",
    },
    {
      id: 3,
      name: "Webinars",
      icon: "💻",
      color: "bg-purple-100",
      textColor: "text-purple-800",
      hoverColor: "hover:bg-purple-200",
    },
    {
      id: 4,
      name: "Networking",
      icon: "🤝",
      color: "bg-yellow-100",
      textColor: "text-yellow-800",
      hoverColor: "hover:bg-yellow-200",
    },
    {
      id: 5,
      name: "Social",
      icon: "🎉",
      color: "bg-pink-100",
      textColor: "text-pink-800",
      hoverColor: "hover:bg-pink-200",
    },
    {
      id: 6,
      name: "Sports",
      icon: "⚽",
      color: "bg-red-100",
      textColor: "text-red-800",
      hoverColor: "hover:bg-red-200",
    },
    {
      id: 7,
      name: "Arts",
      icon: "🎨",
      color: "bg-indigo-100",
      textColor: "text-indigo-800",
      hoverColor: "hover:bg-indigo-200",
    },
    {
      id: 8,
      name: "Food",
      icon: "🍽️",
      color: "bg-orange-100",
      textColor: "text-orange-800",
      hoverColor: "hover:bg-orange-200",
    },
  ]

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover events that match your interests. From professional conferences to social gatherings, find what
            excites you.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Link
                to={`/categories/${category.name.toLowerCase()}`}
                className={`${category.color} ${category.textColor} ${category.hoverColor} rounded-xl p-6 text-center hover:shadow-md transition-all flex flex-col items-center h-full`}
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-bold">{category.name}</h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Testimonials Section
const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Event Attendee",
      image: "/placeholder.svg?height=80&width=80",
      quote:
        "I've discovered so many amazing events through this platform. The interface is intuitive and finding events that match my interests is incredibly easy!",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Event Organizer",
      image: "/placeholder.svg?height=80&width=80",
      quote:
        "As an event organizer, I've been able to reach a much wider audience. The tools provided make managing attendees and tickets a breeze.",
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "Community Manager",
      image: "/placeholder.svg?height=80&width=80",
      quote:
        "The platform has transformed how we connect with our community. We've seen a 40% increase in event attendance since we started using it.",
    },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What People Are Saying</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Hear from our community of event organizers and attendees</p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-indigo-50 rounded-xl p-8 md:p-10"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src={testimonials[currentIndex].image || "/placeholder.svg"}
                      alt={testimonials[currentIndex].name}
                      className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  </div>
                  <div>
                    <div className="text-indigo-600 text-4xl font-serif mb-4">"</div>
                    <p className="text-gray-700 text-lg italic mb-6">{testimonials[currentIndex].quote}</p>
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonials[currentIndex].name}</h4>
                      <p className="text-gray-600">{testimonials[currentIndex].role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === currentIndex ? "bg-indigo-600" : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={prevTestimonial}
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 md:-translate-x-full bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-indigo-600 hover:shadow-lg transition-all"
            aria-label="Previous testimonial"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 md:translate-x-full bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-indigo-600 hover:shadow-lg transition-all"
            aria-label="Next testimonial"
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Featured Events Component
const FeaturedEvents = ({ events, isLoading, error }) => {
  const [currentPage, setCurrentPage] = useState(0)
  const eventsPerPage = 4
  const totalPages = Math.ceil((events?.length || 0) / eventsPerPage)

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }

  if (isLoading) {
    return <Loader message="Loading featured events..." />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <FaCalendarAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Featured Events</h3>
        <p className="text-gray-600 mb-6">There are no featured events available at the moment. Check back later!</p>
        <Link
          to="/events"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors shadow-sm inline-flex items-center"
        >
          <FaSearch className="mr-2 h-4 w-4" />
          Browse All Events
        </Link>
      </div>
    )
  }

  const currentEvents = events.slice(currentPage * eventsPerPage, (currentPage + 1) * eventsPerPage)

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="wait">
          {currentEvents.map((event, index) => (
            <motion.div
              key={`${event.id}-${currentPage}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="h-full"
            >
              <EventCard event={event} featured={true} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={prevPage}
            className="p-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Previous page"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                index === currentPage
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={nextPage}
            className="p-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Next page"
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}

// Newsletter Component
const Newsletter = () => {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubscribed(true)
      toast.success("Thank you for subscribing to our newsletter!")
    }, 1500)
  }

  return (
    <div className="bg-indigo-600 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Stay Updated</h2>
          <p className="text-indigo-100 mb-6">Subscribe to our newsletter for the latest events and exclusive offers</p>

          {isSubscribed ? (
            <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto">
              <FaCheckCircle className="h-12 w-12 text-white mx-auto mb-4" />
              <p className="text-white font-medium">Thank you for subscribing!</p>
              <p className="text-indigo-100 mt-2">You'll now receive updates about new events and special offers.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white text-indigo-600 hover:bg-indigo-50 font-medium py-3 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                >
                  {isSubmitting ? <FaSpinner className="animate-spin h-5 w-5 mx-auto" /> : "Subscribe"}
                </button>
              </div>
              <p className="text-xs text-indigo-200 mt-3">We respect your privacy. Unsubscribe at any time.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// Main AttendeeHome Component
const AttendeeHome = () => {
  const [featuredEvents, setFeaturedEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: "",
    date: "",
    price: "",
    location: "",
  })

  const fetchFeaturedEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      const events = await eventViewService.getAllEvents()
      
      // Filter for featured events (you might have a different criteria)
      const featured = events
        .filter(
          (event) =>
            event.status === "published" && event.visibility === "public" && new Date(event.start_date) >= new Date(),
        )
        .slice(0, 8) // Limit to 8 events

      // Fetch media for each event
      const eventsWithMedia = await Promise.all(
        featured.map(async (event) => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/AttendeeEvents/${event.id}/media`, {
              credentials: true,
            })

            if (!response.ok) {
              throw new Error("Failed to fetch event media")
            }

            const mediaData = await response.json()
            const thumbnail = mediaData.images.find((img) => img.is_thumbnail) || mediaData.images[0] || null

            return {
              ...event,
              thumbnail,
              media: mediaData,
            }
          } catch (error) {
            console.error(`Error fetching media for event ${event.id}:`, error)
            return {
              ...event,
              thumbnail: null,
              media: { images: [], videos: [] },
            }
          }
        }),
      )
      console.log("Featured events with media:", eventsWithMedia)
      setFeaturedEvents(eventsWithMedia)
      setIsLoading(false)
    } 
    catch (err) {
      setError(err.message || "Failed to load featured events")
      setIsLoading(false)
    }
  }, [])
  const {AttendeecheckAuth} = useContext(AuthContext)

  useEffect(() => {
    AttendeecheckAuth()
    fetchFeaturedEvents()
  }, [fetchFeaturedEvents])

  const applyFilters = () => {
    // This would typically filter the events based on the selected filters
    // For now, we'll just log the filters and refetch events
    console.log("Applying filters:", filters)
    fetchFeaturedEvents()
  }

  return (
    <div className="bg-gray-50">
      <HeroSection />

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Events</h2>
              <p className="text-gray-600 max-w-2xl">
                Discover our handpicked selection of the most exciting upcoming events. Don't miss out!
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <FaFilter className="mr-2 h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </motion.button>
          </div>

          {showFilters && <EventFilters filters={filters} setFilters={setFilters} onApply={applyFilters} />}

          <FeaturedEvents events={featuredEvents} isLoading={isLoading} error={error} />

          <div className="mt-12 text-center">
            <Link
              to="/events"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-lg"
            >
              View All Events
              <FaArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <CategoriesSection />

      <TestimonialsSection />

      <Newsletter />

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide the best platform for discovering and managing events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl text-center">
              <div className="bg-indigo-100 text-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaGlobe className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Discover Events</h3>
              <p className="text-gray-600">Find events that match your interests, whether they're nearby or online.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl text-center">
              <div className="bg-indigo-100 text-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTicketAlt className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Registration</h3>
              <p className="text-gray-600">
                Register for events with just a few clicks and manage your tickets in one place.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl text-center">
              <div className="bg-indigo-100 text-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserFriends className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Connect</h3>
              <p className="text-gray-600">
                Connect with other attendees, speakers, and organizers to expand your network.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
)}



export default AttendeeHome
