"use client"

import { useState, useEffect, useRef, useContext, memo, useMemo } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  FiMenu,
  FiX,
  FiLogIn,
  FiLogOut,
  FiUser,
  FiCalendar,
  FiMail,
  FiBell,
  FiHome,
  FiUsers,
  FiPlus,
  FiChevronDown,
  FiClock,
  FiStar,
  FiHelpCircle,
  FiCheckCircle,
  FiAlertTriangle,
  FiPlusSquare
} from "react-icons/fi"
import { FcInvite } from "react-icons/fc"
import { AuthContext } from "../../Contexts/authContext"
import { motion, AnimatePresence } from "framer-motion"
import axios from 'axios';

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-10"
      >
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mr-3">
            <FiAlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Login Prompt Modal Component
const LoginPromptModal = ({ isOpen, onClose, onLogin, role }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-10"
      >
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mr-3">
            <FiLogIn className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Login Required</h3>
            <p className="mt-2 text-sm text-gray-500">
              You need to be logged in as an {role} to access this feature.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
          >
            Login as {role}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Memoized NavLink component for performance
const NavLink = memo(({ to, icon: Icon, label, onClick, badge }) => {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`)

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-base font-medium flex items-center gap-2 transition-all duration-300 ${isActive ? "text-blue-600 bg-blue-50" : "text-gray-800 hover:text-blue-600 hover:bg-gray-100"
          }`}
        onClick={onClick}
      >
        {Icon && <Icon className={isActive ? "text-blue-600" : "text-gray-500"} />}
        <span>{label}</span>
        {badge && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
            {badge}
          </span>
        )}
      </Link>
    </motion.div>
  )
})

