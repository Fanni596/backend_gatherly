"use client"

import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AttendeeSelfCheckinService from "../../../Services/AttendeeSelfCheckinServices";
import { FaArrowLeft, FaCheckCircle, FaTicketAlt, FaUserCircle, FaMobileAlt, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";
import { AuthContext } from "../../../Contexts/authContext";

const AttendeeSelfCheckin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { attendeeUser } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [eventStatus, setEventStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter OTP, 3: Success
  const [phone, setPhone] = useState(attendeeUser?.identifier || "");
  const [otp, setOtp] = useState("");
  const [attendee, setAttendee] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAlreadyCheckedIn, setIsAlreadyCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [allowedPeople, setAllowedPeople] = useState(1);
  const [currentCheckins, setCurrentCheckins] = useState(0);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const [eventData, statusData] = await Promise.all([
          AttendeeSelfCheckinService.getEventDetails(id),
          AttendeeSelfCheckinService.getEventMonitoringStatus(id)
        ]);

        setEvent(eventData);
        setEventStatus(statusData?.status || 'not_started');

        // Determine if check-in is allowed
        const isEventActive = statusData?.status === 'in_progress';
        setCanCheckIn(isEventActive);

        // If user is logged in, check their check-in status immediately
        if (attendeeUser?.identifier) {
          checkCheckinStatus(attendeeUser.identifier);
        }

        setLoading(false);
      } catch (error) {
        toast.error(error.message || "Failed to load event details");
        setLoading(false);
        navigate("/");
      }
    };

    fetchEventDetails();
  }, [id, navigate, attendeeUser]);

  const checkCheckinStatus = async (identifier) => {
    try {
      const status = await AttendeeSelfCheckinService.getCheckinStatus(id, identifier);
      console.log("Check-in status:", status);
      if (status.isCheckedIn) {
        setIsAlreadyCheckedIn(true);
        setAttendee({
          firstName: status.firstName,
          lastName: status.lastName
        });
        setCheckInTime(status.checkInTime);
        setAllowedPeople(status.allowedPeople);
        setCurrentCheckins(status.currentCheckins);
        setStep(3); // Skip to success step
      } else {
        setAllowedPeople(status.allowedPeople || 1);
        setCurrentCheckins(status.currentCheckins || 0);
      }
    } catch (error) {
      console.error("Error checking check-in status:", error);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!canCheckIn) {
      toast.error("Check-in is not available at this time");
      return;
    }

    if (!phone) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Basic phone validation
   if (!phone.match(/^\+92[0-9]{10}$/)) {
      toast.error("Please enter a valid phone number starting with +92 followed by 10 digits (e.g. +923001234567)");
      return;
}

    try {
      setIsChecking(true);
      await AttendeeSelfCheckinService.verifyAttendee(id, phone);
      setStep(2);
      toast.success("Verification code sent to your phone");
    } catch (error) {
      if (error.errors) {
        // Handle validation errors from API
        Object.values(error.errors).forEach(err => {
          toast.error(err[0]); // Show first error message
        });
      } else {
        toast.error(error.message || "Failed to verify attendee");
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!canCheckIn) {
      toast.error("Check-in is not available at this time");
      return;
    }

    if (!otp || !otp.match(/^[0-9]{6}$/)) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }

    try {
      setIsChecking(true);
      const result = await AttendeeSelfCheckinService.verifyOtp(id, phone, otp);

      if (result.success) {
        setAttendee({
          firstName: result.attendee.firstName,
          lastName: result.attendee.lastName
        });
        setAllowedPeople(result.attendee.allowedPeople);
        setCurrentCheckins(result.attendee.currentCheckins);
        setStep(3);
        toast.success("Check-in successful!");
      } else {
        // Handle case where check-in limit was reached
        if (result.isCheckedIn) {
          setIsAlreadyCheckedIn(true);
          setAttendee({
            firstName: result.firstName,
            lastName: result.lastName
          });
          setAllowedPeople(result.allowedPeople);
          setCurrentCheckins(result.currentCheckins);
          setStep(3);
          toast.warning(result.message);
        } else {
          toast.error(result.message || "Check-in failed");
        }
      }
    } catch (error) {
      if (error.errors) {
        Object.values(error.errors).forEach(err => {
          toast.error(err[0]);
        });
      } else {
        toast.error(error.message || "Failed to verify code");
      }
    } finally {
      setIsChecking(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium inline-flex items-center"
          >
            <FaArrowLeft className="mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-center" autoClose={5000} />

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setStep(1)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Event Check-In</h1>
            <div className="w-5"></div> {/* Spacer for alignment */}
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
            <div className="mt-2 text-sm text-gray-600">
              <p>{formatDate(event.startDate)}</p>
              <p>{event.location}</p>
            </div>
            {!canCheckIn && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-md text-sm text-yellow-800 flex items-center">
                <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                <span>
                  {eventStatus === 'not_started' ? 'Check-in will be available when the event starts' :
                    eventStatus === 'ended' ? 'This event has ended' :
                      'Check-in is currently not available'}
                </span>
              </div>
            )}
          </div>

          {step === 1 && !isAlreadyCheckedIn && (
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {attendeeUser ? "Your registered phone number" : "Enter your phone number"}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMobileAlt className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="+923001234567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value); // No validation at all
                    }}
                  />
                </div>
                {attendeeUser && (
                  <p className="mt-1 text-xs text-gray-500">
                    We'll use your registered phone number for verification
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isChecking || !canCheckIn}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isChecking ? "Verifying..." : "Continue"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpSubmit}>
              {/* OTP Input (existing) */}
              <div className="mb-4">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter verification code sent to {phone}
                </label>
                <input
                  type="text"
                  id="otp"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  disabled={!canCheckIn}
                />

                {/* Resend OTP Button */}
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await AttendeeSelfCheckinService.verifyAttendee(id, phone);
                        toast.success("New verification code sent!");
                      } catch (error) {
                        toast.error(error.message || "Failed to resend OTP");
                      }
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Resend Code
                  </button>
                </div>

                {/* Check-in count */}
                <p className="mt-2 text-sm text-gray-600">
                  Check-ins used: {currentCheckins}/{allowedPeople}
                  {currentCheckins >= allowedPeople && (
                    <span className="text-red-500 ml-2">(Limit reached)</span>
                  )}
                </p>
              </div>

              {/* Check-in Button */}
              {currentCheckins >= allowedPeople ? (
                <div className="p-3 bg-yellow-50 rounded-md text-sm text-yellow-800 mb-4">
                  <FaExclamationTriangle className="inline mr-2" />
                  You've reached your check-in limit for this event.
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isChecking || otp.length !== 6 || !canCheckIn}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isChecking ? "Checking in..." : "Check In"}
                </button>
              )}
            </form>
          )}

          {step === 3 && attendee && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isAlreadyCheckedIn ? "Already checked in!" : "Check-in successful!"}
              </h3>

              {isAlreadyCheckedIn && checkInTime && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800 flex items-center">
                  <FaInfoCircle className="mr-2 flex-shrink-0" />
                  <span>You checked in at {formatTime(checkInTime)}</span>
                </div>
              )}

              <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                <p>Check-ins used: {currentCheckins}/{allowedPeople}</p>
              </div>

              <div className="flex items-center justify-center space-x-2 mb-4">
                <FaUserCircle className="h-5 w-5 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {attendee.firstName} {attendee.lastName}
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <FaTicketAlt className="h-5 w-5 text-indigo-400" />
                <p className="text-sm text-indigo-600 font-medium">
                  {event.title}
                </p>
              </div>

              {/* Show "Check In Again" button if more check-ins are allowed */}
              {currentCheckins < allowedPeople && (
                <button
                  onClick={async () => {
                    try {
                      await AttendeeSelfCheckinService.verifyAttendee(id, phone);
                      setOtp(""); // Reset OTP input
                      setStep(2); // Go back to OTP step
                      toast.success("New verification code sent!");
                    } catch (error) {
                      toast.error(error.message || "Failed to resend OTP");
                    }
                  }}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Check In Again
                </button>
              )}

              <button
                onClick={() => navigate("/")}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendeeSelfCheckin;