"use client"

import { useState, useEffect, useMemo } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Carousel } from "react-responsive-carousel"
import "react-responsive-carousel/lib/styles/carousel.min.css"
import { useNavigate } from "react-router-dom"
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiDollarSign,
  FiUsers,
  FiSearch,
  FiFilter,
  FiX,
  FiShare2,
  FiLink,
  FiSend,
  FiPrinter,
  FiCopy,
  FiDownload,
  FiRefreshCw,
  FiGrid,
  FiList,
} from "react-icons/fi"
import {
  Typography,
  Button,
  Box,
  Modal,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Badge,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Switch,
  Tabs,
  Tab,
  Skeleton,
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { motion, AnimatePresence } from "framer-motion"
import dayjs from "dayjs"
import eventService from "../../../Services/eventServices"
import ProtectedRoute from "../../../Config/ProtectedRoute"

const EventsPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")
  const [modalOpen, setModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreatingAI, setIsCreatingAI] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [mediaMap, setMediaMap] = useState({})
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState([])
  const [sortConfig, setSortConfig] = useState({
    key: "start_date",
    direction: "desc",
  })
  const [dateRangeFilter, setDateRangeFilter] = useState({
    start: null,
    end: null,
  })
  const [ticketTypeFilter, setTicketTypeFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid") // 'grid' or 'list'
  const [currentEventId, setCurrentEventId] = useState(null)
  const [attendeeListsModalOpen, setAttendeeListsModalOpen] = useState(false)
  const [eventLists, setEventLists] = useState([])
  const [allLists, setAllLists] = useState([])
  const [loadingLists, setLoadingLists] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [tabValue, setTabValue] = useState(1) // Set to Past events tab by default
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false) // Don't filter by upcoming only

  const navigate = useNavigate()
  const VITE_API_IMG_BASE_URL = import.meta.env.VITE_API_IMG_BASE_URL; // Replace with your actual API URL

  // Update the API_BASE_URL with a fallback
  const API_BASE_URL = VITE_API_IMG_BASE_URL || window.location.origin + "/"

  useEffect(() => {
    // Only fetch events if we haven't already
    if (events.length === 0 && !loading) {
      fetchEvents()
    }

    // Add event listener for keyboard shortcuts
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + F for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        document.getElementById("search-events")?.focus()
      }
      // Ctrl/Cmd + N for new event
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault()
        handleCreateEvent()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [events.length])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const eventsData = await eventService.getAllEvents()
      setEvents(eventsData || []) // Ensure we set an empty array if null/undefined

      // Only try to fetch media if we have events
      if (Array.isArray(eventsData) && eventsData.length > 0) {
        const mediaPromises = eventsData.map((event) => eventService.getEventMedia(event.id))
        const mediaResults = await Promise.all(mediaPromises)

        const newMediaMap = {}
        eventsData.forEach((event, index) => {
          newMediaMap[event.id] = {
            images: mediaResults[index]?.images || [],
            videos: mediaResults[index]?.videos || [],
          }
        })
        setMediaMap(newMediaMap)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
      showSnackbar("Failed to fetch events. Please try again.", "error")
      // Set empty array on error to avoid undefined issues
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const refreshEvents = async () => {
    setRefreshing(true)
    try {
      await fetchEvents()
      showSnackbar("Events refreshed successfully", "success")
    } finally {
      setRefreshing(false)
    }
  }

  const handleOpenAttendeeLists = async (event) => {
    if (!event?.id) {
      showSnackbar("Invalid event", "error")
      return
    }
    setLoadingLists(true)
    setCurrentEventId(event.id)
    setSelectedEvent(event)

    try {
      const allListsResponse = await eventService.getAllLists()
      setAllLists(Array.isArray(allListsResponse) ? allListsResponse.filter((list) => list.IsArchived === false && list.IsPrivate === true) : [])

      // console.log(Array.isArray(allListsResponse) ? allListsResponse.filter((list) => list.IsArchived === false && list.IsPrivate === true) : [])

      try {
        const eventListsResponse = await eventService.getEventAttendeeLists(event.id)
        setEventLists(eventListsResponse)
      } catch (error) {
        showSnackbar(error, "error")
        setEventLists([])
      }

      setAttendeeListsModalOpen(true)
    } catch (error) {
      showSnackbar(error.message || "Failed to load attendee lists", "error")
    } finally {
      setLoadingLists(false)
    }
  }

  const handleAttachList = async (listId) => {
    if (!currentEventId) {
      showSnackbar("No event selected", "error")
      return
    }

    if (!listId) {
      showSnackbar("Invalid list ID", "error")
      return
    }

    try {
      await eventService.attachAttendeeList(currentEventId, listId)
      // Refresh the lists
      const updatedLists = await eventService.getEventAttendeeLists(currentEventId)
      setEventLists(updatedLists)
      showSnackbar("List attached successfully", "success")
    } catch (error) {
      let errorMessage = error.message || "Failed to attach list"
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message
      }
      showSnackbar(errorMessage, "error")
    }
  }

  const handleDetachList = async (listId) => {
    if (!currentEventId) {
      showSnackbar("No event selected", "error")
      return
    }

    try {
      await eventService.detachAttendeeList(currentEventId, listId)
      // Refresh the lists
      const updatedLists = await eventService.getEventAttendeeLists(currentEventId)
      setEventLists(updatedLists)
      showSnackbar("List detached successfully", "success")
    } catch (error) {
      showSnackbar(error.message || "Failed to detach list", "error")
    }
  }

  // const handleSort = (key) => {
  //   let direction = "asc"
  //   if (sortConfig.key === key && sortConfig.direction === "asc") {
  //     direction = "desc"
  //   }
  //   setSortConfig({ key, direction })
  // }

  const sortedEvents = useMemo(() => {
    const sortableEvents = [...events]
    if (sortConfig.key) {
      sortableEvents.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }
    return sortableEvents
  }, [events, sortConfig])

  const filteredEvents = useMemo(() => {

    // If no events, return empty array to avoid filtering issues
    if (!Array.isArray(sortedEvents) || sortedEvents.length === 0) {
      return []
    }

    return sortedEvents.filter((event) => {
      // Skip filtering if event is undefined or null
      if (!event) return false

      // Search filter - only apply if searchQuery is not empty
      const matchesSearch =
        !searchQuery ||
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter - only apply if not "all"
      const matchesStatus =
        statusFilter === "all" || (event.status && event.status.toLowerCase() === statusFilter.toLowerCase())

      // Date range filter
      const matchesDateRange =
        (!dateRangeFilter.start || new Date(event.start_date) >= new Date(dateRangeFilter.start)) &&
        (!dateRangeFilter.end || new Date(event.start_date) <= new Date(dateRangeFilter.end))

      // Ticket type filter
      const matchesTicketType =
        ticketTypeFilter === "all" ||
        (event.ticket_type && event.ticket_type.toLowerCase() === ticketTypeFilter.toLowerCase())

      // Upcoming only filter
      const matchesUpcoming = !showUpcomingOnly || (event.start_date && new Date(event.start_date) >= new Date())

      return matchesSearch && matchesStatus && matchesDateRange && matchesTicketType && matchesUpcoming
    })
  }, [sortedEvents, searchQuery, statusFilter, dateRangeFilter, ticketTypeFilter, showUpcomingOnly])

  // Group events by tab
  const eventsByTab = useMemo(() => {

    // Ensure filteredEvents is an array
    const events = Array.isArray(filteredEvents) ? filteredEvents : []

    const upcoming = events.filter(
      (event) =>
        event &&
        event.start_date &&
        new Date(event.start_date) >= new Date() &&
        (!event.status || event.status.toLowerCase() !== "cancelled"),
    )

    const past = events.filter(
      (event) =>
        event &&
        event.start_date &&
        new Date(event.start_date) < new Date() &&
        (!event.status || event.status.toLowerCase() !== "cancelled"),
    )

    const drafts = events.filter((event) => event && event.status && event.status.toLowerCase() === "draft")

    const cancelled = events.filter((event) => event && event.status && event.status.toLowerCase() === "cancelled")

    return [upcoming, past, drafts, cancelled]
  }, [filteredEvents])

  const handleSelectEvent = (eventId) => {
    setSelectedEvents((prev) => (prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]))
  }

  const handleSelectAllEvents = () => {
    const currentTabEvents = eventsByTab[tabValue]
    if (selectedEvents.length === currentTabEvents.length && currentTabEvents.length > 0) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(currentTabEvents.map((event) => event.id))
    }
  }

  const handleBulkDelete = () => {
    if (
      selectedEvents.some((id) => {
        const event = events.find((e) => e.id === id)
        return event?.status?.toLowerCase() === "published"
      })
    ) {
      showSnackbar("Published events cannot be deleted.", "warning")
      return
    }
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    try {
      await Promise.all(selectedEvents.map((id) => eventService.deleteEvent(id)))
      showSnackbar(`${selectedEvents.length} events deleted successfully`, "success")
      setSelectedEvents([])
      fetchEvents()
    } catch (error) {
      console.error("Failed to delete events:", error)
      showSnackbar("Failed to delete events. Please try again.", "error")
    } finally {
      setDeleteConfirmOpen(false)
    }
  }

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  const handleCreateEvent = () => {
    setModalOpen(true)
  }

  const handleStartFromScratch = () => {
    setIsCreating(true)
    console.log("isCreating", isCreating)
    setTimeout(() => {
      setModalOpen(false)
      navigate("/create-event")
    }, 1000)
  }

  const handleCreateWithAI = () => {
    setIsCreatingAI(true)
    console.log("isCreatingAI", isCreatingAI)
    setTimeout(() => {
      setModalOpen(false)
      navigate("/create-event-ai")
    }, 1000)
  }

  const handleMenuOpen = (event, eventData) => {
    setAnchorEl(event.currentTarget)
    setSelectedEvent(eventData)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedEvent(null)
  }

  const handleViewEvent = () => {
    navigate(`/event/${selectedEvent.id}`)
    handleMenuClose()
  }

  const handleEditEvent = () => {
    navigate(`/events/edit/${selectedEvent.id}`)
    handleMenuClose()
  }

  const handleDeleteClick = () => {
    if (selectedEvent?.status?.toLowerCase() === "published") {
      showSnackbar("Published events cannot be deleted.", "warning")
      handleMenuClose()
      return
    }
    setDeleteConfirmOpen(true)
  }

  const handleDeleteEvent = async () => {
    try {
      const idToDelete = selectedEvent?.id ?? selectedEvents[0] // fallback
      if (!idToDelete) {
        showSnackbar("No event selected for deletion.", "error")
        return
      }

      await eventService.deleteEvent(idToDelete)
      showSnackbar("Event deleted successfully", "success")
      fetchEvents()
    } catch (error) {
      console.error("Failed to delete event:", error)
      showSnackbar("Failed to delete event. Please try again.", "error")
    } finally {
      setDeleteConfirmOpen(false)
      handleMenuClose()
    }
  }

  const getEventStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "published":
        return "success"
      case "draft":
        return "warning"
      case "cancelled":
        return "error"
      default:
        return "info"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return dayjs(dateString).format("MMM D, YYYY")
  }

  const formatTime = (timeString) => {
    if (!timeString) return "N/A"
    try {
      const [hours, minutes] = timeString.split(":")
      const hour12 = hours % 12 || 12
      const ampm = hours >= 12 ? "PM" : "AM"
      return `${hour12}:${minutes} ${ampm}`
    } catch (error) {
      console.error("Error formatting time:", error)
      return timeString
    }
  }

  const getEventMedia = (eventId) => {
    return mediaMap[eventId] || { images: [], videos: [] }
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setDateRangeFilter({ start: null, end: null })
    setTicketTypeFilter("all")
    setShowUpcomingOnly(false)
  }

  const handleExportEvents = () => {
    // Create CSV content
    const headers = ["Title", "Date", "Time", "Location", "Status", "Capacity", "Price"]
    const csvContent = [
      headers.join(","),
      ...filteredEvents.map((event) =>
        [
          `"${event.title || "Untitled Event"}"`,
          formatDate(event.start_date),
          `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`,
          `"${event.location || "Online"}"`,
          event.status || "draft",
          event.capacity || "Unlimited",
          event.ticket_price || "Free",
        ].join(","),
      ),
    ].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `events-export-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showSnackbar("Events exported successfully", "success")
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setSelectedEvents([])
  }

  const currentTabEvents = eventsByTab[tabValue]

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut",
      },
    }),
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  }

  return (
    <ProtectedRoute>

      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          padding: { xs: "12px", md: "24px" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            elevation={6}
            variant="filled"
            sx={{
              width: "100%",
              "& .MuiAlert-message": {
                fontSize: "0.95rem",
              },
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <Box
          sx={{
            width: "100%",
            maxWidth: "1400px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#212529",
                  fontSize: { xs: "1.5rem", sm: "2rem" },
                }}
              >
                Your Events
              </Typography>
              <Tooltip title="Refresh events">
                <IconButton
                  onClick={refreshEvents}
                  disabled={refreshing}
                  sx={{
                    color: "#6c757d",
                    animation: refreshing ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                >
                  <FiRefreshCw />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {selectedEvents.length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<FiTrash2 />}
                  onClick={handleBulkDelete}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    boxShadow: "0 2px 4px rgba(220, 53, 69, 0.2)",
                    "&:hover": {
                      boxShadow: "0 4px 8px rgba(220, 53, 69, 0.3)",
                    },
                  }}
                >
                  Delete Selected ({selectedEvents.length})
                </Button>
              )}

              {!isMobile && filteredEvents.length > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<FiDownload />}
                  onClick={handleExportEvents}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    borderColor: "#6c757d",
                    color: "#6c757d",
                    "&:hover": {
                      borderColor: "#495057",
                      backgroundColor: "rgba(108, 117, 125, 0.04)",
                    },
                  }}
                >
                  Export
                </Button>
              )}

              <Button
                variant="contained"
                startIcon={<FiPlus />}
                onClick={handleCreateEvent}
                sx={{
                  backgroundColor: "#4f46e5",
                  color: "white",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  boxShadow: "0 4px 6px rgba(79, 70, 229, 0.2)",
                  "&:hover": {
                    backgroundColor: "#4338ca",
                    boxShadow: "0 6px 10px rgba(79, 70, 229, 0.3)",
                  },
                }}
              >
                Create Event
              </Button>
            </Box>
          </Box>

          {/* Search and Filter Bar */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <TextField
              id="search-events"
              placeholder="Search events..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flexGrow: 1,
                minWidth: { xs: "100%", sm: "250px" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "white",
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  },
                  "&.Mui-focused": {
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)",
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch color="#6c757d" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ color: "#6c757d" }}>
                      <FiX size={16} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                display: "flex",
                gap: 2,
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "space-between", sm: "flex-start" },
              }}
            >
              <Button
                variant="outlined"
                startIcon={<FiFilter />}
                onClick={() => (isMobile ? setFilterDrawerOpen(true) : setFilterOpen(true))}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  borderColor: "#dee2e6",
                  color: "#495057",
                  "&:hover": {
                    borderColor: "#adb5bd",
                    backgroundColor: "rgba(0,0,0,0.02)",
                  },
                }}
              >
                Filters
              </Button>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Grid view">
                  <IconButton
                    onClick={() => setViewMode("grid")}
                    sx={{
                      color: viewMode === "grid" ? "#4f46e5" : "#6c757d",
                      backgroundColor: viewMode === "grid" ? "rgba(79, 70, 229, 0.1)" : "transparent",
                    }}
                  >
                    <FiGrid />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List view">
                  <IconButton
                    onClick={() => setViewMode("list")}
                    sx={{
                      color: viewMode === "list" ? "#4f46e5" : "#6c757d",
                      backgroundColor: viewMode === "list" ? "rgba(79, 70, 229, 0.1)" : "transparent",
                    }}
                  >
                    <FiList />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {(searchQuery ||
              statusFilter !== "all" ||
              dateRangeFilter.start ||
              dateRangeFilter.end ||
              ticketTypeFilter !== "all" ||
              showUpcomingOnly) && (
                <Button
                  variant="text"
                  onClick={handleClearFilters}
                  sx={{
                    textTransform: "none",
                    color: "#6c757d",
                    width: { xs: "100%", sm: "auto" },
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: "#495057",
                    },
                  }}
                >
                  Clear filters
                </Button>
              )}
          </Box>

          {/* Tabs for event categories */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  color: "#6c757d",
                  "&.Mui-selected": {
                    color: "#4f46e5",
                    fontWeight: 600,
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#4f46e5",
                },
              }}
            >
              <Tab label={`Upcoming (${eventsByTab[0].length})`} id="tab-0" aria-controls="tabpanel-0" />
              <Tab label={`Past (${eventsByTab[1].length})`} id="tab-1" aria-controls="tabpanel-1" />
              <Tab label={`Drafts (${eventsByTab[2].length})`} id="tab-2" aria-controls="tabpanel-2" />
              <Tab label={`Cancelled (${eventsByTab[3].length})`} id="tab-3" aria-controls="tabpanel-3" />
            </Tabs>
          </Box>

          {/* Bulk Selection Checkbox */}
          {currentTabEvents.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedEvents.length === currentTabEvents.length && currentTabEvents.length > 0}
                    indeterminate={selectedEvents.length > 0 && selectedEvents.length < currentTabEvents.length}
                    onChange={handleSelectAllEvents}
                    sx={{
                      color: "#4f46e5",
                      "&.Mui-checked": {
                        color: "#4f46e5",
                      },
                    }}
                  />
                }
                label={`Select all (${selectedEvents.length}/${currentTabEvents.length})`}
              />
            </Box>
          )}

          {loading ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" },
                gap: "20px",
                width: "100%",
              }}
            >
              {[...Array(8)].map((_, index) => (
                <Card
                  key={index}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                  }}
                >
                  <Skeleton variant="rectangular" height={200} animation="wave" />
                  <CardContent>
                    <Skeleton variant="text" height={32} width="80%" animation="wave" />
                    <Skeleton variant="text" height={20} width="60%" animation="wave" />
                    <Box sx={{ display: "flex", gap: 1, mt: 1, mb: 2 }}>
                      <Skeleton variant="rectangular" height={24} width={60} animation="wave" sx={{ borderRadius: 4 }} />
                      <Skeleton variant="rectangular" height={24} width={60} animation="wave" sx={{ borderRadius: 4 }} />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                      <Skeleton variant="text" height={20} width="90%" animation="wave" />
                      <Skeleton variant="text" height={20} width="70%" animation="wave" />
                      <Skeleton variant="text" height={20} width="80%" animation="wave" />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
                      <Skeleton variant="rectangular" height={36} width="50%" animation="wave" sx={{ borderRadius: 1 }} />
                      <Skeleton variant="rectangular" height={36} width="50%" animation="wave" sx={{ borderRadius: 1 }} />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : currentTabEvents.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "calc(100vh - 300px)",
                  textAlign: "center",
                  padding: "20px",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <Box
                  component="img"
                  src="/placeholder.svg?height=120&width=120"
                  alt="No events"
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 3,
                    opacity: 0.7,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    color: "#495057",
                    marginBottom: "24px",
                    fontWeight: 500,
                  }}
                >
                  {searchQuery ||
                    statusFilter !== "all" ||
                    dateRangeFilter.start ||
                    dateRangeFilter.end ||
                    ticketTypeFilter !== "all"
                    ? "No events match your search criteria"
                    : tabValue === 0
                      ? "You don't have any upcoming events"
                      : tabValue === 1
                        ? "You don't have any past events"
                        : tabValue === 2
                          ? "You don't have any draft events"
                          : "You don't have any cancelled events"}
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<FiRefreshCw />}
                    onClick={fetchEvents}
                    sx={{
                      borderRadius: "8px",
                      padding: "10px 20px",
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: "0.9rem",
                    }}
                  >
                    Refresh Events
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<FiPlus />}
                    onClick={handleCreateEvent}
                    sx={{
                      backgroundColor: "#4f46e5",
                      color: "white",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      boxShadow: "0 4px 6px rgba(79, 70, 229, 0.2)",
                      "&:hover": {
                        backgroundColor: "#4338ca",
                        boxShadow: "0 6px 10px rgba(79, 70, 229, 0.3)",
                      },
                    }}
                  >
                    Create New Event
                  </Button>
                </Box>
              </Box>
            </motion.div>
          ) : viewMode === "grid" ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" },
                gap: "20px",
                width: "100%",
              }}
            >
              <AnimatePresence>
                {currentTabEvents.map((event, index) => {
                  const media = getEventMedia(event.id)
                  const allMedia = [
                    ...(media.images || []).map((img) => ({
                      id: img.id,
                      url: img.file_path,
                      type: `image/${img.type?.split("/").pop() || "jpeg"}`,
                    })),
                    ...(media.videos || []).map((vid) => ({
                      id: vid.id,
                      url: vid.file_path,
                      type: `video/${vid.type?.split("/").pop() || "mp4"}`,
                    })),
                  ]

                  return (
                    <motion.div
                      key={event.id}
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      whileHover={{
                        y: -5,
                        transition: {
                          duration: 0.2,
                          ease: "easeOut",
                        },
                      }}
                    >
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          borderRadius: "12px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          transition: "transform 0.3s, box-shadow 0.3s",
                          overflow: "hidden",
                          "&:hover": {
                            boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
                          },
                        }}
                      >
                        <Box sx={{ position: "relative" }}>
                          <Checkbox
                            checked={selectedEvents.includes(event.id)}
                            onChange={() => handleSelectEvent(event.id)}
                            sx={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              zIndex: 2,
                              color: "white",
                              "&.Mui-checked": {
                                color: "white",
                              },
                              "& .MuiSvgIcon-root": {
                                backgroundColor: "rgba(0,0,0,0.5)",
                                borderRadius: "50%",
                              },
                            }}
                          />
                          {allMedia.length > 0 ? (
                            <Box sx={{ position: "relative" }}>
                              <Carousel
                                showArrows={true}
                                showThumbs={false}
                                showStatus={false}
                                infiniteLoop
                                autoPlay
                                interval={5000}
                                transitionTime={500}
                                stopOnHover
                                emulateTouch
                                dynamicHeight={false}
                                swipeable
                                renderIndicator={(onClickHandler, isSelected, index, label) => (
                                  <Box
                                    component="li"
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      display: "inline-block",
                                      margin: "0 4px",
                                      backgroundColor: isSelected ? "#4f46e5" : "#ced4da",
                                      borderRadius: "50%",
                                      cursor: "pointer",
                                      transition: "background-color 0.3s",
                                      "&:hover": {
                                        backgroundColor: isSelected ? "#4f46e5" : "#adb5bd",
                                      },
                                    }}
                                    onClick={onClickHandler}
                                    onKeyDown={onClickHandler}
                                    value={index}
                                    key={index}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Slide ${index + 1} ${label}`}
                                  />
                                )}
                              >
                                {allMedia.map((mediaItem) => (
                                  <Box
                                    key={mediaItem.id}
                                    sx={{
                                      position: "relative",
                                      paddingTop: "56.25%", // 16:9 aspect ratio
                                      overflow: "hidden",
                                    }}
                                  >
                                    {mediaItem.type.startsWith("image/") ? (
                                      <CardMedia
                                        component="img"
                                        image={API_BASE_URL + mediaItem.url}
                                        alt={event.title}
                                        sx={{
                                          position: "absolute",
                                          top: 0,
                                          left: 0,
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      <video
                                        style={{
                                          position: "absolute",
                                          top: 0,
                                          left: 0,
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                        muted
                                        loop
                                        playsInline
                                      >
                                        <source src={API_BASE_URL + mediaItem.url} type={mediaItem.type} />
                                      </video>
                                    )}
                                  </Box>
                                ))}
                              </Carousel>
                              <Badge
                                badgeContent={allMedia.length > 1 ? `${allMedia.length}` : null}
                                color="primary"
                                overlap="circular"
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  "& .MuiBadge-badge": {
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    color: "white",
                                  },
                                }}
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                height: 0,
                                paddingTop: "56.25%", // 16:9 aspect ratio
                                backgroundColor: "#e9ecef",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                }}
                              >
                                No Media Available
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <CardContent
                          sx={{
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            padding: "16px",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "12px",
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                flexGrow: 1,
                                marginRight: "8px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {event.title || "Untitled Event"}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, event)}
                              sx={{
                                color: "#6c757d",
                                "&:hover": {
                                  backgroundColor: "rgba(0,0,0,0.05)",
                                },
                              }}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                              </svg>
                            </IconButton>
                          </Box>

                          <Box sx={{ display: "flex", gap: 1, marginBottom: "12px", flexWrap: "wrap" }}>
                            <Chip
                              label={event.status || "draft"}
                              size="small"
                              color={getEventStatusColor(event.status)}
                              sx={{
                                textTransform: "capitalize",
                                fontWeight: 500,
                              }}
                            />
                            <Chip
                              label={event.visibility || "public"}
                              size="small"
                              variant="outlined"
                              sx={{
                                textTransform: "capitalize",
                                fontWeight: 500,
                              }}
                            />
                            {event.ticket_type === "free" && (
                              <Chip
                                label="Free"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                            )}
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              marginBottom: "16px",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <FiCalendar size={14} color="#6c757d" />
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                                {formatDate(event.start_date)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <FiClock size={14} color="#6c757d" />
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                                {formatTime(event.start_time)} - {formatTime(event.end_time)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <FiMapPin size={14} color="#6c757d" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontSize: "0.85rem",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {event.location || "Online"}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <FiUsers size={14} color="#6c757d" />
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                                {event.capacity || "Unlimited"} Attendees
                              </Typography>
                            </Box>
                            {event.ticket_price && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <FiDollarSign size={14} color="#6c757d" />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                                  {event.ticket_price}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ marginTop: "auto", display: "flex", gap: 1 }}>
                            <Button
                              variant="outlined"
                              fullWidth
                              size="small"
                              startIcon={<FiEye size={14} />}
                              onClick={() => navigate(`/event/${event.id}`)}
                              sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                                fontSize: "0.8rem",
                                padding: "6px 12px",
                                borderColor: "#dee2e6",
                                color: "#495057",
                                "&:hover": {
                                  borderColor: "#adb5bd",
                                  backgroundColor: "rgba(0,0,0,0.02)",
                                },
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="contained"
                              fullWidth
                              size="small"
                              startIcon={<FiEdit2 size={14} />}
                              onClick={() => navigate(`/events/edit/${event.id}`)}
                              sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                                fontSize: "0.8rem",
                                padding: "6px 12px",
                                backgroundColor: "#4f46e5",
                                boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
                                "&:hover": {
                                  backgroundColor: "#4338ca",
                                  boxShadow: "0 4px 8px rgba(79, 70, 229, 0.3)",
                                },
                              }}
                            >
                              Edit
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </Box>
          ) : (
            // List view
            <Box sx={{ width: "100%" }}>
              <AnimatePresence>
                {currentTabEvents.map((event, index) => {
                  const media = getEventMedia(event.id)
                  const firstMedia = media.images?.[0] || media.videos?.[0]

                  return (
                    <motion.div
                      key={event.id}
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      <Paper
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", md: "row" },
                          mb: 2,
                          borderRadius: "12px",
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          transition: "transform 0.3s, box-shadow 0.3s",
                          "&:hover": {
                            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            width: { xs: "100%", md: "200px" },
                            height: { xs: "180px", md: "auto" },
                          }}
                        >
                          <Checkbox
                            checked={selectedEvents.includes(event.id)}
                            onChange={() => handleSelectEvent(event.id)}
                            sx={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              zIndex: 2,
                              color: "white",
                              "&.Mui-checked": {
                                color: "white",
                              },
                              "& .MuiSvgIcon-root": {
                                backgroundColor: "rgba(0,0,0,0.5)",
                                borderRadius: "50%",
                              },
                            }}
                          />
                          {firstMedia ? (
                            <CardMedia
                              component={firstMedia.type?.startsWith("image/") ? "img" : "video"}
                              src={API_BASE_URL + firstMedia.file_path}
                              alt={event.title}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#e9ecef",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                No Media
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Box
                          sx={{
                            p: 2,
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 1,
                            }}
                          >
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {event.title || "Untitled Event"}
                            </Typography>
                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, event)}>
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                              </svg>
                            </IconButton>
                          </Box>

                          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                            <Chip
                              label={event.status || "draft"}
                              size="small"
                              color={getEventStatusColor(event.status)}
                              sx={{ textTransform: "capitalize" }}
                            />
                            <Chip
                              label={event.visibility || "public"}
                              size="small"
                              variant="outlined"
                              sx={{ textTransform: "capitalize" }}
                            />
                            {event.ticket_type === "free" && (
                              <Chip label="Free" size="small" color="success" variant="outlined" />
                            )}
                          </Box>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                              gap: 2,
                              mb: 2,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <FiCalendar size={16} color="#6c757d" />
                              <Typography variant="body2">{formatDate(event.start_date)}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <FiClock size={16} color="#6c757d" />
                              <Typography variant="body2">
                                {formatTime(event.start_time)} - {formatTime(event.end_time)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <FiMapPin size={16} color="#6c757d" />
                              <Typography
                                variant="body2"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {event.location || "Online"}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <FiUsers size={16} color="#6c757d" />
                              <Typography variant="body2">{event.capacity || "Unlimited"} Attendees</Typography>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mt: "auto",
                              justifyContent: { xs: "center", sm: "flex-start" },
                            }}
                          >
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<FiEye />}
                              onClick={() => navigate(`/event/${event.id}`)}
                              sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<FiEdit2 />}
                              onClick={() => navigate(`/events/edit/${event.id}`)}
                              sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                                backgroundColor: "#4f46e5",
                                "&:hover": {
                                  backgroundColor: "#4338ca",
                                  boxShadow: "0 4px 8px rgba(79, 70, 229, 0.3)",
                                },
                              }}
                            >
                              Edit
                            </Button>
                            {event.status?.toLowerCase() === "published" && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<FiShare2 />}
                                onClick={() => {
                                  setShareLink(`${window.location.origin}/attendee/events/${event.id}`)
                                  setQrModalOpen(true)
                                }}
                                sx={{
                                  textTransform: "none",
                                  borderRadius: "8px",
                                }}
                              >
                                Share
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </Box>
          )}
        </Box>

        {/* QR Code Modal */}
        <Dialog open={qrModalOpen} onClose={() => setQrModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Share Event</Typography>
              <IconButton onClick={() => setQrModalOpen(false)}>
                <FiX />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: 3,
              }}
            >
              <Box
                sx={{
                  padding: 2,
                  border: "1px solid #eee",
                  borderRadius: 1,
                  marginBottom: 3,
                  backgroundColor: "white",
                }}
              >
                <QRCodeSVG
                  value={shareLink}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor={"#FFFFFF"}
                  fgColor={"#000000"}
                />
              </Box>

              <Typography variant="body1" sx={{ mb: 2 }}>
                Scan to view event
              </Typography>

              <TextField
                fullWidth
                value={shareLink}
                variant="outlined"
                size="small"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink)
                          showSnackbar("Link copied to clipboard!", "success")
                        }}
                        edge="end"
                      >
                        <FiCopy />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button variant="outlined" startIcon={<FiPrinter />} onClick={() => window.print()}>
                  Print
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FiDownload />}
                  onClick={() => {
                    // Create a canvas from the QR code and download it
                    const canvas = document.createElement("canvas")
                    const qrCodeSvg = document.querySelector("svg")
                    const svgData = new XMLSerializer().serializeToString(qrCodeSvg)
                    const img = new Image()
                    img.onload = () => {
                      canvas.width = img.width
                      canvas.height = img.height
                      const ctx = canvas.getContext("2d")
                      ctx.fillStyle = "white"
                      ctx.fillRect(0, 0, canvas.width, canvas.height)
                      ctx.drawImage(img, 0, 0)

                      const link = document.createElement("a")
                      link.download = "event-qrcode.png"
                      link.href = canvas.toDataURL("image/png")
                      link.click()
                    }
                    img.src = "data:image/svg+xml;base64," + btoa(svgData)
                  }}
                >
                  Download QR
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Attendee Lists Modal */}
        <Dialog
          open={attendeeListsModalOpen}
          onClose={() => {
            setAttendeeListsModalOpen(false)
            setTimeout(() => {
              setCurrentEventId(null)
              setSelectedEvent(null)
              setEventLists([])
              setAllLists([])
            }, 300)
          }}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
              <Typography
                variant="h6"
                fontSize={{ xs: "1rem", sm: "1.25rem" }}
                sx={{
                  flex: 1,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  pr: 1,
                }}
              >
                {loadingLists
                  ? "Loading..."
                  : selectedEvent && selectedEvent.title
                    ? `Manage Attendee Lists for "${selectedEvent.title}"`
                    : "Manage Attendee Lists"}
              </Typography>
              <IconButton onClick={() => setAttendeeListsModalOpen(false)}>
                <FiX />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ px: { xs: 2, sm: 4 }, py: 2 }}>
            {loadingLists ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Box mt={2}>
                {/* Attached Lists */}
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Attached Lists
                </Typography>

                {eventLists.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: "center", mb: 4, borderRadius: "8px" }}>
                    <Typography variant="body2" color="textSecondary">
                      No lists attached to this event
                    </Typography>
                  </Paper>
                ) : (
                  <Box mb={4} display="flex" flexDirection="column" gap={2}>
                    {eventLists.map((list) => (
                      <Paper
                        key={list.Id}
                        sx={{
                          p: 2,
                          width: "100%",
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          justifyContent: "space-between",
                          alignItems: { xs: "flex-start", sm: "center" },
                          gap: 1,
                          borderRadius: "8px",
                          transition: "box-shadow 0.2s",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        <Box sx={{ width: "100%" }}>
                          <Typography fontWeight={600} sx={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
                            {list.Name}
                          </Typography>
                          {list.Description && (
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                            >
                              {list.Description}
                            </Typography>
                          )}
                        </Box>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<FiTrash2 />}
                          onClick={() => handleDetachList(list.Id)}
                          sx={{
                            borderRadius: "8px",
                            textTransform: "none",
                          }}
                        >
                          Detach
                        </Button>
                      </Paper>
                    ))}
                  </Box>
                )}

                {/* Available Lists */}
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Available Lists
                </Typography>

                {!Array.isArray(allLists) ||
                  allLists.filter((list) => !eventLists.some((el) => el.Id === list.Id)).length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: "center", borderRadius: "8px" }}>
                    <Typography variant="body2" color="textSecondary">
                      No available lists to attach
                    </Typography>
                  </Paper>
                ) : (
                  <Box display="flex" flexDirection="column" gap={2}>
                    {allLists
                      .filter((list) => !eventLists.some((el) => el.Id === list.Id))
                      .map((list) => (
                        <Paper
                          key={list.Id}
                          sx={{
                            p: 2,
                            width: "100%",
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            justifyContent: "space-between",
                            alignItems: { xs: "flex-start", sm: "center" },
                            gap: 1,
                            cursor: "pointer",
                            borderRadius: "8px",
                            transition: "all 0.2s",
                            "&:hover": {
                              backgroundColor: "rgba(79, 70, 229, 0.04)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            },
                          }}
                          onClick={() => handleAttachList(list.Id)}
                        >
                          <Box sx={{ width: "100%" }}>
                            <Typography fontWeight={500} sx={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
                              {list.Name}
                            </Typography>
                            {list.Description && (
                              <Typography
                                variant="body2"
                                color="textSecondary"
                                sx={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                              >
                                {list.Description}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            variant="contained"
                            startIcon={<FiPlus />}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAttachList(list.Id)
                            }}
                            sx={{
                              borderRadius: "8px",
                              textTransform: "none",
                              backgroundColor: "#4f46e5",
                              "&:hover": {
                                backgroundColor: "#4338ca",
                              },
                            }}
                          >
                            Attach
                          </Button>
                        </Paper>
                      ))}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Event Modal */}
        <Modal
          open={modalOpen}
          onClose={() => !isCreating && !isCreatingAI && setModalOpen(false)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Paper
            sx={{
              width: { xs: "90%", sm: "80%", md: "600px" },
              maxWidth: "800px",
              height: { xs: "auto", md: "auto" },
              maxHeight: "90vh",
              padding: { xs: "20px", md: "32px" },
              borderRadius: "12px",
              outline: "none",
              overflow: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#212529",
                textAlign: "center",
                marginBottom: "24px",
                fontSize: { xs: "1.5rem", md: "2rem" },
              }}
            >
              How do you want to build your event?
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <Button
                variant="outlined"
                fullWidth
                onClick={handleStartFromScratch}
                disabled={isCreating}
                sx={{
                  padding: { xs: "16px", md: "24px" },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  borderColor: isCreating ? "#e9ecef" : "#dee2e6",
                  borderWidth: "2px",
                  textTransform: "none",
                  minHeight: { xs: "120px", md: "180px" },
                  backgroundColor: isCreating ? "#f8f9fa" : "transparent",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: isCreating ? "#f8f9fa" : "rgba(79, 70, 229, 0.04)",
                    borderColor: isCreating ? "#e9ecef" : "#4f46e5",
                    transform: isCreating ? "none" : "translateY(-4px)",
                    boxShadow: isCreating ? "none" : "0 6px 12px rgba(0,0,0,0.1)",
                  },
                }}
              >
                {isCreating ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <CircularProgress size={24} sx={{ color: "#4f46e5" }} />
                    <Typography
                      sx={{
                        color: "#6c757d",
                        fontSize: "0.875rem",
                      }}
                    >
                      Creating your event...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: "#212529",
                        marginBottom: "8px",
                        fontSize: { xs: "1rem", md: "1.25rem" },
                      }}
                    >
                      Start from scratch
                    </Typography>
                    <Typography
                      sx={{
                        color: "#6c757d",
                        textAlign: "center",
                        fontSize: { xs: "0.875rem", md: "1rem" },
                      }}
                    >
                      Add all your event details, create new tickets, and set up recurring events
                    </Typography>
                  </>
                )}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={handleCreateWithAI}
                disabled={isCreatingAI}
                sx={{
                  padding: { xs: "16px", md: "24px" },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderRadius: "12px",
                  borderColor: "#dee2e6",
                  borderWidth: "2px",
                  textTransform: "none",
                  minHeight: { xs: "120px", md: "180px" },
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: isCreatingAI ? "#e9ecef" : "#4f46e5",
                    backgroundColor: isCreatingAI ? "#f8f9fa" : "rgba(79, 70, 229, 0.04)",
                    transform: isCreatingAI ? "none" : "translateY(-4px)",
                    boxShadow: isCreatingAI ? "none" : "0 6px 12px rgba(0,0,0,0.1)",
                  },
                }}
              >
                {isCreatingAI ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <CircularProgress size={24} sx={{ color: "#4f46e5" }} />
                    <Typography
                      sx={{
                        color: "#6c757d",
                        fontSize: "0.875rem",
                      }}
                    >
                      Creating your event with AI...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: "#212529",
                        marginBottom: "8px",
                        fontSize: { xs: "1rem", md: "1.25rem" },
                      }}
                    >
                      Create my event faster with AI
                    </Typography>
                    <Typography
                      sx={{
                        color: "#6c757d",
                        textAlign: "center",
                        fontSize: { xs: "0.875rem", md: "1rem" },
                      }}
                    >
                      Answer a few quick questions to generate an event that's ready to publish almost instantly
                    </Typography>
                  </>
                )}
              </Button>
            </Box>
          </Paper>
        </Modal>

        {/* Filter Modal */}
        <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6" fontWeight={600}>
              Filter Events
            </Typography>
            <IconButton onClick={() => setFilterOpen(false)}>
              <FiX />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Status
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {["all", "draft", "published", "cancelled"].map((status) => (
                    <Chip
                      key={status}
                      label={status.charAt(0).toUpperCase() + status.slice(1)}
                      onClick={() => setStatusFilter(status)}
                      variant={statusFilter === status ? "filled" : "outlined"}
                      color={status === "all" ? "default" : getEventStatusColor(status)}
                      sx={{
                        textTransform: "capitalize",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Ticket Type
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {["all", "free", "paid"].map((type) => (
                    <Chip
                      key={type}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      onClick={() => setTicketTypeFilter(type)}
                      variant={ticketTypeFilter === type ? "filled" : "outlined"}
                      color={type === "all" ? "default" : "primary"}
                      sx={{
                        textTransform: "capitalize",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Date Range
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    value={dateRangeFilter.start || ""}
                    onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    value={dateRangeFilter.end || ""}
                    onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showUpcomingOnly}
                      onChange={(e) => setShowUpcomingOnly(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show upcoming events only"
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: "16px 24px" }}>
            <Button onClick={handleClearFilters} sx={{ mr: "auto" }}>
              Clear all
            </Button>
            <Button
              onClick={() => setFilterOpen(false)}
              variant="contained"
              sx={{
                backgroundColor: "#4f46e5",
                "&:hover": {
                  backgroundColor: "#4338ca",
                },
              }}
            >
              Apply filters
            </Button>
          </DialogActions>
        </Dialog>

        {/* Filter Drawer (Mobile) */}
        <Drawer
          anchor="bottom"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              maxHeight: "80vh",
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Filter Events
              </Typography>
              <IconButton onClick={() => setFilterDrawerOpen(false)}>
                <FiX />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Status
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {["all", "draft", "published", "cancelled"].map((status) => (
                    <Chip
                      key={status}
                      label={status.charAt(0).toUpperCase() + status.slice(1)}
                      onClick={() => setStatusFilter(status)}
                      variant={statusFilter === status ? "filled" : "outlined"}
                      color={status === "all" ? "default" : getEventStatusColor(status)}
                      sx={{
                        textTransform: "capitalize",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Ticket Type
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {["all", "free", "paid"].map((type) => (
                    <Chip
                      key={type}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      onClick={() => setTicketTypeFilter(type)}
                      variant={ticketTypeFilter === type ? "filled" : "outlined"}
                      color={type === "all" ? "default" : "primary"}
                      sx={{
                        textTransform: "capitalize",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Date Range
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    fullWidth
                    value={dateRangeFilter.start || ""}
                    onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    fullWidth
                    value={dateRangeFilter.end || ""}
                    onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showUpcomingOnly}
                      onChange={(e) => setShowUpcomingOnly(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show upcoming events only"
                />
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button fullWidth onClick={handleClearFilters} variant="outlined">
                Clear all
              </Button>
              <Button
                fullWidth
                onClick={() => setFilterDrawerOpen(false)}
                variant="contained"
                sx={{
                  backgroundColor: "#4f46e5",
                  "&:hover": {
                    backgroundColor: "#4338ca",
                  },
                }}
              >
                Apply filters
              </Button>
            </Box>
          </Box>
        </Drawer>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>
            Delete {selectedEvents.length > 1 ? `${selectedEvents.length} Events` : "Event"}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {selectedEvents.length > 1
                ? `Are you sure you want to delete ${selectedEvents.length} selected events? This action cannot be undone.`
                : `Are you sure you want to delete "${selectedEvent?.title || (events.find((e) => e.id === selectedEvents[0])?.title ?? "this event")
                }"? This action cannot be undone.`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              onClick={selectedEvents.length > 1 ? handleDeleteConfirmed : handleDeleteEvent}
              color="error"
              variant="contained"
              sx={{
                textTransform: "none",
                boxShadow: "0 2px 4px rgba(220, 53, 69, 0.2)",
                "&:hover": {
                  boxShadow: "0 4px 8px rgba(220, 53, 69, 0.3)",
                },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Event Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              width: 220,
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              padding: "4px 0",
            },
          }}
        >
          <MenuItem onClick={handleViewEvent} sx={{ padding: "8px 16px" }}>
            <FiEye size={16} style={{ marginRight: "8px" }} />
            <Typography variant="body2">View</Typography>
          </MenuItem>
          <MenuItem onClick={handleEditEvent} sx={{ padding: "8px 16px" }}>
            <FiEdit2 size={16} style={{ marginRight: "8px" }} />
            <Typography variant="body2">Edit</Typography>
          </MenuItem>

          {/* Share QR Code Menu Item */}
          <MenuItem
            onClick={() => {
              setShareLink(`${window.location.origin}/attendee/events/${selectedEvent.id}/self-checkin`)
              setQrModalOpen(true)
              handleMenuClose()
            }}
            sx={{ padding: "8px 16px" }}
          >
            <FiShare2 size={16} style={{ marginRight: "8px" }} />
            <Typography variant="body2">Share QR Code</Typography>
          </MenuItem>

          {/* Copy Share Link Menu Item */}
          <MenuItem
            onClick={() => {
              const link = `${window.location.origin}/events/${selectedEvent.id}`
              navigator.clipboard.writeText(link)
              showSnackbar("Link copied to clipboard!", "success")
              handleMenuClose()
            }}
            sx={{ padding: "8px 16px" }}
          >
            <FiLink size={16} style={{ marginRight: "8px" }} />
            <Typography variant="body2">Copy Share Link</Typography>
          </MenuItem>

          {/* {selectedEvent && selectedEvent.visibility === "private" && ( */}
          {selectedEvent && (



            <MenuItem
              onClick={() => {
                navigate(`/events/${selectedEvent.id}/send-invites`)
                handleMenuClose()
              }}
              sx={{ padding: "8px 16px" }}
            >
              <FiSend size={16} style={{ marginRight: "8px" }} />
              <Typography variant="body2">Send Invites</Typography>
            </MenuItem>

          )}

          {selectedEvent && selectedEvent.visibility === "private" && (
            <MenuItem
              onClick={() => {
                handleOpenAttendeeLists(selectedEvent)
                handleMenuClose()
              }}
              sx={{ padding: "8px 16px" }}
            >
              <FiUsers size={16} style={{ marginRight: "8px" }} />
              <Typography variant="body2">Manage Attendee Lists</Typography>
            </MenuItem>

          )}
          <Divider />
          <MenuItem
            onClick={handleDeleteClick}
            disabled={selectedEvent?.status?.toLowerCase() === "published"}
            sx={{
              padding: "8px 16px",
              color: selectedEvent?.status?.toLowerCase() === "published" ? "text.disabled" : "#dc3545",
              "&:hover": {
                backgroundColor:
                  selectedEvent?.status?.toLowerCase() === "published" ? "transparent" : "rgba(220, 53, 69, 0.04)",
              },
            }}
          >
            <FiTrash2 size={16} style={{ marginRight: "8px" }} />
            <Typography variant="body2">Delete</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </ProtectedRoute>

  )
}

export default EventsPage