// Memoized MobileNavLink component
const MobileNavLink = memo(({ to, icon: Icon, label, onClick, badge }) => {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`)

  return (
    <Link
      to={to}
      className={`flex items-center justify-center flex-col px-2 py-1 relative ${isActive ? "text-blue-600" : "text-gray-800 hover:text-blue-600"
        }`}
      onClick={onClick}
    >
      <div className="relative">
        {Icon && <Icon size={24} className="mb-1" />}
        {badge && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium">{label}</span>
      {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />}
    </Link>
  )
})

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [profilePicture, setProfilePicture] = useState(null)
  const menuRef = useRef(null)
  const profileRef = useRef(null)
  const notificationRef = useRef(null)
  const { user, attendeeUser, Logout, AttendeeLogout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const CurrentPath = location.pathname
  const match = CurrentPath.match(/\/attendee/)

  const [userRole, setUserRole] = useState(match ? "attendee" : "organizer") // 'attendee' or 'organizer'
  const [notificationCount, setNotificationCount] = useState(3) // Example notification count

  // New state for modals
  const [showRoleSwitchModal, setShowRoleSwitchModal] = useState(false)
  const [pendingRole, setPendingRole] = useState(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [requiredRole, setRequiredRole] = useState("organizer")
  const [pendingNavigation, setPendingNavigation] = useState(null)

  // Fetch profile picture when user changes
  // Update the useEffect for fetching profile picture (around line 300):
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        if (user && userRole === "organizer") {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/Profile/profile-picture`,
            {
              withCredentials: true,
              responseType: 'blob'
            }
          );
          const imageUrl = URL.createObjectURL(response.data);
          setProfilePicture(imageUrl);
        } else if (attendeeUser && userRole === "attendee") {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/AttendeeProfile/profile-picture`,
            {
              withCredentials: true,
              responseType: 'blob'
            }
          );
          const imageUrl = URL.createObjectURL(response.data);
          setProfilePicture(imageUrl);
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
        setProfilePicture(null);
      }
    };

    fetchProfilePicture();

    return () => {
      if (profilePicture) {
        URL.revokeObjectURL(profilePicture);
      }
    };
  }, [user, attendeeUser, userRole]);

  // Handle scroll events for navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY
      if (position > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Handle role changes and navigation
  useEffect(() => {
    if (userRole === "attendee" && !match && !CurrentPath.match(/\/signup/)) {
      navigate("/attendee/events")
    } else if (userRole === "organizer" && match) {
      navigate("/events-page")
    }
    else if (userRole === "attendee" && CurrentPath.match(/\/signup/)) {
      setUserRole("organizer")
    }
  }, [userRole, match, navigate])

  // Handle scroll locking for mobile menu
  useEffect(() => {
    const handleScrollLock = () => {
      if (isOpen) {
        // Save current scroll position
        const currentPosition = window.pageYOffset || document.documentElement.scrollTop
        setScrollPosition(currentPosition)

        // Lock scroll on body only
        document.body.style.overflow = "hidden"
        document.body.style.position = "fixed"
        document.body.style.top = `-${currentPosition}px`
        document.body.style.width = "100%"
      } else {
        // Unlock scroll
        document.body.style.overflow = ""
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""

        // Restore scroll position after styles are cleared
        window.scrollTo(0, scrollPosition)
      }
    }

    // Add slight delay to ensure DOM is ready
    const timer = setTimeout(handleScrollLock, 10)

    return () => {
      clearTimeout(timer)
      // Cleanup if component unmounts
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
    }
  }, [isOpen, scrollPosition])

  // Handle logout
  const handleLogout = () => {
    Logout()
    navigate("/login")
    setShowProfileDropdown(false)
    setProfilePicture(null); // Clear profile picture on logout
  }

  // Handle attendee logout
  const handleAttendeeLogout = () => {
    AttendeeLogout()
    navigate("/attendee")
    setShowProfileDropdown(false)
  }

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  // Toggle profile dropdown
  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown)
    if (showNotifications) setShowNotifications(false)
  }

  // Toggle notifications dropdown
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    if (showProfileDropdown) setShowProfileDropdown(false)
  }

  // Close mobile menu
  const closeMenu = () => {
    setIsOpen(false)
  }

  // Handle role switch with confirmation
  const handleRoleSwitch = (newRole) => {
    if (newRole === userRole) return

    setPendingRole(newRole)
    setShowRoleSwitchModal(true)
  }

  // Confirm role switch
  const confirmRoleSwitch = () => {
    if (pendingRole) {
      setUserRole(pendingRole)
      setPendingRole(null)
    }
    setShowRoleSwitchModal(false)
  }

  // Cancel role switch
  const cancelRoleSwitch = () => {
    setPendingRole(null)
    setShowRoleSwitchModal(false)
  }

  // Handle navigation with authentication check
  const handleNavigation = (path, requiredUserRole) => {
    // If user is trying to access organizer features while in attendee mode
    if (requiredUserRole === "organizer" && userRole === "attendee") {
      // If user is logged in as an attendee, allow them to visit organizer pages
      if (attendeeUser) {
        // Store the path for navigation after confirmation
        setPendingNavigation(path)
        setRequiredRole("organizer")
        setShowLoginPrompt(false) // Don't show login prompt, just navigate
        navigate(path) // Allow navigation to organizer page while in attendee mode
        return
      }

      // If not logged in, show login prompt
      if (!user) {
        setPendingNavigation(path)
        setRequiredRole("organizer")
        setShowLoginPrompt(true)
        return
      }
    }

    // If user is trying to access attendee features while in organizer mode
    if (requiredUserRole === "attendee" && userRole === "organizer") {
      // If user is logged in as an organizer, allow them to visit attendee pages
      if (user) {
        setPendingNavigation(path)
        setRequiredRole("attendee")
        setShowLoginPrompt(false)
        navigate(path)
        return
      }

      // If not logged in, show login prompt
      if (!attendeeUser) {
        setPendingNavigation(path)
        setRequiredRole("attendee")
        setShowLoginPrompt(true)
        return
      }
    }

    // Default case: just navigate
    navigate(path)
  }

  // Handle login from prompt
  const handleLoginFromPrompt = () => {
    setShowLoginPrompt(false)
    if (requiredRole === "organizer") {
      navigate("/login")
    } else {
      navigate("/attendee/login")
    }
  }

  // Handle clicks outside the mobile menu and profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && isOpen) {
        closeMenu()
      }
      if (profileRef.current && !profileRef.current.contains(event.target) && showProfileDropdown) {
        setShowProfileDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target) && showNotifications) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, showProfileDropdown, showNotifications])

  // Animation variants
  const navbarVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  const mobileMenuVariants = {
    closed: { x: "-100%", opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  }

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: "auto", transition: { duration: 0.3 } },
  }

  const bottomNavVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  }

  // Get first letter of name for avatar
  // Update the getInitial function (around line 1000):
  const getInitial = () => {
    if (userRole === "attendee" && attendeeUser) {
      return attendeeUser.firstName?.charAt(0) || attendeeUser.identifier?.charAt(0) || "?";
    } else if (user && userRole === "organizer") {
      return user.firstName?.charAt(0) || user.email?.charAt(0) || "?";
    }
    return "?";
  };

  // Get display name
  // Update the getDisplayName function (around line 1010):
  const getDisplayName = () => {
    if (userRole === "attendee" && attendeeUser) {
      return attendeeUser.firstName || attendeeUser.identifier?.split("@")[0] || "Login Please";
    } else if (user && userRole === "organizer") {
      return user.firstName || user.email?.split("@")[0] || "Login Please";
    }
    return "Login Please";
  };


  // Mark all notifications as read
  const markAllAsRead = () => {
    // Implementation would go here
    setNotificationCount(0)
  }

  const toggleButtonStyle = {
    backgroundColor: userRole === "organizer" ? "#2563eb" : "#e5e7eb",
  }

  // Calculate bottom padding based on user authentication and screen size
  const getBottomPadding = () => {
    if (user || attendeeUser) {
      return "pb-2 md:pb-0" // Add padding on mobile only
    }
    return ""
  }

  return (
    <>
      <motion.nav
        className={`sticky top-0 w-full z-50 h-16 md:h-20 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white"
          }`}
        initial="initial"
        animate="animate"
        variants={navbarVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20 items-center">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to={userRole === "organizer" ? "/dashboard" : "/attendee/"} className="flex gap-2 items-center font-bold text-2xl transition-all duration-300">
                  <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ duration: 0.3 }}>
                    <FcInvite className="text-3xl md:text-4xl" />
                  </motion.div>
                  <motion.span className="hidden sm:block text-blue-600" whileHover={{ scale: 1.05 }}>
                    Gatherly
                  </motion.span>
                </Link>
              </div>

              {/* Desktop Nav Links */}
              <div className="hidden md:ml-10 md:flex md:items-center md:space-x-4">
                {!match && user && (
                  <>
                    <NavLink to="/events-page" icon={FiCalendar} label="Events" />
                    <NavLink to="/guestlists" icon={FiUsers} label="Attendees" />
                  </>
                )}

                {/* {match && attendeeUser && (
                  <>
                    <NavLink to="/attendee/events" icon={FiCalendar} label="Events" />
                    <NavLink to="/attendee/profile" icon={FiUser} label="Profile" />
                    <NavLink to="/attendee/events/feedback" icon={FiMail} label="Feedbacks" />
                    <NavLink to="/attendee/qr-scanner" icon={FiMail} label="Scan QR" />

                  </>
                )} */}
              </div>
            </div>

            {/* Auth Buttons - Desktop */}
            {((userRole === "organizer" && !user) || (userRole === "attendee" && !attendeeUser)) ? (

              <div className="hidden md:flex md:items-center md:space-x-4">
                <div className="flex items-center justify-between mt-3">
                  <div
                    className={`text-sm font-medium px-2 py-1 rounded-full ${userRole === "attendee" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}
                  >
                    {userRole === "attendee" ? "Attendee" : "Organizer"}
                  </div>
                  <button
                    onClick={() => handleRoleSwitch(userRole === "attendee" ? "organizer" : "attendee")}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                    style={toggleButtonStyle}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${userRole === "organizer" ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                  <Link
                    to={!match ? "/login" : "/attendee/login"}
                    className="flex items-center text-gray-800 hover:text-blue-600 px-4 py-2 rounded-md text-base font-medium transition-colors duration-300"
                  >
                    <FiLogIn className="mr-2" />
                    Login
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
                  {userRole === "organizer" &&
                    <Link
                      to="/signup"
                      className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-md text-base font-medium shadow-md hover:shadow-lg hover:bg-blue-700 transition-all duration-300"
                    >
                      <FiUser className="mr-2" />
                      Sign Up
                    </Link>
                  }

                </motion.div>

              </div>

            ) : (
              <div className="hidden md:flex md:items-center md:space-x-4">

                {/* User Profile */}
                <motion.div whileHover={{ scale: 1.05 }} className="relative" ref={profileRef}>
                  <button
                    onClick={toggleProfileDropdown}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full transition-all duration-300"
                  >
                    <div className="relative">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {getInitial()}
                        </div>
                      )}
                      {((userRole === "organizer" && user) || (userRole === "attendee" && attendeeUser)) &&
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      }
                    </div>
                    <span className="font-medium">{getDisplayName()}</span>
                    <FiChevronDown
                      className={`transition-transform duration-300 ${showProfileDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showProfileDropdown && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={dropdownVariants}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200"
                      >
                        <div className="p-4 border-b border-gray-100">
                          {match && attendeeUser && <p className="text-sm text-gray-500">Signed in as</p>}
                          {match && !attendeeUser && <p className="text-sm text-gray-500">Sign in Please!</p>}
                          {!match && user && <p className="text-sm text-gray-500">Signed in as</p>}
                          {!match && !user && <p className="text-sm text-gray-500">Sign in Please!</p>}
                          <p className="font-medium text-gray-800 truncate">
                            {!match ? user?.email : attendeeUser?.identifier}
                          </p>

                          {/* Role Toggle Switch */}
                          <div className="flex items-center justify-between mt-3">
                            <div
                              className={`text-sm font-medium px-2 py-1 rounded-full ${userRole === "attendee" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                }`}
                            >
                              {userRole === "attendee" ? "Attendee" : "Organizer"}
                            </div>
                            <button
                              onClick={() => handleRoleSwitch(userRole === "attendee" ? "organizer" : "attendee")}
                              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                              style={toggleButtonStyle}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${userRole === "organizer" ? "translate-x-6" : "translate-x-1"
                                  }`}
                              />
                            </button>
                          </div>
                        </div>

                        <div className="py-2">
                          <Link
                            to={userRole === "attendee" ? "/attendee/profile" : "/profile"}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-800"
                          >
                            <FiUser className="mr-3 text-blue-600" />
                            Your Profile
                          </Link>
                          <Link
                            to={userRole === "attendee" ? "/attendee/events" : "/events-page"}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-800"
                            onClick={(e) => {
                              e.preventDefault()
                              handleNavigation("/events-page", "organizer")
                            }}
                          >
                            <FiCalendar className="mr-3 text-blue-600" />
                            Events
                          </Link>
                           
                           {userRole === "attendee" &&(
                            <>
                            <Link
                            to="/attendee/events/feedback"
                            className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-800"
                            onClick={(e) => {
                              e.preventDefault()
                              handleNavigation("/attendee/events/feedback", "attendee")
                            }}
                            >
                            <FiMail className="mr-3 text-blue-600" />
                            Feedbacks
                          </Link>
                         <Link
                         to="/attendee/qr-scanner"
                         className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-800"
                         onClick={(e) => {
                           e.preventDefault()
                           handleNavigation("/attendee/qr-scanner", "attendee")
                          }}
                          >
                            <FiPlusSquare className="mr-3 text-blue-600" />
                            Scan QR Code
                          </Link>

                           </>
                          )}
                          <Link to={userRole === "attendee" ? "/attendee/help" : "/help"} className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-800">
                            <FiHelpCircle className="mr-3 text-blue-600" />
                            Help & Support
                          </Link>
                        </div>

                        <div className="py-2 border-t border-gray-100">
                          {!match && user && (
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800"
                            >
                              <FiLogOut className="mr-3 text-blue-600" />
                              Logout
                            </button>
                          )}
                          {match && attendeeUser && (
                            <button
                              onClick={handleAttendeeLogout}
                              className="flex items-center w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800"
                            >
                              <FiLogOut className="mr-3 text-blue-600" />
                              Logout
                            </button>
                          )}
                          {match && !attendeeUser && (
                            <Link
                              to="/attendee/login"
                              className="flex items-center w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800"
                            >
                              <FiLogIn className="mr-3 text-blue-600" />
                              Login
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
               <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-800 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors duration-300"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isOpen ? <FiMenu className="block h-6 w-6" /> : <FiX className="block h-6 w-6" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile menu with animation */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 touch-none"
                onClick={closeMenu}
              />
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={mobileMenuVariants}
                className="md:hidden fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 overflow-y-auto"
                ref={menuRef}
              >
                <div className="flex flex-col h-full">
                  {/* User Info */}
                  {(user || attendeeUser) && (
                    <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700">
                      <div className="flex items-center space-x-4">
                        {profilePicture ? (
                          <img
                            src={profilePicture}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 text-xl font-bold shadow-lg">
                            {getInitial()}
                          </div>
                        )}
                        <div className="text-white">
                          <p className="font-bold text-xl">{getDisplayName()}</p>
                          {userRole !== "attendee" && user && (
                            <p className="text-white/80 text-sm truncate max-w-[180px]">{user.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Role Toggle Switch */}
                  <div className="flex items-center justify-center mt-4 mb-2">
                    <div
                      className={`text-sm font-medium mr-5 px-2 py-1 rounded-full ${userRole === "attendee" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                        }`}
                    >
                      {userRole === "attendee" ? "Attendee" : "Organizer"}
                    </div>
                    <button
                      onClick={() => handleRoleSwitch(userRole === "attendee" ? "organizer" : "attendee")}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                      style={toggleButtonStyle}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${userRole === "organizer" ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>

                  {/* Mobile Nav Links */}
                  <div className="flex-1 overflow-y-auto py-4 px-4">
                    <div className="flex flex-col space-y-1">
                      {match && attendeeUser && (
                        <div>
                         
                          <Link
                            to="/events-page"
                            className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-800"
                            onClick={(e) => {
                              e.preventDefault()
                              handleNavigation("/events-page", "organizer")
                            }}
                          >
                            <FiCalendar className="mr-3 text-blue-600" />
                            Events
                          </Link>
                            <Link
                            to="/attendee/events/feedback"
                            className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-800"
                            onClick={(e) => {
                              e.preventDefault()
                              handleNavigation("/attendee/events/feedback", "Attendee")
                            }}
                          >
                            <FiMail className="mr-3 text-blue-600" />
                            Feedbacks
                          </Link>
                         <Link
                            to="/attendee/qr-scanner"
                            className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-800"
                            onClick={(e) => {
                              e.preventDefault()
                              handleNavigation("/attendee/qr-scanner", "Attendee")
                            }}
                          >
                            <FiPlusSquare className="mr-3 text-blue-600" />
                            Scan QR Code
                          </Link>
                          
                        </div>
                      )}

                      {!match && user && (
                        <div>
                          <Link
                            to="/events-page"
                            className="flex items-center text-gray-800 hover:text-blue-600 hover:bg-gray-50 px-4 py-3 rounded-md text-lg font-medium transition-colors duration-300"
                            onClick={closeMenu}
                          >
                            <FiCalendar className="mr-3 text-blue-600" />
                            Events
                          </Link>
                          <Link
                            to="/guestlists"
                            className="flex items-center text-gray-800 hover:text-blue-600 hover:bg-gray-50 px-4 py-3 rounded-md text-lg font-medium transition-colors duration-300"
                            onClick={closeMenu}
                          >
                            <FiUsers className="mr-3 text-blue-600" />
                            Attendees
                          </Link>
                        </div>
                      )}

                      {(user || attendeeUser) && (
                        <>
                          <div className="h-px bg-gray-200 my-2"></div>

                           <Link
                            to={userRole === "attendee" ? "/attendee/profile" : "/profile"}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-800"
                          >
                            <FiUser className="mr-3 text-blue-600" />
                            Your Profile
                          </Link>
                          <Link to={userRole === "attendee" ? "/attendee/help" : "/help"} className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-800">
                            <FiHelpCircle className="mr-3 text-blue-600" />
                            Help & Support
                          </Link>
                          {!match && user && (
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800"
                            >
                              <FiLogOut className="mr-3 text-blue-600" />
                              Logout
                            </button>
                          )}
                          {match && attendeeUser && (
                            <button
                              onClick={handleAttendeeLogout}
                              className="flex items-center w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800"
                            >
                              <FiLogOut className="mr-3 text-blue-600" />
                              Logout
                            </button>
                          )}
                          {match && !attendeeUser && (
                            <Link
                              to="/attendee/login"
                              className="flex items-center w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800"
                            >
                              <FiLogIn className="mr-3 text-blue-600" />
                              Login
                            </Link>
                          )}
                          {!match && !user && (
                            <Link
                              to="/login"
                              className="flex items-center w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800"
                            >
                              <FiLogIn className="mr-3 text-blue-600" />
                              Login
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Auth Buttons - Mobile */}
                  {!user && !attendeeUser ? (
                    <div className="p-4 border-t border-gray-200">
                      <Link
                        to={!match ? "/login" : "/attendee/login"}
                        className="flex items-center justify-center text-gray-800 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-md text-lg font-medium transition-colors duration-300 mb-3"
                        onClick={closeMenu}
                      >
                        <FiLogIn className="mr-2" />
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium shadow-md hover:bg-blue-700 transition-all duration-300"
                        onClick={closeMenu}
                      >
                        <FiUser className="mr-2" />
                        Sign Up
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          if (!match && user) {
                            handleLogout()
                          } else if (match && attendeeUser) {
                            handleAttendeeLogout()
                          }
                          closeMenu()
                        }}
                        className="flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-lg font-medium transition-colors duration-300"
                      >
                        <FiLogOut className="mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile Bottom Navigation Bar (Eventbrite style) */}
      {(user || attendeeUser) && (
        <motion.div
          className="md:hidden fixed bottom-0 left-0 right-0  bg-white shadow-lg z-50 border-t border-gray-200"
          initial="hidden"
          animate="visible"
          variants={bottomNavVariants}
        >
          <div className="flex justify-around items-center h-16 mt-0.5">
            {userRole === "attendee" ? (
              // Attendee Bottom Navigation
              <>
                <MobileNavLink to="/attendee" icon={FiHome} label="Home" />
                <MobileNavLink to="/attendee/events" icon={FiCalendar} label="Events" />
                <div className="-mt-5">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/attendee/qr-scanner"
                      className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg"
                    >
                      <FiPlusSquare size={24} />
                    </Link>
                  </motion.div>
                </div>
                <MobileNavLink
                  to="/attendee/events/feedback"
                  icon={FiMail}
                  label="Feedbacks"
                />
                <MobileNavLink to="/attendee/profile" icon={FiUser} label="Profile" />
              </>
            ) : (
              // Organizer Bottom Navigation
              <>
                <MobileNavLink to="/dashboard" icon={FiHome} label="Home" />
                <MobileNavLink to="/guestlists" icon={FiUsers} label="Attendees" />
                <div className="-mt-5">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/create-event"
                      className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg"
                    >
                      <FiPlus size={24} />
                    </Link>
                  </motion.div>
                </div>
                <MobileNavLink to="/events-page" icon={FiCalendar} label="Events" />
                <MobileNavLink to="/profile" icon={FiUser} label="Profile" />
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Add padding at the bottom for mobile to account for the bottom nav */}
      <div className={getBottomPadding()}></div>

      {/* Role Switch Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRoleSwitchModal}
        onClose={cancelRoleSwitch}
        onConfirm={confirmRoleSwitch}
        title="Switch Role"
        message={`Are you sure you want to switch to ${pendingRole === "attendee" ? "Attendee" : "Organizer"} mode? Your current view will change.`}
      />

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={handleLoginFromPrompt}
        role={requiredRole}
      />

     
    </>
  )
}

export default Navbar