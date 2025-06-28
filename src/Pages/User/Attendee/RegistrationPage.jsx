"use client"

import { useState, useEffect, useContext, act, use } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  ArrowBack,
  Email,
  Phone,
  Person,
  CalendarToday,
  LocationOn,
  Payment,
  CheckCircle,
  Error,
  Info,
  Close,
  VerifiedUser,
  Edit,
} from "@mui/icons-material"
import { useFormik } from "formik"
import * as Yup from "yup"
import AttendeeeventViewService from "../../../Services/AttendeeeventViewServices"
import eventViewService from "../../../Services/eventViewServices"
import { AuthContext } from "../../../Contexts/authContext"
import PaymentModal from "../../../Components/Global/PaymentModal"
import ProtectedRoute from "../../../Config/ProtectedRoute"
import AttendeeProfileService from "../../../Services/AttendeeProfileService"
import { useSearchParams } from 'react-router-dom';
import PaymentService from "../../../Services/PaymentServices"
const RegistrationPage = () => {
  const { id: eventId } = useParams()
  const navigate = useNavigate()
  const { attendeeUser } = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [registrationStatus, setRegistrationStatus] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })
  const [verificationMethod, setVerificationMethod] = useState("email")
  const [existingAttendee, setExistingAttendee] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [canEditField, setCanEditField] = useState(null)
  const [profileData, setProfileData] = useState(null)
  // Check if identifier is email or phone
  const isEmail = (identifier) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
  }
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const paymentStatus = searchParams.get('status');

