import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Replace with your actual API URL

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true // This is crucial for cookies to be sent
});

const attendeeLoginService = {
// Add these methods to eventViewService in eventViewServices.js

// Send email verification OTP
sendEmailVerification: async (email) => {
    try {
      const response = await api.post('AttendeeAuthentication/send-email-verification', { email })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Error sending email verification' }
    }
  },
  
  // Send phone verification OTP
  sendPhoneVerification: async (phone) => {
    try {
      const response = await api.post('AttendeeAuthentication/send-phone-verification', { phone })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Error sending phone verification' }
    }
  },
  
  // Verify attendee OTP
  verifyAttendeeOtp: async (data) => {
    try {
      const response = await api.post('/AttendeeAuthentication/attendee-verify-code', data)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Error verifying OTP' }
    }
  },
  // Add to attendeeLoginService
verifyFacialData: async (eventId, attendeeId, facialData) => {
  try {
    const response = await api.post(
      `AttendeeAuthentication/verify-facial/${eventId}/${attendeeId}`,
      { FacialData: facialData }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error verifying facial data' };
  }
},
};

export default attendeeLoginService;