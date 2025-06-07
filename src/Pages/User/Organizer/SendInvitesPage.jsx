"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  TextField,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Avatar,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Tooltip,
  Badge,
  Fade,
  Zoom,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Skeleton,
  LinearProgress,
  Backdrop,
  Drawer,
  AppBar,
  Toolbar,
} from "@mui/material"
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  Preview as PreviewIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  Send as SendIcon,
  FormatColorText as FormatColorTextIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
} from "@mui/icons-material"
import eventService from "../../../Services/eventServices"
import listService from "../../../Services/listServices"

// Message templates
const MESSAGE_TEMPLATES = [
  {
    id: "default",
    name: "Default Invitation",
    content: (eventTitle) => `Hi there,

I'd like to invite you to ${eventTitle || "our upcoming event"}!

Looking forward to seeing you there!`,
  },
  {
    id: "formal",
    name: "Formal Invitation",
    content: (eventTitle) => `Dear Invitee,

You are cordially invited to attend ${eventTitle || "our upcoming event"}.

We would be honored by your presence.

Kind regards,`,
  },
  {
    id: "casual",
    name: "Casual Invitation",
    content: (eventTitle) => `Hey!

We're having ${eventTitle || "an event"} and would love for you to join us!

Hope to see you there!

Cheers,`,
  },
  {
    id: "reminder",
    name: "Reminder",
    content: (eventTitle) => `Hi there,

This is a friendly reminder about ${eventTitle || "our upcoming event"}.

Don't forget to RSVP!

Thanks,`,
  },
]