useEffect(() => {
  const fetchProfileData = async () => {
    try {
      const attendeeProfile = await AttendeeProfileService.getProfile();
      setProfileData(attendeeProfile);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  fetchProfileData();
}, []);
  // Add this useEffect to handle payment callback
  useEffect(() => {
  if (paymentId && paymentStatus) {
    const handlePaymentCallback = async () => {
      try {
        setLoading(true);
        
        // First verify the payment with our backend
        await PaymentService.handlePaymentCallback(paymentId, paymentStatus);
        
        if (paymentStatus === 'success') {
          // Check payment status - WorkupPay might take a few seconds to process
          let paymentVerified = false;
          let attempts = 0;
          
          while (!paymentVerified && attempts < 5) {
            const status = await PaymentService.getPaymentStatus(paymentId);
            
            if (status.status === 'completed') {
              paymentVerified = true;
              handlePaymentSuccess();
              navigate(`/payment/success/${paymentId}`);
              break;
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          if (!paymentVerified) {
            showSnackbar('Payment is being processed. Please check back later.', 'info');
            navigate(`/payment/pending/${paymentId}`);
          }
        } else {
          // Payment failed or was cancelled
          navigate(`/payment/cancel/${paymentId}`);
          showSnackbar('Payment was not completed', 'info');
        }
      } catch (err) {
        showSnackbar(err.message || 'Payment verification failed', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    handlePaymentCallback();
  }
}, [paymentId, paymentStatus]);

  // Fetch event details and check for existing registration
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true)
        const eventData = await AttendeeeventViewService.getEventById(eventId)
        setEvent(eventData)
        
        

        // Initialize form values based on attendeeUser
        const initialValues = {
          firstName: profileData?.firstName || "",
          lastName: profileData?.lastName || "",
          email: isEmail(profileData?.identifier) || profileData?.email ? profileData?.email : "",
          phone: !isEmail(profileData?.identifier) || profileData?.phone ? profileData?.phone : "",
          attendees: 1,
          agreeTerms: false,
        }

        // Check if attendee exists (for both private and public events)
        const attendeeCheck = await checkExistingAttendee(eventData.visibility)

        setCanEditField(eventData.visibility === "private")

     

        if (attendeeCheck.exists) {
          setExistingAttendee(attendeeCheck.data)
          // Auto-fill form if attendee exists
          formik.setValues({
            ...initialValues,
            firstName: attendeeCheck.data.firstName || initialValues.firstName,
            lastName: attendeeCheck.data.lastName || initialValues.lastName,
            email: attendeeCheck.data.email || initialValues.email,
            phone: attendeeCheck.data.phone || initialValues.phone,
            attendees: attendeeCheck.data.allowedPeople || 1,
          })
        } else {
          // Set initial values from attendeeUser if available
          formik.setValues({
            ...initialValues,
          firstName: profileData?.firstName || "",
          lastName: profileData?.lastName || "",
          email: isEmail(profileData?.identifier) || profileData?.email ? profileData?.email : "",
          phone: !isEmail(profileData?.identifier) || profileData?.phone ? profileData?.phone : "",
          attendees: 1,
          })
        }

        // Check if user is already registered
        if (attendeeUser) {
          const status = await AttendeeeventViewService.checkRegistrationStatus(eventId)
          if (status.isRegistered && status.isInvited) {
            setRegistrationStatus(status)
            if (status.isConfirmed && eventData.ticket_type === "paid" && status.isPaid && status.isInvited) {
              setActiveStep(3)
            } 
            else if (status.isConfirmed && eventData.ticket_type === "free" && status.isInvited) {
              setActiveStep(3)
            } 
            else if (eventData.ticket_type === "paid" && !status.isPaid && status.isConfirmed && status.isInvited) {
              setActiveStep(2)
            } 
            else if (status.isConfirmed && !status.isPaid && eventData.ticket_type === "paid" && activeStep === 1) {
              setActiveStep(2)
            }
            else if (status.isConfirmed) {
              setActiveStep(3)
            } 
            else {
              setActiveStep(1)
            }
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load event details")
      } finally {
        setLoading(false)
      }
    }
 const status = AttendeeeventViewService.checkRegistrationStatus(eventId)
          setRegistrationStatus(status)
    fetchEventDetails()
  }, [eventId, attendeeUser])

  // Check if attendee already exists in the appropriate table
  const checkExistingAttendee = async (visibility) => {
    try {
      // Determine which identifier to use (email or phone from form or attendeeUser)
      const emailToCheck = formik?.values?.email || (isEmail(attendeeUser?.identifier) ? attendeeUser?.identifier : '""')
      const phoneToCheck = formik?.values?.phone || (!isEmail(attendeeUser?.identifier) ? attendeeUser?.identifier : '""')

      // For public events, check public_attendees table
      if (visibility === "public") {
        const response = await eventViewService.checkPublicAttendee(
          eventId,
          emailToCheck,
          phoneToCheck
        )
        return { exists: response.exists, data: response.data }
      } 
      // For private events, check attendees table
      else {
        const response = await eventViewService.checkPrivateAttendee(
          eventId,
          emailToCheck,
          phoneToCheck
        )
        return { exists: response.exists, data: response.data }
      }
    } catch (err) {
      console.error("Error checking attendee:", err)
      return { exists: false, data: null }
    }
  }

  // Form validation schema
  const validationSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .required("Phone number is required")
    .matches(
      /^\+92[0-9]{10}$/,
      "Phone number must start with +92 followed by 10 digits (e.g. +923001234567)"
    ),
  attendees: Yup.number()
    .min(1, "At least 1 attendee")
    .max(10, "Maximum 10 attendees")
    .required("Number of attendees is required"),
  agreeTerms: Yup.boolean().oneOf([true], "You must accept the terms"),
});
  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      attendees: 1,
      agreeTerms: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true)
        
        // Check if attendee exists again in case they changed email/phone
        const attendeeCheck = await checkExistingAttendee(event.visibility)

        // Register or update attendee
        const registrationData = {
          FirstName: values.firstName,
          LastName: values.lastName,
          Email: values.email,
          Phone: values.phone,
          AllowedPeople: values.attendees,
          IsPaying: event.ticket_type === "paid"
        }

        let response
        if (attendeeCheck.exists) {
          // Update existing attendee
          response = await eventViewService.updateAttendee(
            eventId,
            attendeeCheck.data.id,
            registrationData,
            event.visibility
          )
        } else {
          // Create new attendee
          response = await AttendeeeventViewService.registerForEvent(
            eventId,
            registrationData,
            event.visibility
          )
        }

        // Generate invite link with phone number
        const inviteLink = `${window.location.origin}/attendee/event/${eventId}/invite/${values.phone}`

        // Send invite based on selected method
        if (verificationMethod === "email") {
          await eventViewService.sendEmailInvite(
            eventId,
            response.attendeeId,
            `Hi ${values.firstName},\n\nYou're invited to ${event.title}. Click here to confirm: ${inviteLink}`
          )
          await eventViewService.markAsInvited(eventId, response.attendeeId)
        } else {
          await eventViewService.sendSmsInvite(
            eventId,
            response.attendeeId,
            `Hi ${values.firstName}, you're invited to ${event.title}. Confirm here: ${inviteLink}`
          )
          await eventViewService.markAsInvited(eventId, response.attendeeId)
        }

        setRegistrationStatus({
          isRegistered: true,
          isInvited: true,
          isConfirmed: false,
          attendeeId: response.attendeeId,
          isExisting: attendeeCheck.exists
        })
        setActiveStep(1)
    setEditMode(false)
        showSnackbar(
          attendeeCheck.exists 
            ? "Registration updated! Confirmation sent." 
            : "Invite sent! Please check your email/SMS to confirm.", 
          "success"
        )
        
      } catch (err) {
        showSnackbar(err.message || "Registration failed", "error")
      } finally {
        setLoading(false)
      }
    }
  })

  // Resend invite function
  const resendInvite = async () => {
    try {
      setLoading(true)
      const inviteLink = `${window.location.origin}/attendee/event/${eventId}/invite/${formik.values.phone}`
      
      if (verificationMethod === "email") {
        await eventViewService.sendEmailInvite(
          eventId,
          registrationStatus.attendeeId,
          `Hi ${formik.values.firstName},\n\nYou're invited to ${event.title}. Click here to confirm: ${inviteLink}`
        )
      } else {
        await eventViewService.sendSmsInvite(
          eventId,
          registrationStatus.attendeeId,
          `Hi ${formik.values.firstName}, you're invited to ${event.title}. Confirm here: ${inviteLink}`
        )
      }
      
      showSnackbar("Invite resent successfully!", "success")
    } catch (err) {
      showSnackbar(err.message || "Failed to resend invite", "error")
    } finally {
      setLoading(false)
    }
  }
    // Periodically check confirmation status
  useEffect(() => {
    if (registrationStatus && !registrationStatus.isPaid && !editMode) {
      const interval = setInterval(async () => {
        try {
          const status = await AttendeeeventViewService.checkRegistrationStatus(eventId)
          if (!status.isPaid && !status.isConfirmed && !status.isInvited && status.isRegistered) {
            clearInterval(interval)
            setRegistrationStatus(prev => ({ ...prev, isInvited: false, isRegistered: true, isConfirmed: false, isPaid: false }))
              setActiveStep(0)
        }
        else if (!status.isPaid && !status.isConfirmed && status.isInvited && status.isRegistered) {
            clearInterval(interval)
            setRegistrationStatus(prev => ({ ...prev, isInvited: true, isRegistered: true, isConfirmed: false, isPaid: false }))
              setActiveStep(1)
        }
         else if (!status.isPaid && status.isConfirmed && status.isInvited && status.isRegistered && event?.ticket_type === "paid") {
            clearInterval(interval)
            setRegistrationStatus(prev => ({ ...prev, isInvited: true, isRegistered: true, isConfirmed: true, isPaid: false }))
              setActiveStep(2)
        }
        else if (!status.isPaid && status.isConfirmed && status.isInvited && status.isRegistered && event?.ticket_type === "free") {
            clearInterval(interval)
            setRegistrationStatus(prev => ({ ...prev, isInvited: true, isRegistered: true, isConfirmed: true, isPaid: false }))
              setActiveStep(3)
        }
          else if (status.isPaid && status.isConfirmed && status.isInvited && status.isRegistered && event?.ticket_type === "paid") {
            clearInterval(interval)
            setRegistrationStatus(prev => ({ ...prev, isInvited: true, isRegistered: true, isConfirmed: true, isPaid: true }))
              setActiveStep(3)
        }
        else if(editMode){
          clearInterval(interval)
          setActiveStep(0)
        }
        } catch (err) {
          console.error("Error checking status:", err)
        }
      }, 5000)
      
      return () => clearInterval(interval)
    }
    
  }, [registrationStatus, editMode, eventId, event])

   // Update your handlePaymentSuccess function
