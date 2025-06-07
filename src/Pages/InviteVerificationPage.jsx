import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import eventViewService from '../Services/eventViewServices';
import { toast } from 'react-hot-toast';
import attendeeLoginService from '../Services/attendeeLoginServices';

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 font-medium">Verifying invitation...</p>
      </div>
    </div>
  </div>
);

// Error Component
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
    <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="space-y-3">
          <button 
            onClick={onRetry}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Success Component
const SuccessDisplay = ({ eventId, attendeeName }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Complete!</h2>
          <p className="text-gray-600 mb-6">Welcome {attendeeName}! You're all set for the event.</p>
          <button 
            onClick={() => navigate(`/event/${eventId}`)}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
          >
            View Event Details
          </button>
        </div>
      </div>
    </div>
  );
};

const InviteVerificationPage = () => {
  const { eventId, attendeeIdentifier } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendee, setAttendee] = useState(null);
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);

  const verifyInvitation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/AttendeeAuthentication/verify-invitation/${eventId}/${attendeeIdentifier}`
      );
      
      setAttendee(response.data);
      
      // Check if already verified
      const statusResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/AttendeeAuthentication/verification-status/${eventId}/${response.data.attendeeId}`
      );
      
      if (statusResponse.data.isVerified) {
        setIsVerified(true);
        toast.success('You are already verified for this event!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error verifying invitation. Please check your invitation link.');
    } finally {
      setLoading(false);
    }
  }, [eventId, attendeeIdentifier]);

  useEffect(() => {
    verifyInvitation();
  }, [verifyInvitation]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    toast.success('Verification successful!');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={verifyInvitation} />;
  if (isVerified) return <SuccessDisplay eventId={eventId} attendeeName={attendee?.firstName} />;

  if (!verificationMethod) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
              <p className="text-gray-600">Hello {attendee?.firstName}, please choose your preferred verification method:</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setVerificationMethod('otp')}
                className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-medium">Verify with OTP</span>
                </div>
                <p className="text-blue-100 text-sm mt-1">Receive a code via SMS or email</p>
              </button>
              
              <button
                onClick={() => setVerificationMethod('biometric')}
                className="w-full p-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">Verify with Face Recognition</span>
                </div>
                <p className="text-green-100 text-sm mt-1">Quick and secure facial verification</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <button 
              onClick={() => setVerificationMethod(null)}
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to methods</span>
            </button>
          </div>
          
          <div className="p-6">
            {verificationMethod === 'otp' ? (
              <OtpVerification 
                eventId={eventId}
                attendeeId={attendee.attendeeId}
                phone={attendee.phone}
                email={attendee.email}
                onSuccess={handleVerificationSuccess}
              />
            ) : (
              <BiometricVerification 
                eventId={eventId}
                attendeeId={attendee.attendeeId}
                onSuccess={handleVerificationSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OtpVerification = ({ eventId, attendeeId, phone, email, onSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOtp = async () => {
    setIsSending(true);
    setError(null);
    
    try {
      const identifier = phone || email;
      
      if (phone) {
        await attendeeLoginService.sendPhoneVerification(phone);
      } else {
        await attendeeLoginService.sendEmailVerification(email);
      }
      
      setOtpSent(true);
      setCountdown(60); // 60 second countdown
      toast.success('OTP sent successfully!');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const identifier = phone || email;
      const otpCode = otp.join('');
      
      await attendeeLoginService.verifyAttendeeOtp({
        Identifier: identifier,
        OtpCode: otpCode
      });
      
      // Mark attendee as confirmed
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/AttendeeAuthentication/${eventId}/attendees/${attendeeId}/confirm`);
      
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']); // Clear OTP on error
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <div>
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">OTP Verification</h3>
      </div>
      
      {!otpSent ? (
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            We'll send a verification code to:<br />
            <span className="font-medium text-gray-900">
              {phone ? `${phone}` : `${email}`}
            </span>
          </p>
          <button
            onClick={sendOtp}
            disabled={isSending}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
          >
            {isSending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : (
              'Send OTP'
            )}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-center text-gray-600 mb-6">
            Enter the 6-digit code sent to<br />
            <span className="font-medium text-gray-900">{phone || email}</span>
          </p>
          
          <div className="flex justify-center space-x-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                maxLength="1"
              />
            ))}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <button
            onClick={verifyOtp}
            disabled={isVerifying || !isOtpComplete}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 transition-colors font-medium mb-4"
          >
            {isVerifying ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </button>
          
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-gray-500 text-sm">
                Resend code in {countdown} seconds
              </p>
            ) : (
              <button
                onClick={sendOtp}
                disabled={isSending}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const BiometricVerification = ({ eventId, attendeeId, onSuccess }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [facialData, setFacialData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setShowPreview(true);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Get user media
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraAvailable(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraAvailable(false);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Camera not available. Please check your device settings.'
      );
      setShowPreview(false);
    }
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    initCamera();
    
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initCamera]);

  // Capture face from video stream
  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera elements not ready');
      return;
    }

    try {
      setIsCapturing(true);
      setError(null);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setFacialData({ image: imageData });
      setShowPreview(false);
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
    } catch (err) {
      setError('Failed to capture photo: ' + err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const verifyFacialData = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      
      if (!facialData) {
        throw new Error('No facial data captured');
      }
      
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/AttendeeAuthentication/verify-facial/${eventId}/${attendeeId}`,
        { FacialData: facialData }
      );
      
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Facial verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const retakePhoto = () => {
    setFacialData(null);
    setError(null);
    initCamera();
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Face Recognition</h3>
        <p className="text-gray-600">Position your face in the frame and capture when ready</p>
      </div>
      
      {cameraAvailable ? (
        <>
          <div className="mb-6 relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
            {showPreview && (
              <div className="relative w-full h-full">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-48 h-60 border-2 border-white rounded-3xl opacity-60"></div>
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white"></div>
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white"></div>
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white"></div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white"></div>
                  </div>
                </div>
                {/* Capture flash effect */}
                {isCapturing && (
                  <div className="absolute inset-0 bg-white opacity-50 animate-pulse"></div>
                )}
              </div>
            )}
            
            {facialData && !showPreview && (
              <div className="relative w-full h-full">
                <img 
                  src={facialData.image} 
                  alt="Captured face" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Captured
                </div>
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          {showPreview ? (
            <button
              onClick={captureFace}
              disabled={isCapturing}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-all font-medium"
            >
              {isCapturing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Capturing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Capture Photo
                </div>
              )}
            </button>
          ) : facialData ? (
            <div className="space-y-3">
              <button
                onClick={verifyFacialData}
                disabled={isVerifying}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-green-300 transition-all font-medium"
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying Face...
                  </div>
                ) : (
                  'Confirm & Verify'
                )}
              </button>
              <button
                onClick={retakePhoto}
                disabled={isVerifying}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Retake Photo
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <div className="mb-4">
            <svg className="mx-auto w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Camera Access Required</h4>
          <p className="text-red-600 text-sm mb-4">{cameraError}</p>
          <div className="space-y-2">
            <button
              onClick={initCamera}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <p className="text-xs text-gray-500">
              Make sure to allow camera permissions when prompted
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteVerificationPage;