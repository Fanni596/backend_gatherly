"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useAnimation, MotionConfig } from "framer-motion"
import { useDropzone } from "react-dropzone"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { generateEventWithGemini } from "../../../Services/geminiServices"
import eventService from "../../../Services/eventServices"
import { useAuth } from "../../../Contexts/authContext"
import { useNavigate } from "react-router-dom"
import ProtectedRoute from "../../../Config/ProtectedRoute"
// Predefined options for dropdown selects
const EVENT_TYPES = [
  { value: "conference", label: "Conference" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "webinar", label: "Webinar" },
  { value: "networking", label: "Networking Event" },
  { value: "party", label: "Party/Celebration" },
  { value: "concert", label: "Concert/Performance" },
  { value: "exhibition", label: "Exhibition/Trade Show" },
  { value: "fundraiser", label: "Fundraiser" },
  { value: "sports", label: "Sports Event" },
  { value: "other", label: "Other" },
]

const AUDIENCE_TYPES = [
  { value: "professionals", label: "Professionals" },
  { value: "students", label: "Students" },
  { value: "executives", label: "Executives" },
  { value: "entrepreneurs", label: "Entrepreneurs" },
  { value: "developers", label: "Developers" },
  { value: "designers", label: "Designers" },
  { value: "marketers", label: "Marketers" },
  { value: "educators", label: "Educators" },
  { value: "general", label: "General Public" },
  { value: "families", label: "Families" },
  { value: "other", label: "Other" },
]

const PURPOSE_TYPES = [
  { value: "networking", label: "Networking" },
  { value: "education", label: "Education/Learning" },
  { value: "promotion", label: "Product/Service Promotion" },
  { value: "celebration", label: "Celebration" },
  { value: "fundraising", label: "Fundraising" },
  { value: "teambuilding", label: "Team Building" },
  { value: "entertainment", label: "Entertainment" },
  { value: "awareness", label: "Awareness" },
  { value: "other", label: "Other" },
]

const THEME_TYPES = [
  { value: "formal", label: "Formal/Professional" },
  { value: "casual", label: "Casual" },
  { value: "creative", label: "Creative/Artistic" },
  { value: "tech", label: "Technology/Innovation" },
  { value: "nature", label: "Nature/Outdoor" },
  { value: "vintage", label: "Vintage/Retro" },
  { value: "futuristic", label: "Futuristic" },
  { value: "seasonal", label: "Seasonal/Holiday" },
  { value: "cultural", label: "Cultural" },
  { value: "none", label: "No Specific Theme" },
  { value: "other", label: "Other" },
]

const BUDGET_RANGES = [
  { value: "low", label: "Under PKR 50,000" },
  { value: "medium", label: "PKR 50,000 - 200,000" },
  { value: "high", label: "PKR 200,000 - 500,000" },
  { value: "premium", label: "PKR 500,000+" },
  { value: "other", label: "Custom Budget" },
]

const SPECIAL_REQUIREMENTS = [
  { value: "wheelchair", label: "Wheelchair Accessibility" },
  { value: "dietary", label: "Special Dietary Options" },
  { value: "translation", label: "Translation Services" },
  { value: "childcare", label: "Childcare Services" },
  { value: "parking", label: "Special Parking Arrangements" },
  { value: "tech", label: "Advanced Technical Setup" },
  { value: "security", label: "Enhanced Security" },
  { value: "transportation", label: "Transportation Services" },
]

// Event templates based on event type
const EVENT_TEMPLATES = {
  conference: {
    title: "Professional Conference",
    summary:
      "A comprehensive industry conference bringing together professionals for networking, learning, and collaboration.",
    description:
      "# Professional Conference\n\nJoin us for a day of insightful presentations, panel discussions, and networking opportunities. This conference is designed to bring together industry leaders and professionals to share knowledge, discuss trends, and build valuable connections.\n\n## What to Expect\n\n- Keynote presentations from industry experts\n- Interactive panel discussions on current trends\n- Networking sessions with peers and potential collaborators\n- Exhibition area featuring innovative products and services\n\n## Who Should Attend\n\nThis conference is ideal for professionals looking to expand their knowledge, stay updated on industry developments, and connect with like-minded individuals.\n\n## Benefits of Attending\n\n- Gain insights from industry leaders\n- Expand your professional network\n- Discover new tools and strategies\n- Earn professional development credits",
    ticketType: "paid",
    ticketPrice: "1500",
    schedule: [
      { time: "09:00", activity: "Registration & Welcome Coffee" },
      { time: "10:00", activity: "Opening Keynote" },
      { time: "11:30", activity: "Panel Discussion" },
      { time: "13:00", activity: "Lunch Break" },
      { time: "14:00", activity: "Breakout Sessions" },
      { time: "16:00", activity: "Networking Reception" },
      { time: "17:30", activity: "Closing Remarks" },
    ],
    tags: ["professional", "networking", "industry", "learning"],
    recommendations:
      "Consider arranging for professional photographers and offering early-bird registration discounts to boost attendance.",
  },
  workshop: {
    title: "Interactive Workshop",
    summary:
      "A hands-on workshop designed to develop practical skills through collaborative learning and expert guidance.",
    description:
      "# Interactive Workshop\n\nThis workshop offers a hands-on learning experience led by industry experts. Participants will engage in practical exercises, receive personalized feedback, and develop applicable skills they can immediately implement.\n\n## Workshop Format\n\n- Small group setting for personalized attention\n- Practical exercises and real-world applications\n- Interactive discussions and problem-solving\n- Take-home resources and reference materials\n\n## Learning Objectives\n\n- Master practical techniques and methodologies\n- Develop problem-solving skills through hands-on activities\n- Receive expert feedback on your work\n- Connect with peers for continued learning\n\n## What to Bring\n\nParticipants should bring their own laptops and any specific tools mentioned in the pre-workshop communication.",
    ticketType: "paid",
    ticketPrice: "2500",
    schedule: [
      { time: "09:30", activity: "Check-in & Introduction" },
      { time: "10:00", activity: "Workshop Overview & Objectives" },
      { time: "10:30", activity: "Hands-on Session I" },
      { time: "12:00", activity: "Lunch Break" },
      { time: "13:00", activity: "Hands-on Session II" },
      { time: "15:00", activity: "Group Discussion & Feedback" },
      { time: "16:30", activity: "Wrap-up & Next Steps" },
    ],
    tags: ["workshop", "hands-on", "skills", "learning"],
    recommendations:
      "Limit the number of participants to ensure quality interaction. Consider providing certificates of completion.",
  },
  // Other templates remain the same
  other: {
    title: "Custom Event",
    summary: "A tailored event designed to meet your specific objectives and audience needs.",
    description:
      "# Custom Event\n\nThis event is designed specifically to meet your unique objectives and audience needs. Whether you're launching a product, hosting a special gathering, or creating a hybrid experience, this template provides a starting point that can be fully customized.\n\n## Event Purpose\n\n[Describe the main purpose and goals of your event]\n\n## Target Audience\n\n[Describe who this event is designed for]\n\n## Event Format\n\n[Describe the general format and flow of the event]\n\n## Key Features\n\n- [Feature 1]\n- [Feature 2]\n- [Feature 3]\n- [Feature 4]",
    ticketType: "free",
    ticketPrice: "0",
    schedule: [
      { time: "10:00", activity: "Event Start" },
      { time: "12:00", activity: "Midday Activity" },
      { time: "14:00", activity: "Afternoon Session" },
      { time: "16:00", activity: "Event Conclusion" },
    ],
    tags: ["custom", "event"],
    recommendations: "Consider your audience's specific needs and preferences when customizing this template.",
  },
}