const SendInvitesPage = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"))

  // State variables
  const [loading, setLoading] = useState(true)
  const [attendees, setAttendees] = useState([])
  const [filteredAttendees, setFilteredAttendees] = useState([])
  const [selectedAttendees, setSelectedAttendees] = useState([])
  const [lists, setLists] = useState([])
  const [selectedList, setSelectedList] = useState("")
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [tabValue, setTabValue] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [eventDetails, setEventDetails] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })
  const [filter, setFilter] = useState("all") // 'all', 'email', 'sms'
  const [activeStep, setActiveStep] = useState(0)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [confirmSendOpen, setConfirmSendOpen] = useState(false)
  const [sendMethod, setSendMethod] = useState(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Update the getInviteFullMessage function to properly access event details
  const getInviteFullMessage = () => {
    if (!eventDetails) return message

    // Format date nicely if available
    let formattedDate = "TBD"
    let formattedTime = ""

    if (eventDetails?.start_date) {
      try {
        const date = new Date(eventDetails.start_date)
        formattedDate = date.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        if (eventDetails?.start_time) {
          formattedTime = ` from ${eventDetails.start_time}`
          if (eventDetails?.end_time) {
            formattedTime += ` to ${eventDetails.end_time}`
          }
        }
      } catch (error) {
        console.error("Error formatting date:", error)
      }
    }
    // Generate the invite link with event details
    const inviteLink = `${window.location.origin}/event/${eventId}/invite/${attendees.length > 0 ? attendees[0].Phone : ""}`
console.log(inviteLink)
    // Append event details and link to the user's message
    return `${message}

----- EVENT DETAILS -----
Event: ${eventDetails?.title || "Your Event"}
Date: ${formattedDate}${formattedTime}
Location: ${eventDetails?.location || "TBD"}
${eventDetails?.description ? `\nDescription: ${eventDetails.description.substring(0, 100)}${eventDetails.description.length > 100 ? "..." : ""}` : ""}

RSVP Link: ${inviteLink}
`
  }

  // SMS character count
  const smsCharCount = useMemo(() => {
    const fullMessage = getInviteFullMessage()
    return fullMessage ? fullMessage.length : 0
  }, [message, eventDetails])

  // Default invitation message template
  const getDefaultMessage = () => {
    return MESSAGE_TEMPLATES[0].content(eventDetails?.title)
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await fetchData()
      showSnackbar("Data refreshed successfully", "success")
    } catch (error) {
      console.error("Error refreshing data:", error)
      showSnackbar("Failed to refresh data", "error")
    } finally {
      setRefreshing(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch event details
      const event = await eventService.getEventById(eventId)
      console.log("Fetched event details:", event)

      // Fix: Check if event is an array and extract the first item
      if (Array.isArray(event) && event.length > 0) {
        setEventDetails(event[0])
        console.log("Using event details:", event[0])
      } else {
        setEventDetails(event)
      }

      // Fetch all available lists for the user
      const allLists = await eventService.getEventAttendeeLists(eventId)
      setLists(allLists.filter((list) => !list.isArchived))

      // Fetch attendees from attached lists
      const eventLists = await eventService.getEventAttendeeLists(eventId)

      if (eventLists && eventLists.length > 0) {
        const attendeesData = await Promise.all(
          eventLists.map((list) => {
            const listId = list.id || list.Id
            if (!listId) {
              console.error("List has no ID:", list)
              return []
            }
            return listService.getListAttendees(listId)
          }),
        )

        // Deduplicate attendees by ID
        const uniqueAttendees = []
        const attendeeIds = new Set()

        attendeesData.flat().forEach((attendee) => {
          if (!attendeeIds.has(attendee.Id)) {
            attendeeIds.add(attendee.Id)
            uniqueAttendees.push(attendee)
          }
        })

        setAttendees(uniqueAttendees)
        setFilteredAttendees(uniqueAttendees)
      } else {
        setAttendees([])
        setFilteredAttendees([])
      }

      // Set default message after event details are loaded
      setTimeout(() => {
        setMessage(getDefaultMessage())
      }, 100)
    } catch (error) {
      console.error("Error fetching data:", error)
      showSnackbar("Failed to load data", "error")
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [eventId])

  // Apply filters and search to attendees
  useEffect(() => {
    let result = [...attendees]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (attendee) =>
          `${attendee.FirstName} ${attendee.LastName}`.toLowerCase().includes(query) ||
          (attendee.Email && attendee.Email.toLowerCase().includes(query)) ||
          (attendee.Phone && attendee.Phone.toLowerCase().includes(query)),
      )
    }

    // Apply contact method filter
    if (filter === "email") {
      result = result.filter((attendee) => attendee.Email && attendee.Email.trim() !== "")
    } else if (filter === "sms") {
      result = result.filter((attendee) => attendee.Phone && attendee.Phone.trim() !== "")
    }

    setFilteredAttendees(result)
  }, [attendees, searchQuery, filter])

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity })
  }

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const handleSelectAttendee = (attendeeId) => {
    setSelectedAttendees((prev) =>
      prev.includes(attendeeId) ? prev.filter((id) => id !== attendeeId) : [...prev, attendeeId],
    )
  }

  const handleSelectAllAttendees = () => {
    if (selectedAttendees.length === filteredAttendees.length) {
      setSelectedAttendees([])
    } else {
      setSelectedAttendees(filteredAttendees.map((a) => a.Id))
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
  }

  const getPreviewMessage = (attendee) => {
    // Get the full message with event details and link
    const fullMessage = getInviteFullMessage()

    // Personalize with attendee name if available
    if (attendee) {
      return fullMessage.replace("Hi there,", `Hi ${attendee.FirstName},`)
    }
    return fullMessage
  }

  // Add a new function to format phone numbers (add this after the getPreviewMessage function)
  const formatPhoneNumber = (phone) => {
    if (!phone) return phone
    // Replace leading 0 with +92
    if (phone.startsWith("0")) {
      return "+92" + phone.substring(1)
    }
    return phone
  }

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/event/${eventId}/invite`
    navigator.clipboard.writeText(inviteLink)
    showSnackbar("Invite link copied to clipboard", "success")
  }

  const handleSendInvites = async (method) => {
    if (selectedAttendees.length === 0) {
      showSnackbar("Please select at least one attendee", "warning")
      return
    }

    if (!message.trim()) {
      showSnackbar("Please enter a message", "warning")
      return
    }

    try {
      setSending(true)
      const selected = attendees.filter((a) => selectedAttendees.includes(a.Id))

      // Filter attendees based on contact method availability
      const validAttendees = selected.filter((attendee) =>
        method === "email"
          ? attendee.Email && attendee.Email.trim() !== ""
          : attendee.Phone && attendee.Phone.trim() !== "",
      )

      if (validAttendees.length === 0) {
        showSnackbar(
          `No selected attendees have ${method === "email" ? "email addresses" : "phone numbers"}`,
          "warning",
        )
        setSending(false)
        return
      }

      // Send invites with personalized messages
      const responses = await Promise.all(
        validAttendees.map((attendee) => {
          // Personalize message for each attendee
          const personalMessage = message.replace("Hi there,", `Hi ${attendee.FirstName},`)

          // Get the full message with event details and link
          const fullMessage = getInviteFullMessage().replace("Hi there,", `Hi ${attendee.FirstName},`)

          if (method === "email") {
            return listService.sendEmailInvite(eventId, attendee.Id, fullMessage)
          } else {
            // Format phone number for SMS
            const formattedPhone = formatPhoneNumber(attendee.Phone)
            console.log(`Formatting phone: ${attendee.Phone} → ${formattedPhone}`)
            // Use the formatted phone number in your service
            return listService.sendSmsInvite(eventId, attendee.Id, fullMessage, formattedPhone)
          }
          
        }),
      )

      const successCount = responses.filter((r) => r && r.success).length
      
      showSnackbar(`Successfully sent ${successCount} ${method === "email" ? "email" : "SMS"} invites`, "success")

      // Clear selection after successful send
      setSelectedAttendees([])
      setActiveStep(0) // Reset stepper
    } catch (error) {
      console.error("Error sending invites:", error)
      showSnackbar("Failed to send invites", "error")
    } finally {
      setSending(false)
      setConfirmSendOpen(false)
    }
  }

  const handleSendListInvites = async (method) => {
    if (!selectedList) {
      showSnackbar("Please select a list", "warning")
      return
    }

    if (!message.trim()) {
      showSnackbar("Please enter a message", "warning")
      return
    }

    try {
      setSending(true)

      const fullMessage = getInviteFullMessage()

      let response
      if (method === "email") {
        response = await listService.sendListInvites(eventId, selectedList, fullMessage, method)
      } else {
        // For SMS, pass a flag or parameter indicating phone numbers should be formatted
        response = await listService.sendListInvites(eventId, selectedList, fullMessage, method, true)
        console.log("Sending SMS with formatted phone numbers (+92 instead of leading 0)")
      }

      if (response && response.count) {
        showSnackbar(
          `Successfully sent ${response.count} ${method === "email" ? "email" : "SMS"} invites to list`,
          "success",
        )
      } else {
        showSnackbar(
          `No ${method === "email" ? "email" : "SMS"} invites were sent. Please check that list members have contact information.`,
          "warning",
        )
      }
      setActiveStep(0) // Reset stepper
    } catch (error) {
      console.error("Error sending list invites:", error)
      showSnackbar("Failed to send list invites", "error")
    } finally {
      setSending(false)
      setConfirmSendOpen(false)
    }
  }

  // Get attendee stats
  const getAttendeeStats = () => {
    const withEmail = attendees.filter((a) => a.Email && a.Email.trim() !== "").length
    const withPhone = attendees.filter((a) => a.Phone && a.Phone.trim() !== "").length

    return {
      total: attendees.length,
      withEmail,
      withPhone,
      selected: selectedAttendees.length,
    }
  }

  const stats = getAttendeeStats()

  const handleApplyTemplate = (templateId) => {
    const template = MESSAGE_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      setMessage(template.content(eventDetails?.title))
    }
    setTemplateDialogOpen(false)
  }

  const handleConfirmSend = (method) => {
    setSendMethod(method)
    setConfirmSendOpen(true)
  }

  const executeConfirmedSend = () => {
    if (tabValue === 0) {
      handleSendInvites(sendMethod)
    } else {
      handleSendListInvites(sendMethod)
    }
  }

  // Update the preview dialog to show the correct event details
  const renderPreviewDialog = () => {
    // Get a sample attendee for preview if any are selected
    const sampleAttendee = selectedAttendees.length > 0 ? attendees.find((a) => a.Id === selectedAttendees[0]) : null

    return (
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6">Invitation Preview</Typography>
            {sampleAttendee && (
              <Typography variant="subtitle2" color="text.secondary">
                Personalized for: {sampleAttendee.FirstName} {sampleAttendee.LastName}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: "#f9f9f9",
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              position: "relative",
            }}
          >
            {/* Email header styling */}
            <Box
              sx={{
                mb: 3,
                pb: 2,
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: theme.palette.primary.main,
                mx: -3,
                mt: -3,
                p: 3,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                color: "white",
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="500">
                {eventDetails?.title || "Event Invitation"}
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                {eventDetails?.start_date && (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CalendarIcon sx={{ mr: 1, color: "white" }} />
                    <Typography>
                      {new Date(eventDetails.start_date).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {eventDetails?.start_time && ` from ${eventDetails.start_time}`}
                      {eventDetails?.end_time && ` to ${eventDetails.end_time}`}
                    </Typography>
                  </Box>
                )}

                {eventDetails?.location && (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <LocationIcon sx={{ mr: 1, color: "white" }} />
                    <Typography>{eventDetails.location}</Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Message content */}
            <Typography
              sx={{
                whiteSpace: "pre-line",
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                mb: 4,
                fontSize: "1rem",
                lineHeight: 1.6,
              }}
            >
              {getPreviewMessage(sampleAttendee).split("----- EVENT DETAILS -----")[0]}
            </Typography>

            {/* Event details section */}
            <Box
              sx={{
                backgroundColor: "#f0f4f8",
                p: 2,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                Event Details
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  <CalendarIcon sx={{ mr: 1, color: "primary.main", mt: 0.5 }} />
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      Date & Time
                    </Typography>
                    <Typography variant="body2">
                      {eventDetails?.start_date
                        ? new Date(eventDetails.start_date).toLocaleDateString(undefined, {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "TBD"}
                      {eventDetails?.start_time && ` from ${eventDetails.start_time}`}
                      {eventDetails?.end_time && ` to ${eventDetails.end_time}`}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  <LocationIcon sx={{ mr: 1, color: "primary.main", mt: 0.5 }} />
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      Location
                    </Typography>
                    <Typography variant="body2">{eventDetails?.location || "TBD"}</Typography>
                  </Box>
                </Box>

                {eventDetails?.description && (
                  <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <InfoIcon sx={{ mr: 1, color: "primary.main", mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" fontWeight="500">
                        Description
                      </Typography>
                      <Typography variant="body2">
                        {eventDetails.description.substring(0, 100)}
                        {eventDetails.description.length > 100 ? "..." : ""}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            {/* RSVP button */}
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CheckCircleOutlineIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: "1rem",
                  textTransform: "none",
                  boxShadow: theme.shadows[4],
                }}
              >
                RSVP Now
              </Button>

              <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LinkIcon sx={{ mr: 1, color: "text.secondary", fontSize: "0.9rem" }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontFamily: "monospace",
                  }}
                >
                  {`${window.location.origin}/event/${eventId}/invite`}
                </Typography>
                <IconButton size="small" onClick={handleCopyInviteLink} sx={{ ml: 0.5 }}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPreviewOpen(false)} variant="outlined">
            Close
          </Button>
          <Button onClick={handleCopyInviteLink} startIcon={<CopyIcon />} variant="outlined" color="primary">
            Copy Invite Link
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  const renderTemplateDialog = () => (
    <Dialog
      open={templateDialogOpen}
      onClose={() => setTemplateDialogOpen(false)}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
    >
      <DialogTitle>
        <Typography variant="h6">Choose Message Template</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {MESSAGE_TEMPLATES.map((template) => (
            <Card
              key={template.id}
              variant="outlined"
              sx={{
                cursor: "pointer",
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                },
              }}
              onClick={() => handleApplyTemplate(template.id)}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                  {template.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-line",
                    color: "text.secondary",
                    maxHeight: "100px",
                    overflow: "hidden",
                  }}
                >
                  {template.content(eventDetails?.title)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  )

  const renderConfirmSendDialog = () => (
    <Dialog
      open={confirmSendOpen}
      onClose={() => setConfirmSendOpen(false)}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Zoom}
    >
      <DialogTitle>
        <Typography variant="h6">Confirm Send</Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" paragraph>
            You are about to send {sendMethod === "email" ? "email" : "SMS"} invitations to:
          </Typography>

          {tabValue === 0 ? (
            <Typography variant="body1" fontWeight="500">
              {selectedAttendees.length} selected attendees
            </Typography>
          ) : (
            <Typography variant="body1" fontWeight="500">
              {lists.find((l) => l.Id === selectedList)?.Name || "Selected list"}
            </Typography>
          )}

          {sendMethod === "sms" && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                SMS message length: {smsCharCount} characters
                {smsCharCount > 160 && " (may be sent as multiple messages)"}
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmSendOpen(false)} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={executeConfirmedSend}
          variant="contained"
          color="primary"
          startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
          disabled={sending}
        >
          {sending ? "Sending..." : "Send Now"}
        </Button>
      </DialogActions>
    </Dialog>
  )

  const renderMobileDrawer = () => (
    <Drawer
      anchor="right"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      PaperProps={{
        sx: { width: "85%", maxWidth: "400px" },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Invitation Message</Typography>
          <IconButton onClick={() => setMobileDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <TextField
          multiline
          minRows={8}
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your invitation message here..."
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Button
            size="small"
            onClick={() => setMessage(getDefaultMessage())}
            disabled={message === getDefaultMessage()}
            variant="outlined"
          >
            Reset
          </Button>

          <Button
            size="small"
            onClick={() => setTemplateDialogOpen(true)}
            variant="outlined"
            startIcon={<FormatColorTextIcon />}
          >
            Templates
          </Button>
        </Box>

        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={() => setPreviewOpen(true)}
          startIcon={<PreviewIcon />}
          sx={{ mb: 2 }}
        >
          Preview Invitation
        </Button>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          SMS Character Count: {smsCharCount}
          {smsCharCount > 160 && <Chip size="small" color="warning" label="Multiple SMS" sx={{ ml: 1 }} />}
        </Typography>
      </Box>
    </Drawer>
  )

  const renderStepper = () => {
    const steps = ["Select Recipients", "Compose Message", "Send Invitations"]

    return (
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3, display: { xs: "none", md: "flex" } }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    )
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, position: "relative" }}>
      {/* Mobile app bar */}
      {isMobile && (
        <AppBar position="static" color="default" elevation={1} sx={{ mb: 2, borderRadius: 1 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              Send Invites
            </Typography>
            <IconButton color="inherit" onClick={refreshData} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Desktop header */}
      {!isMobile && (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} variant="outlined" sx={{ mr: 2 }}>
                Back
              </Button>
              <Typography variant="h4">
                Send Invites
                {eventDetails?.title && (
                  <Typography component="span" variant="h5" color="primary" sx={{ ml: 1 }}>
                    for {eventDetails.title}
                  </Typography>
                )}
              </Typography>
            </Box>
            <Button
              startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={refreshData}
              disabled={refreshing}
              variant="outlined"
            >
              Refresh
            </Button>
          </Box>

          {renderStepper()}
        </>
      )}

      {/* Loading state */}
      {loading && (
        <Box sx={{ width: "100%", mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Main content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 3,
        }}
      >
        {/* Left side - Attendees */}
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            flex: { xs: 1, lg: 2 },
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            boxShadow: theme.shadows[2],
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="h6">
              Attendees
              <Chip label={`${stats.total} total`} size="small" sx={{ ml: 1 }} color="primary" variant="outlined" />
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Show attendees with email">
                <Chip
                  icon={<EmailIcon fontSize="small" />}
                  label={`${stats.withEmail}`}
                  size="small"
                  color={filter === "email" ? "primary" : "default"}
                  onClick={() => handleFilterChange(filter === "email" ? "all" : "email")}
                  clickable
                  variant={filter === "email" ? "filled" : "outlined"}
                />
              </Tooltip>
              <Tooltip title="Show attendees with phone">
                <Chip
                  icon={<PhoneIcon fontSize="small" />}
                  label={`${stats.withPhone}`}
                  size="small"
                  color={filter === "sms" ? "primary" : "default"}
                  onClick={() => handleFilterChange(filter === "sms" ? "all" : "sms")}
                  clickable
                  variant={filter === "sms" ? "filled" : "outlined"}
                />
              </Tooltip>
            </Box>
          </Box>

          {/* Search and filter */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search attendees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              size="small"
              variant="outlined"
            />
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, py: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="rectangular" height={60} animation="wave" />
              ))}
            </Box>
          ) : filteredAttendees.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: "center",
                backgroundColor: "#f5f5f5",
                borderRadius: 2,
              }}
            >
              <Typography color="textSecondary" paragraph>
                {attendees.length === 0
                  ? "No attendees found for this event"
                  : "No attendees match your search or filter criteria"}
              </Typography>
              {filter !== "all" && (
                <Button onClick={() => setFilter("all")} variant="outlined" size="small" startIcon={<FilterListIcon />}>
                  Clear Filters
                </Button>
              )}
            </Paper>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedAttendees.length === filteredAttendees.length && filteredAttendees.length > 0}
                      indeterminate={
                        selectedAttendees.length > 0 && selectedAttendees.length < filteredAttendees.length
                      }
                      onChange={handleSelectAllAttendees}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Select all shown ({selectedAttendees.length}/{filteredAttendees.length})
                    </Typography>
                  }
                />

                {selectedAttendees.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => setSelectedAttendees([])}
                    startIcon={<CloseIcon />}
                    variant="outlined"
                    color="inherit"
                  >
                    Clear
                  </Button>
                )}
              </Box>

              <Box
                sx={{
                  flex: 1,
                  maxHeight: { xs: "40vh", md: "60vh" },
                  overflow: "auto",
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                }}
              >
                {filteredAttendees.map((attendee) => (
                  <Card
                    key={attendee.Id}
                    sx={{
                      mb: 0.5,
                      mx: 0.5,
                      mt: 0.5,
                      backgroundColor: selectedAttendees.includes(attendee.Id) ? "rgba(25, 118, 210, 0.08)" : "white",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: selectedAttendees.includes(attendee.Id)
                          ? "rgba(25, 118, 210, 0.12)"
                          : "rgba(0, 0, 0, 0.04)",
                        transform: "translateY(-1px)",
                        boxShadow: 1,
                      },
                      borderLeft: selectedAttendees.includes(attendee.Id)
                        ? `4px solid ${theme.palette.primary.main}`
                        : "4px solid transparent",
                    }}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Checkbox
                          checked={selectedAttendees.includes(attendee.Id)}
                          onChange={() => handleSelectAttendee(attendee.Id)}
                          icon={<RadioButtonUncheckedIcon />}
                          checkedIcon={<CheckCircleIcon />}
                          color="primary"
                        />

                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: selectedAttendees.includes(attendee.Id) ? "primary.main" : "grey.400",
                            mr: 1.5,
                            boxShadow: 1,
                          }}
                        >
                          {attendee.FirstName?.[0] || "?"}
                        </Avatar>

                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight={500}>
                            {attendee.FirstName} {attendee.LastName}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                            {attendee.Email && (
                              <Chip
                                icon={<EmailIcon fontSize="small" />}
                                label={attendee.Email}
                                size="small"
                                variant="outlined"
                                sx={{ maxWidth: "100%", overflow: "hidden" }}
                              />
                            )}
                            {attendee.Phone && (
                              <Chip
                                icon={<PhoneIcon fontSize="small" />}
                                label={attendee.Phone}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </>
          )}
        </Paper>

        {/* Right side - Message and Send Options */}
        <Box
          sx={{
            flex: { xs: 1, lg: 1.5 },
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {/* Message Composer - Desktop */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              display: { xs: isMobile ? "none" : "block", md: "block" },
              borderRadius: 2,
              boxShadow: theme.shadows[2],
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Invitation Message</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  startIcon={<FormatColorTextIcon />}
                  onClick={() => setTemplateDialogOpen(true)}
                  size="small"
                  variant="outlined"
                >
                  Templates
                </Button>
                <Button
                  startIcon={<PreviewIcon />}
                  onClick={() => setPreviewOpen(true)}
                  disabled={!message.trim()}
                  size="small"
                  variant="contained"
                >
                  Preview
                </Button>
              </Box>
            </Box>

            <TextField
              multiline
              minRows={6}
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your invitation message here..."
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Button
                size="small"
                onClick={() => setMessage(getDefaultMessage())}
                disabled={message === getDefaultMessage()}
                variant="outlined"
                startIcon={<RefreshIcon />}
              >
                Reset to Default
              </Button>

              <Button
                size="small"
                onClick={handleCopyInviteLink}
                startIcon={<LinkIcon />}
                variant="outlined"
                color="primary"
              >
                Copy Invite Link
              </Button>
            </Box>

            {/* SMS character count */}
            {filter === "sms" && (
              <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  SMS Character Count: {smsCharCount}
                </Typography>
                {smsCharCount > 160 && <Chip size="small" color="warning" label="Multiple SMS" sx={{ ml: 1 }} />}
              </Box>
            )}
          </Paper>

          {/* Message button for mobile */}
          {isMobile && (
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setMobileDrawerOpen(true)}
              startIcon={<EditIcon />}
              sx={{ mb: -1 }}
            >
              Edit Invitation Message
            </Button>
          )}

          {/* Send Options */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 2,
              boxShadow: theme.shadows[2],
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ mb: 3 }}
              indicatorColor="primary"
            >
              <Tab
                label={isSmall ? "Selected" : "Selected Attendees"}
                icon={<PeopleIcon />}
                iconPosition={isSmall ? "top" : "start"}
              />
              <Tab
                label={isSmall ? "List" : "Entire List"}
                icon={<FilterListIcon />}
                iconPosition={isSmall ? "top" : "start"}
              />
            </Tabs>

            {tabValue === 0 && (
              <>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="500">
                    Send to {selectedAttendees.length} Selected Attendees
                  </Typography>
                  <Badge badgeContent={selectedAttendees.length} color="primary" sx={{ ml: 1 }} />
                </Box>

                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<EmailIcon />}
                    onClick={() => handleConfirmSend("email")}
                    disabled={sending || selectedAttendees.length === 0 || !message.trim()}
                    fullWidth
                    color="primary"
                    size="large"
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    {sending ? <CircularProgress size={24} /> : "Send Email"}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PhoneIcon />}
                    onClick={() => handleConfirmSend("sms")}
                    disabled={sending || selectedAttendees.length === 0 || !message.trim()}
                    fullWidth
                    color="secondary"
                    size="large"
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    {sending ? <CircularProgress size={24} /> : "Send SMS"}
                  </Button>
                </Box>

                {selectedAttendees.length === 0 && (
                  <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />} variant="outlined">
                    Please select attendees from the list to send invites
                  </Alert>
                )}
              </>
            )}

            {tabValue === 1 && (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="list-select-label">Select a list</InputLabel>
                  <Select
                    labelId="list-select-label"
                    value={selectedList}
                    onChange={(e) => setSelectedList(e.target.value)}
                    label="Select a list"
                  >
                    {lists.length === 0 ? (
                      <MenuItem disabled>No lists available</MenuItem>
                    ) : (
                      lists.map((list) => (
                        <MenuItem key={list.Id} value={list.Id}>
                          {list.Name} 
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    onClick={() => handleConfirmSend("email")}
                    disabled={sending || !selectedList || !message.trim()}
                    fullWidth
                    color="primary"
                    size="large"
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    {sending ? <CircularProgress size={24} /> : "Email List"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PhoneIcon />}
                    onClick={() => handleConfirmSend("sms")}
                    disabled={sending || !selectedList || !message.trim()}
                    fullWidth
                    color="secondary"
                    size="large"
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    {sending ? <CircularProgress size={24} /> : "SMS List"}
                  </Button>
                </Box>

                {!selectedList && (
                  <Alert severity="info" sx={{ mt: 2 }} icon={<InfoIcon />} variant="outlined">
                    Please select a list to send bulk invites
                  </Alert>
                )}
              </>
            )}
          </Paper>

          {/* Help Card */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              bgcolor: "#f8f9fa",
              borderRadius: 2,
              boxShadow: theme.shadows[1],
              display: { xs: "none", md: "block" },
            }}
          >
            <Typography variant="subtitle1" fontWeight={500} gutterBottom>
              Tips for Sending Invites
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleOutlineIcon color="success" sx={{ mr: 1, fontSize: "0.9rem" }} />
                <Typography variant="body2">Personalized messages have higher response rates</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleOutlineIcon color="success" sx={{ mr: 1, fontSize: "0.9rem" }} />
                <Typography variant="body2">Event details and RSVP link are automatically included</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleOutlineIcon color="success" sx={{ mr: 1, fontSize: "0.9rem" }} />
                <Typography variant="body2">You can filter attendees by those with email or phone numbers</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleOutlineIcon color="success" sx={{ mr: 1, fontSize: "0.9rem" }} />
                <Typography variant="body2">Use the preview button to see how your invitation will look</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleOutlineIcon color="success" sx={{ mr: 1, fontSize: "0.9rem" }} />
                <Typography variant="body2">
                  Phone numbers starting with 0 will be formatted with +92 country code
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Preview Dialog */}
      {renderPreviewDialog()}

      {/* Template Dialog */}
      {renderTemplateDialog()}

      {/* Confirm Send Dialog */}
      {renderConfirmSendDialog()}

      {/* Mobile Message Drawer */}
      {renderMobileDrawer()}

      {/* Backdrop while sending */}
      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={sending}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>Sending invitations...</Typography>
        </Box>
      </Backdrop>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
          elevation={6}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SendInvitesPage