const handlePaymentSuccess = async () => {
  try {
    setLoading(true);
    
    // Verify payment status with backend
    const status = await PaymentService.getPaymentStatus(registrationStatus.paymentId);
    
    if (status.status === 'completed') {
      setRegistrationStatus(prev => ({
        ...prev,
        isPaid: true,
        isConfirmed: true,
        paymentDetails: status
      }));
      setActiveStep(3);
      showSnackbar("Payment successful! Registration confirmed.", "success");
    } else {
      showSnackbar("Payment not yet confirmed. Please wait...", "info");
    }
  } catch (err) {
    showSnackbar(err.message || "Failed to confirm payment", "error");
  } finally {
    setLoading(false);
    setShowPaymentModal(false);
  }
};

  // In your useEffect for handling payment callback
useEffect(() => {
  if (paymentId && paymentStatus) {
    const handlePaymentCallback = async () => {
      try {
        setLoading(true);
        await PaymentService.handlePaymentCallback(paymentId, paymentStatus);
        
        if (paymentStatus === 'success') {
          const status = await PaymentService.getPaymentStatus(paymentId);
          if (status.status === 'completed') {
            handlePaymentSuccess();
          } else {
            showSnackbar('Payment not yet confirmed. Please wait...', 'info');
          }
        } else {
          showSnackbar('Payment was cancelled', 'info');
        }
      } catch (err) {
        showSnackbar(err.message || 'Payment verification failed', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    handlePaymentCallback();
  }
}, [paymentId, paymentStatus]);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity })
  }

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const steps = [
    "Registration Details",
    "Awaiting Confirmation",
    event?.ticket_type === "paid" ? "Make Payment" : "Complete Registration",
    "Complete"
  ]

  const handleBackToEdit = () => {
    setEditMode(true)
    setActiveStep(0)
  }

  const handleBackToConfirmation = () => {
    setEditMode(false)
    setActiveStep(1)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
        >
          <ArrowBack className="mr-2" />
          Back to Event
        </button>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          Event not found
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center mt-4"
        >
          <ArrowBack className="mr-2" />
          Back to Events
        </button>
      </div>
    )
  }

  return (
    
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
        <ArrowBack className="mr-2" />
        Back to Event
      </button>

      <ProtectedRoute>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Register for {event.title}
      </h1>

      {existingAttendee && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
          We found your existing registration. You can update your details below.
        </div>
      )}

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activeStep >= index
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`mt-2 text-sm ${
                  activeStep >= index ? "text-blue-600 font-medium" : "text-gray-500"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-blue-600 transition-all duration-300"
            style={{
              width: `${(activeStep / (steps.length - 1)) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Registration Form */}
      {(activeStep === 0 || editMode) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Registration Information
            </h2>
            {editMode && (
              <button
                onClick={() => {
                  handleBackToConfirmation(1);
                }}
                className="flex items-center text-blue-600 hover:text-blue-800 border border-blue-600 px-4 py-2 rounded"
              >
                <ArrowBack className="mr-2" />
                Back to Confirmation
              </button>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center text-gray-600">
              <CalendarToday className="mr-2" />
              <span>
                {new Date(event.start_date).toLocaleDateString()} 
                {event.start_time && ` at ${event.start_time}`}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <LocationOn className="mr-2" />
              <span>{event.location || "Online"}</span>
            </div>
          </div>

          {event.ticket_type === "paid" && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="font-medium">This is a paid event.</p>
              <p>Ticket price: {event.ticket_price} {event.currency}</p>
              <p className="mt-1">
                Total for {formik.values.attendees} attendee{formik.values.attendees > 1 ? 's' : ''}: 
                <span className="font-bold"> {event.ticket_price * formik.values.attendees} {event.currency}</span>
              </p>
            </div>
          )}

          <form onSubmit={formik.handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Person className="text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    disabled={canEditField}
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    className={`pl-10 w-full rounded-md border ${
                      formik.touched.firstName && formik.errors.firstName
                        ? "border-red-500"
                        : "border-gray-300"
                    } p-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                {formik.touched.firstName && formik.errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                    disabled={canEditField}

                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  className={`w-full rounded-md border ${
                    formik.touched.lastName && formik.errors.lastName
                      ? "border-red-500"
                      : "border-gray-300"
                  } p-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {formik.touched.lastName && formik.errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Email className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                    disabled={canEditField}

                  value={formik.values.email}
                  onChange={formik.handleChange}
                  className={`pl-10 w-full rounded-md border ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500"
                      : "border-gray-300"
                  } p-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                    disabled={canEditField}

                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  className={`pl-10 w-full rounded-md border ${
                    formik.touched.phone && formik.errors.phone
                      ? "border-red-500"
                      : "border-gray-300"
                  } p-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
              {formik.touched.phone && formik.errors.phone && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.phone}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Attendees
              </label>
              <input
                id="attendees"
                name="attendees"
                type="number"
                min="1"
                max="10"
                    disabled={canEditField}

                value={formik.values.attendees}
                onChange={formik.handleChange}
                className={`w-full rounded-md border ${
                  formik.touched.attendees && formik.errors.attendees
                    ? "border-red-500"
                    : "border-gray-300"
                } p-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              {formik.touched.attendees && formik.errors.attendees && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.attendees}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Method
              </label>
              <div className="flex space-x-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    name="verificationMethod"
                    value="email"
                    checked={verificationMethod === "email"}
                    onChange={() => setVerificationMethod("email")}
                  />
                  <span className="ml-2 text-gray-700">Email Verification</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    name="verificationMethod"
                    value="sms"
                    checked={verificationMethod === "sms"}
                    onChange={() => setVerificationMethod("sms")}
                  />
                  <span className="ml-2 text-gray-700">SMS Verification</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeTerms"
                    name="agreeTerms"
                    type="checkbox"
                    checked={formik.values.agreeTerms}
                    onChange={formik.handleChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeTerms" className="font-medium text-gray-700">
                    I agree to the{' '}
                    <a href="/terms" className="text-blue-600 hover:text-blue-800">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-blue-600 hover:text-blue-800">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>
              {formik.touched.agreeTerms && formik.errors.agreeTerms && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.agreeTerms}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-md text-white font-medium ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } flex items-center`}
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {existingAttendee && event.visibility === "private" ? "Get Invite Link" : (
                  existingAttendee ? "Update Registration" :
                    event.ticket_type === "paid" ? "Proceed to Payment" : "Complete Registration"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Step */}
      {activeStep === 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
          
            <h2 className="text-xl font-semibold text-gray-800">
              Confirm Your Registration
            </h2>
       
           <button
              onClick={handleBackToEdit}
              className="flex items-center text-blue-600 hover:text-blue-800 border border-blue-600 px-4 py-2 rounded"
            >
              <Edit className="mr-2" />
              Edit Details
            </button>
                
            
          </div>
          
          <div className="text-center mb-6">
            <VerifiedUser className="text-blue-500 text-6xl mx-auto" />
          </div>
          
          <div className="text-center mb-6">
            <p className="text-lg text-gray-700">
              We've sent a confirmation link to your {verificationMethod === 'email' ? 'email' : 'phone'}. 
              Please click the link to confirm your registration.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-lg mb-3">Registration Summary</h3>
            <div className="space-y-2">
              <p className="text-gray-700"><span className="font-medium">Name:</span> {formik.values.firstName} {formik.values.lastName}</p>
              <p className="text-gray-700"><span className="font-medium">Email:</span> {formik.values.email}</p>
              <p className="text-gray-700"><span className="font-medium">Phone:</span> {formik.values.phone}</p>
              <p className="text-gray-700"><span className="font-medium">Attendees:</span> {formik.values.attendees}</p>
              {event.ticket_type === "paid" && (
                <p className="text-gray-700">
                  <span className="font-medium">Total:</span> {event.ticket_price * formik.values.attendees} {event.currency}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-center text-gray-600">
            <p className="mb-4">
              Didn't receive the link? 
              <button 
                onClick={resendInvite} 
                disabled={loading}
                className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Resend
              </button>
            </p>
            {loading && (
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
            )}
          </div>
        </div>
      )}

      {/* Payment Step */}
      {activeStep === 2 && ((event.ticket_type === "paid" && !registrationStatus.isPaid && !editMode) || (event.ticket_type !== "paid" && registrationStatus.isConfirmed)) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-lg mb-3">Registration Summary</h3>
            <div className="space-y-2">
              <p className="text-gray-700"><span className="font-medium">Name:</span> {formik.values.firstName} {formik.values.lastName}</p>
              <p className="text-gray-700"><span className="font-medium">Email:</span> {formik.values.email}</p>
              <p className="text-gray-700"><span className="font-medium">Phone:</span> {formik.values.phone}</p>
              <p className="text-gray-700"><span className="font-medium">Attendees:</span> {formik.values.attendees}</p>
              {event.ticket_type === "paid" && (
                <p className="text-gray-700">
                  <span className="font-medium">Total:</span> {event.ticket_price * formik.values.attendees} {event.currency}
                </p>
              )}
            </div>
          </div>
          
            <h2 className="text-xl font-semibold text-gray-800">
              
              Complete Your Payment
            </h2>
         {event.visibility === "public" && (
            <button
              onClick={handleBackToEdit}
              className="flex items-center text-blue-600 hover:text-blue-800 border border-blue-600 px-4 py-2 rounded"
            >
              <Edit className="mr-2" />
              Edit Details
            </button>
          )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Payment Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-lg font-medium mb-2">
                Total due: <span className="text-blue-600">{event.ticket_price * formik.values.attendees} {event.currency}</span>
              </p>
              {formik.values.attendees > 1 && (
                <p className="text-gray-600 text-sm">
                  ({formik.values.attendees} tickets × {event.ticket_price} {event.currency})
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md flex items-center justify-center"
          >
            <Payment className="mr-2" />
            Pay Now
          </button>
        </div>
      )}

      {/* Completion Step */}
      {activeStep === 3 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-lg mb-3">Registration Summary</h3>
            <div className="space-y-2">
              <p className="text-gray-700"><span className="font-medium">Name:</span> {formik.values.firstName} {formik.values.lastName}</p>
              <p className="text-gray-700"><span className="font-medium">Email:</span> {formik.values.email}</p>
              <p className="text-gray-700"><span className="font-medium">Phone:</span> {formik.values.phone}</p>
              <p className="text-gray-700"><span className="font-medium">Attendees:</span> {formik.values.attendees}</p>
              {event.ticket_type === "paid" && (
                <p className="text-gray-700">
                  <span className="font-medium">Total:</span> {event.ticket_price * formik.values.attendees} {event.currency}
                </p>
              )}
            </div>
          </div>
    
          <CheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Registration Complete!
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            You're successfully registered for <span className="font-semibold">{event.title}</span>.
          </p>
          
          {event.ticket_type === "paid" && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 text-left">
              <p className="font-medium text-green-700">
                Your payment of {event.ticket_price * formik.values.attendees} {event.currency} has been processed.
              </p>
              <p className="text-green-700">
                A receipt has been sent to your email.
              </p>
            </div>
          )}
          
          <p className="text-gray-700 mb-8">
            We've sent the event details to <span className="font-medium">{formik.values.email}</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate(`/attendee/events/${eventId}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded"
            >
              View Event
            </button>
            <button
              onClick={() => navigate('/attendee/events')}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-6 border border-gray-300 rounded"
            >
              Browse More Events
            </button>
          </div>
        </div>
      )}

 <PaymentModal
  open={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  onSuccess={handlePaymentSuccess}
  amount={event.ticket_price * formik.values.attendees}
  currency={event.currency}
  eventId={eventId}
  attendeeId={registrationStatus?.attendeeId}
  eventTitle={event.title}
  attendeeName={`${formik.values.firstName} ${formik.values.lastName}`}
/>

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded shadow-lg ${
          snackbar.severity === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' :
          snackbar.severity === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' :
          'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {snackbar.severity === 'error' ? (
                <Error className="mr-2" />
              ) : snackbar.severity === 'success' ? (
                <CheckCircle className="mr-2" />
              ) : (
                <Info className="mr-2" />
              )}
              <span>{snackbar.message}</span>
            </div>
            <button onClick={handleSnackbarClose} className="ml-4">
              <Close className="text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
    </div>

  )
}

export default RegistrationPage