// Enhanced Custom Select component with animations
const CustomSelect = ({ options, value, onChange, placeholder, name, required, className, allowCustom = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [customValue, setCustomValue] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const selectRef = useRef(null)
  const controls = useAnimation()
  // Find the selected option label or use the custom value
  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption
    ? selectedOption.label
    : value; // Show the custom value directly if no matching option found

  // // Find the selected option label
  // const selectedOption = options.find((option) => option.value === value)
  // const displayValue = selectedOption ? selectedOption.label : ""

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      controls.start({ opacity: 1, y: 0, height: "auto" })
    } else {
      controls.start({ opacity: 0, y: -10, height: 0 })
    }
  }, [isOpen, controls])

  const handleOptionSelect = (optionValue) => {
    if (optionValue === "other" && allowCustom) {
      setShowCustomInput(true)
    } else {
      onChange({ target: { name, value: optionValue } })
      setIsOpen(false)
      setShowCustomInput(false)
    }
  }

  const handleCustomSubmit = () => {
    console.log("customValue", customValue.trim())
    if (customValue.trim()) {
      onChange({ target: { name, value: customValue.trim() } })
      setIsOpen(false)
      setShowCustomInput(false)
      setCustomValue("")
    }
  }

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <motion.div
        className={`flex items-center justify-between w-full px-4 py-3 border rounded-xl cursor-pointer bg-white transition-all duration-200 ${isOpen ? "border-indigo-500 ring-2 ring-indigo-100" : "border-gray-300 hover:border-indigo-300"
          }`}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.98 }}
      >
        <span className={`truncate ${!displayValue && "text-gray-500"}`}>
          {displayValue || placeholder || "Select an option"}
        </span>
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-gray-500"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={controls}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ maxHeight: "240px", overflowY: "auto" }}
          >
            {options.map((option) => (
              <motion.div
                key={option.value}
                className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors"
                onClick={() => handleOptionSelect(option.value)}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.1 }}
              >
                {option.label}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomInput && (
          <motion.div
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="Enter custom value..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <motion.button
                type="button"
                onClick={() => {
                  setShowCustomInput(false)
                  setIsOpen(true)
                }}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                onClick={handleCustomSubmit}
                className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                whileTap={{ scale: 0.95 }}
              >
                Add
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Enhanced Checkbox component for multi-select options
const CheckboxGroup = ({ options, selectedValues, onChange, name }) => {
  const handleCheckboxChange = (value) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]

    onChange({ target: { name, value: newSelectedValues } })
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <motion.div key={option.value} className="flex items-center" whileHover={{ x: 2 }}>
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id={`${name}-${option.value}`}
              checked={selectedValues.includes(option.value)}
              onChange={() => handleCheckboxChange(option.value)}
              className="w-4 h-4 opacity-0 absolute"
            />
            <div
              className={`w-5 h-5 flex-shrink-0 border-2 rounded-md mr-2 flex items-center justify-center transition-colors ${selectedValues.includes(option.value) ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                }`}
            >
              {selectedValues.includes(option.value) && (
                <motion.svg
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </div>
            <label htmlFor={`${name}-${option.value}`} className="text-sm text-gray-700 cursor-pointer">
              {option.label}
            </label>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Enhanced Tag input component with animations
const TagInput = ({ tags, setTags }) => {
  const [inputValue, setInputValue] = useState("")

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()])
      }
      setInputValue("")
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-500 transition-all">
      <AnimatePresence>
        {tags.map((tag, index) => (
          <motion.div
            key={index}
            className="flex items-center bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-sm"
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -10 }}
            transition={{ duration: 0.2 }}
            layout
          >
            {tag}
            <motion.button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-indigo-600 hover:text-indigo-800"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length ? "" : "Type and press Enter to add tags"}
        className="flex-grow min-w-[120px] outline-none bg-transparent text-sm"
      />
    </div>
  )
}

const CreateEventAI = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Input, 2: AI Processing, 3: Review
  const [error, setError] = useState(null)
  const [eventData, setEventData] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [tags, setTags] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [videoFile, setVideoFile] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    eventType: "",
    eventTypeLabel: "",
    audience: "",
    audienceLabel: "",
    purpose: "",
    purposeLabel: "",
    date: new Date(),
    startTime: "10:00", // Add default start time
    endTime: "18:00",   // Add default end time
    location: "",
    budget: "",
    budgetLabel: "",
    specialRequirements: [],
    theme: "",
    themeLabel: "",
  });
  // Dropzone for manual image upload with enhanced UI
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        const reader = new FileReader()
        reader.onload = () => {
          setSelectedImage({
            file,
            preview: reader.result,
          })
        }
        reader.readAsDataURL(file)
      }
    },
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Conditional additions for custom labels
      ...(name === 'eventType' && !EVENT_TYPES.some(opt => opt.value === value) ? { eventTypeLabel: value } : {}),
      ...(name === 'audience' && !AUDIENCE_TYPES.some(opt => opt.value === value) ? { audienceLabel: value } : {}),
      ...(name === 'purpose' && !PURPOSE_TYPES.some(opt => opt.value === value) ? { purposeLabel: value } : {}),
      ...(name === 'theme' && !THEME_TYPES.some(opt => opt.value === value) ? { themeLabel: value } : {}),
      ...(name === 'budget' && !BUDGET_RANGES.some(opt => opt.value === value) ? { budgetLabel: value } : {}),
    }));
  };


  // AI generation with templates and Gemini API
  const generateEventWithAI = async () => {
    setLoading(true)
    setError(null)
    setStep(2) // Move to AI Processing step

    try {
      // Create a detailed prompt for Gemini
      const prompt = `
    Create a comprehensive event plan based on the following details:
    - Event Type: ${formData.eventTypeLabel || formData.eventType}
    - Target Audience: ${formData.audienceLabel || formData.audience}
    - Purpose: ${formData.purposeLabel || formData.purpose}
    - Date: ${formData.date.toDateString()}
    - Location: ${formData.location}
    - Budget: ${formData.budgetLabel || formData.budget}
    - Special Requirements: ${formData.specialRequirements.join(", ")}
    - Theme: ${formData.themeLabel || formData.theme}

        Return the response in JSON format with these fields:
        {
          "title": "Event title",
          "summary": "Brief summary (1-2 sentences)",
          "description": "Detailed description in markdown format",
          "ticketType": "free|paid",
          "ticketPrice": "0 if free, otherwise price",
          "schedule": [{"time": "HH:MM", "activity": "description"}],
          "tags": ["array", "of", "tags"],
          "recommendations": "Actionable recommendations for the event"
        }
      `

      // Call Gemini API
      const geminiResponse = await generateEventWithGemini(prompt)

      // Parse the response (Gemini returns text, so we need to extract JSON)
      const jsonStart = geminiResponse.indexOf("{")
      const jsonEnd = geminiResponse.lastIndexOf("}") + 1
      const jsonString = geminiResponse.substring(jsonStart, jsonEnd)
      const eventDataFromAI = JSON.parse(jsonString)

      // Set the generated data
      setEventData({
        ...eventDataFromAI,
        startDate: formData.date,
        startTime: formData.startTime || eventDataFromAI.schedule[0]?.time || "10:00",
        endTime: formData.endTime || eventDataFromAI.schedule[eventDataFromAI.schedule.length - 1]?.time || "18:00",
        location: formData.location,
        registrationExpiry: new Date(formData.date.getTime() - 24 * 60 * 60 * 1000),
      })

      setTags(eventDataFromAI.tags || [])
      setStep(3) // Move to review step
    } catch (err) {
      console.error("Generation error:", err)
      setError("Failed to generate event. Please try again with more specific details.")
      setStep(1) // Go back to input step

      // Fallback to templates if Gemini fails
      const template = EVENT_TEMPLATES[formData.eventType] || EVENT_TEMPLATES.other
      const customizedTemplate = {
        ...template,
        title: `${formData.purpose} ${template.title}`,
        tags: [...template.tags, formData.audience, formData.theme].filter(Boolean),
      }

      setEventData({
        ...customizedTemplate,
        startDate: formData.date,
        startTime: customizedTemplate.schedule[0]?.time || "10:00",
        endTime: customizedTemplate.schedule[customizedTemplate.schedule.length - 1]?.time || "18:00",
        location: formData.location,
        registrationExpiry: new Date(formData.date.getTime() - 24 * 60 * 60 * 1000),
      })
      setTags(customizedTemplate.tags)
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (status = "draft") => {
    try {
      // Check if there's at least one media item
      if (imageFiles.length === 0 && !selectedImage && !videoFile) {
        setError("At least one image or video is required")
        return
      }

      setLoading(true)

      // Format date for API
      const formattedDate = eventData.startDate.toISOString().split("T")[0]

      // Incorporate schedule into description if it exists
      let finalDescription = eventData.description

      if (eventData.schedule && eventData.schedule.length > 0) {
        // Add schedule section to description
        finalDescription += "\n\n## Event Schedule\n\n"
        eventData.schedule.forEach((item) => {
          finalDescription += `- **${item.time}** - ${item.activity}\n`
        })
      }

      // Prepare event data for API
      const eventPayload = new FormData()
      eventPayload.append("Title", eventData.title)
      eventPayload.append("summary", eventData.summary)
      eventPayload.append("Description", finalDescription)
      eventPayload.append("StartDate", formattedDate)
      eventPayload.append("StartTime", eventData.startTime)
      eventPayload.append("EndTime", eventData.endTime)
      eventPayload.append("Location", eventData.location)
      eventPayload.append("TicketType", eventData.ticketType)
      eventPayload.append("TicketPrice", Number.parseFloat(eventData.ticketPrice) || 0)
      eventPayload.append("Capacity", 0) // Default capacity
      eventPayload.append("Status", status)
      eventPayload.append("Visibility", "public")
      eventPayload.append("OrganizerName", user.firstName + " " + user.lastName) // Add organizer name
      eventPayload.append("OrganizerEmail", user.email) // Add organizer email

      if (eventData.registrationExpiry) {
        eventPayload.append("RegistrationExpiry", eventData.registrationExpiry.toISOString())
      }
      
      // Create the event
      const response = await eventService.createEvent(eventPayload)
      const eventId = response.eventId
      
      // Upload selected image if available
      if (selectedImage && selectedImage.file) {
        await eventService.uploadImages(eventId, [selectedImage.file])
      } else if (eventData.selectedImage && eventData.selectedImage.file) {
        await eventService.uploadImages(eventId, [eventData.selectedImage.file])
      }

      // Redirect to edit page
     await eventService.createDefaultList(eventId, eventData.title);
      navigate(`/events/edit/${eventId}`)
    } catch (err) {
      console.error("Event creation error:", err)
      setError("Failed to create event. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  }

  return (
    <ProtectedRoute>

      <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12 px-4 sm:px-6 lg:px-8">
          <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.h1
                className="text-4xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                Create Event with AI
              </motion.h1>
              <motion.p
                className="mt-2 text-xl text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Let our assistant help you create a perfect event with minimal input
              </motion.p>
            </motion.div>

            <motion.div
              className="bg-white shadow-xl rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {/* Progress Steps */}
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  {[1, 2, 3].map((stepNumber) => (
                    <motion.div
                      key={stepNumber}
                      className="flex flex-col items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 * stepNumber, duration: 0.5 }}
                    >
                      <motion.div
                        className={`w-12 h-12 rounded-full flex items-center justify-center 
                      ${step === stepNumber
                            ? "bg-indigo-600 text-white"
                            : step > stepNumber
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={
                          step === stepNumber ? { scale: [1, 1.05, 1], transition: { duration: 1, repeat: 0 } } : {}
                        }
                      >
                        {step > stepNumber ? (
                          <motion.svg
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </motion.svg>
                        ) : (
                          stepNumber
                        )}
                      </motion.div>
                      <motion.span
                        className="mt-2 text-sm font-medium text-gray-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 * stepNumber, duration: 0.5 }}
                      >
                        {stepNumber === 1 ? "Details" : stepNumber === 2 ? "Processing" : "Review"}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={fadeIn}
                      className="space-y-8"
                    >
                      <motion.h2 className="text-2xl font-semibold text-gray-800" variants={staggerItem}>
                        Tell us about your event
                      </motion.h2>
                      <motion.p className="text-gray-600" variants={staggerItem}>
                        Provide some basic information and our assistant will create a complete event plan for you.
                      </motion.p>

                      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={staggerContainer}>
                        <motion.div variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            What type of event is this? *
                          </label>
                          <CustomSelect
                            options={EVENT_TYPES}
                            value={formData.eventType}
                            onChange={handleInputChange}
                            placeholder="Select event type"
                            name="eventType"
                            required
                            allowCustom={true}
                            className="w-full"
                          />
                        </motion.div>

                        <motion.div variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Who is your target audience? *
                          </label>
                          <CustomSelect
                            options={AUDIENCE_TYPES}
                            value={formData.audience}
                            onChange={handleInputChange}
                            placeholder="Select target audience"
                            name="audience"
                            required
                            allowCustom={true}
                            className="w-full"
                          />
                        </motion.div>

                        <motion.div variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            What's the main purpose? *
                          </label>
                          <CustomSelect
                            options={PURPOSE_TYPES}
                            value={formData.purpose}
                            onChange={handleInputChange}
                            placeholder="Select main purpose"
                            name="purpose"
                            required
                            allowCustom={true}
                            className="w-full"
                          />
                        </motion.div>

                        {/* <motion.div variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
                          <div className="relative">
                            <DatePicker
                              selected={formData.date}
                              onChange={(date) => setFormData({ ...formData, date })}
                              minDate={new Date()}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                            <motion.div
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                              animate={{ rotate: [0, 5, 0, -5, 0] }}
                              transition={{ duration: 0.5, delay: 1, repeat: 0 }}
                            >
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </motion.div>
                          </div>
                        </motion.div> */}
                        <motion.div variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
                          <div className="relative">
                            <DatePicker
                              selected={formData.date}
                              onChange={(date) => setFormData({ ...formData, date })}
                              minDate={new Date()}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                            <motion.div
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                              animate={{ rotate: [0, 5, 0, -5, 0] }}
                              transition={{ duration: 0.5, delay: 1, repeat: 0 }}
                            >
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </motion.div>
                          </div>
                        </motion.div>

                        <motion.div variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                          <input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            required
                          />
                        </motion.div>

                        <motion.div variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                          <input
                            type="time"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            required
                          />
                        </motion.div>
                        <motion.div variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Location/Venue *</label>
                          <div className="relative">
                            <svg
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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
                            <input
                              type="text"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              placeholder="Enter event location"
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                              required
                            />
                          </div>
                        </motion.div>

                        <motion.div variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Budget</label>
                          <CustomSelect
                            options={BUDGET_RANGES}
                            value={formData.budget}
                            onChange={handleInputChange}
                            placeholder="Select budget range"
                            name="budget"
                            allowCustom={true}
                            className="w-full"
                          />
                        </motion.div>

                        <motion.div variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Theme/Style</label>
                          <CustomSelect
                            options={THEME_TYPES}
                            value={formData.theme}
                            onChange={handleInputChange}
                            placeholder="Select event theme"
                            name="theme"
                            allowCustom={true}
                            className="w-full"
                          />
                        </motion.div>

                        <motion.div className="md:col-span-2" variants={staggerItem}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                          <CheckboxGroup
                            options={SPECIAL_REQUIREMENTS}
                            selectedValues={formData.specialRequirements}
                            onChange={handleInputChange}
                            name="specialRequirements"
                          />
                        </motion.div>
                      </motion.div>

                      {error && (
                        <motion.p
                          className="text-red-500 text-sm mt-2 bg-red-50 p-3 rounded-lg border border-red-200"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {error}
                        </motion.p>
                      )}

                      <motion.div className="flex justify-end pt-4" variants={staggerItem}>
                        <motion.button
                          onClick={generateEventWithAI}
                          disabled={!formData.eventType || !formData.audience || !formData.purpose || !formData.location || !formData.startTime || !formData.endTime}
                          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center shadow-lg"
                          whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="mr-2">Generate with AI</span>
                          <motion.svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </motion.svg>
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={fadeIn}
                      className="flex flex-col items-center justify-center py-16"
                    >
                      <div className="text-center">
                        <motion.div
                          className="relative w-24 h-24 mx-auto mb-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div
                            className="absolute inset-0 rounded-full border-t-4 border-b-4 border-indigo-500"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          />
                          <motion.div
                            className="absolute inset-3 rounded-full border-t-4 border-b-4 border-indigo-300"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          />
                          <motion.div className="absolute inset-6 rounded-full bg-indigo-600" animate={pulseAnimation} />
                        </motion.div>

                        <motion.h3
                          className="text-xl font-medium text-gray-900 mb-3"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          Creating your perfect event
                        </motion.h3>

                        <motion.p
                          className="mt-2 text-gray-600"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                        >
                          Our assistant is analyzing your requirements and creating a comprehensive event plan...
                        </motion.p>

                        <motion.div
                          className="mt-8 max-w-md mx-auto bg-indigo-50 rounded-xl p-4 border border-indigo-100"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7, duration: 0.5 }}
                        >
                          <motion.div
                            className="flex space-x-2 items-center justify-center"
                            animate={{ x: [0, 5, 0, -5, 0] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                          >
                            <motion.div
                              className="w-2 h-2 bg-indigo-400 rounded-full"
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                            />
                            <motion.div
                              className="w-2 h-2 bg-indigo-500 rounded-full"
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                            />
                            <motion.div
                              className="w-2 h-2 bg-indigo-600 rounded-full"
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                            />
                          </motion.div>
                          <p className="text-sm text-indigo-700 text-center mt-2">This usually takes 10-30 seconds</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && eventData && (
                    <motion.div
                      key="step3"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={fadeIn}
                      className="space-y-8"
                    >
                      <motion.div variants={staggerItem}>
                        <h2 className="text-2xl font-semibold text-gray-800">AI-Generated Event Plan</h2>
                        <p className="text-gray-600">Review and customize the event details before saving</p>
                      </motion.div>

                      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={staggerContainer}>
                        {/* Left column - Event details */}
                        <motion.div className="md:col-span-2 space-y-6" variants={staggerContainer}>
                          <motion.div
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl shadow-sm"
                            variants={staggerItem}
                            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                            transition={{ duration: 0.3 }}
                          >
                            <h3 className="font-medium text-gray-800 mb-2">Event Title</h3>
                            <input
                              type="text"
                              value={eventData.title}
                              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all"
                            />
                          </motion.div>

                          <motion.div
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl shadow-sm"
                            variants={staggerItem}
                            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                            transition={{ duration: 0.3 }}
                          >
                            <h3 className="font-medium text-gray-800 mb-2">Summary</h3>
                            <textarea
                              value={eventData.summary}
                              onChange={(e) => setEventData({ ...eventData, summary: e.target.value })}
                              rows="3"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1">{eventData.summary.length}/140 characters</p>
                          </motion.div>

                          <motion.div
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl shadow-sm"
                            variants={staggerItem}
                            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                            transition={{ duration: 0.3 }}
                          >
                            <h3 className="font-medium text-gray-800 mb-2">Description</h3>
                            <textarea
                              value={eventData.description}
                              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                              rows="8"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-mono text-sm transition-all"
                            />
                          </motion.div>

                          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={staggerContainer}>
                            <motion.div
                              className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl shadow-sm"
                              variants={staggerItem}
                              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                              transition={{ duration: 0.3 }}
                            >
                              <h3 className="font-medium text-gray-800 mb-2">Date & Time</h3>
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <svg
                                    className="text-indigo-500 w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <DatePicker
                                    selected={eventData.startDate}
                                    onChange={(date) => setEventData({ ...eventData, startDate: date })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <svg
                                    className="text-indigo-500 w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <input
                                      type="time"
                                      value={eventData.startTime}
                                      onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    />
                                    <span>to</span>
                                    <input
                                      type="time"
                                      value={eventData.endTime}
                                      onChange={(e) => setEventData({ ...eventData, endTime: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>

                            <motion.div
                              className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl shadow-sm"
                              variants={staggerItem}
                              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                              transition={{ duration: 0.3 }}
                            >
                              <h3 className="font-medium text-gray-800 mb-2">Location</h3>
                              <div className="flex items-center space-x-2">
                                <svg
                                  className="text-indigo-500 w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
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
                                <input
                                  type="text"
                                  value={eventData.location}
                                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all"
                                />
                              </div>
                            </motion.div>
                          </motion.div>
                          {/* Schedule Preview */}
                          <motion.div
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 sm:p-5 rounded-xl shadow-sm"
                            variants={staggerItem}
                            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                              <h3 className="font-medium text-gray-800">Schedule</h3>
                              <motion.button
                                onClick={() => {
                                  const newSchedule = [...(eventData.schedule || [])]
                                  newSchedule.push({ time: "10:00", activity: "" })
                                  setEventData({ ...eventData, schedule: newSchedule })
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center self-start sm:self-auto"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                                Add time slot
                              </motion.button>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              This schedule will be added to your event description.
                            </p>
                            <motion.div className="space-y-2" variants={staggerContainer}>
                              <AnimatePresence>
                                {eventData.schedule?.map((item, index) => (
                                  <motion.div
                                    key={index}
                                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    transition={{ duration: 0.3 }}
                                    layout
                                  >
                                    <div className="flex gap-2 w-full">
                                      <input
                                        type="time"
                                        value={item.time}
                                        onChange={(e) => {
                                          const newSchedule = [...eventData.schedule]
                                          newSchedule[index].time = e.target.value
                                          setEventData({ ...eventData, schedule: newSchedule })
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                      />
                                      <motion.button
                                        onClick={() => {
                                          const newSchedule = [...eventData.schedule]
                                          newSchedule.splice(index, 1)
                                          setEventData({ ...eventData, schedule: newSchedule })
                                        }}
                                        className="text-red-500 hover:text-red-700 p-2 sm:hidden"
                                        whileHover={{ scale: 1.1, rotate: 10 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </motion.button>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                      <input
                                        type="text"
                                        value={item.activity}
                                        onChange={(e) => {
                                          const newSchedule = [...eventData.schedule]
                                          newSchedule[index].activity = e.target.value
                                          setEventData({ ...eventData, schedule: newSchedule })
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                        placeholder="Activity description"
                                      />
                                      <motion.button
                                        onClick={() => {
                                          const newSchedule = [...eventData.schedule]
                                          newSchedule.splice(index, 1)
                                          setEventData({ ...eventData, schedule: newSchedule })
                                        }}
                                        className="text-red-500 hover:text-red-700 p-2 hidden sm:block"
                                        whileHover={{ scale: 1.1, rotate: 10 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </motion.div>
                          </motion.div>

                          <motion.div
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl shadow-sm"
                            variants={staggerItem}
                            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                            transition={{ duration: 0.3 }}
                          >
                            <h3 className="font-medium text-gray-800 mb-2">Tags</h3>
                            <TagInput tags={tags} setTags={setTags} />
                          </motion.div>
                        </motion.div>

                        {/* Right column - Media and actions */}
                        <motion.div className="space-y-6" variants={staggerContainer}>
                          {/* Event Image */}
                          <motion.div
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl shadow-sm"
                            variants={staggerItem}
                            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                            transition={{ duration: 0.3 }}
                          >
                            <h3 className="font-medium text-gray-800 mb-2">Event Image</h3>
                            <p className="text-sm text-gray-600 mb-3">Choose an AI-generated image or upload your own</p>

                            {/* Manual Upload */}
                            <div
                              {...getRootProps()}
                              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${isDragActive
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-300 hover:border-indigo-300"
                                }`}
                            >
                              <input {...getInputProps()} />
                              <motion.svg
                                className="mx-auto h-10 w-10 text-gray-400"
                                whileHover={{ scale: 1.1 }}
                                animate={isDragActive ? { y: [0, -5, 0] } : {}}
                                transition={{ duration: 0.5, repeat: isDragActive ? Number.POSITIVE_INFINITY : 0 }}
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
                              </motion.svg>
                              <p className="mt-2 text-sm text-gray-700 font-medium">
                                {isDragActive ? "Drop your image here..." : "Drag & drop an image, or click to select"}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">Recommended size: 2160x1080 pixels</p>
                            </div>

                            {selectedImage && (
                              <motion.div
                                className="mt-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Image</h4>
                                <div className="relative">
                                  <motion.img
                                    src={selectedImage.preview || "/placeholder.svg"}
                                    alt="Selected event"
                                    className="w-full h-40 object-cover rounded-xl"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                  />
                                  <motion.button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 hover:text-red-500"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </motion.button>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>

                          {/* Ticket Info */}
                          <motion.div
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl shadow-sm"
                            variants={staggerItem}
                            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                            transition={{ duration: 0.3 }}
                          >
                            <h3 className="font-medium text-gray-800 mb-2">Ticket Information</h3>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Ticket Type</label>
                                <div className="flex space-x-3">
                                  <motion.button
                                    className={`flex-1 py-2 px-3 rounded-xl border-2 transition-colors ${eventData.ticketType === "free"
                                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                      : "border-gray-300 text-gray-700 hover:border-indigo-300"
                                      }`}
                                    onClick={() => setEventData({ ...eventData, ticketType: "free", ticketPrice: "0" })}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    Free
                                  </motion.button>
                                  <motion.button
                                    className={`flex-1 py-2 px-3 rounded-xl border-2 transition-colors ${eventData.ticketType === "paid"
                                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                      : "border-gray-300 text-gray-700 hover:border-indigo-300"
                                      }`}
                                    onClick={() => setEventData({ ...eventData, ticketType: "paid" })}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    Paid
                                  </motion.button>
                                </div>
                              </div>
                              {eventData.ticketType === "paid" && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <label className="block text-sm text-gray-600 mb-1">Price (PKR)</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                      ₨
                                    </span>
                                    <input
                                      type="number"
                                      value={eventData.ticketPrice}
                                      onChange={(e) => setEventData({ ...eventData, ticketPrice: e.target.value })}
                                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>

                          {/* Registration Expiry */}
                          <motion.div
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl shadow-sm"
                            variants={staggerItem}
                            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                            transition={{ duration: 0.3 }}
                          >
                            <h3 className="font-medium text-gray-800 mb-2">Registration Deadline</h3>
                            <div className="flex items-center space-x-2">
                              <svg
                                className="text-indigo-500 w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <DatePicker
                                selected={eventData.registrationExpiry}
                                onChange={(date) => setEventData({ ...eventData, registrationExpiry: date })}
                                maxDate={eventData.startDate}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                              />
                            </div>
                          </motion.div>

                          {/* AI Recommendations */}
                          {eventData.recommendations && (
                            <motion.div
                              className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 shadow-sm"
                              variants={staggerItem}
                              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                              transition={{ duration: 0.3 }}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <div className="flex items-start">
                                <motion.svg
                                  className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                                  animate={{ rotate: [0, 10, 0, -10, 0] }}
                                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </motion.svg>
                                <div>
                                  <h3 className="font-medium text-blue-800 mb-1">AI Recommendations</h3>
                                  <p className="text-sm text-blue-700">{eventData.recommendations}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      </motion.div>

                      {error && (
                        <motion.p
                          className="text-red-500 text-sm mt-2 bg-red-50 p-3 rounded-lg border border-red-200"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {error}
                        </motion.p>
                      )}

                      <motion.div 
  className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200"
  variants={staggerItem}
>
  {/* Back Button */}
  <motion.button
    onClick={() => setStep(1)}
    className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
    whileHover={{ x: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    Back
  </motion.button>

  {/* Save Button - now centered and full width on mobile */}
  <motion.button
    onClick={() => handleCreateEvent("draft")}
    disabled={loading}
    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg disabled:opacity-50"
    whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
    whileTap={{ scale: 0.98 }}
  >
    {loading ? (
      <span className="flex items-center justify-center">
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
      </span>
    ) : (
      "Save Event"
    )}
  </motion.button>
</motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </MotionConfig>
    </ProtectedRoute>

  )
}

export default CreateEventAI
