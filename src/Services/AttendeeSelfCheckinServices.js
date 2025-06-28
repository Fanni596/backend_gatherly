import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const AttendeeSelfCheckinService = {
  getEventDetails: async (eventId) => {
    try {
      const response = await api.get(`/AttendeeSelfCheckin/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching event details' };
    }
  },

  getEventMonitoringStatus: async (eventId) => {
    try {
      const response = await api.get(`/AttendeeSelfCheckin/event-monitoring/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching event monitoring status' };
    }
  },

  verifyAttendee: async (eventId, identifier) => {
    try {
      const response = await api.post(`/AttendeeSelfCheckin/verify-attendee/${eventId}`, {
        identifier
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error verifying attendee' };
    }
  },

  verifyOtp: async (eventId, identifier, otpCode) => {
    try {
      const response = await api.post(`/AttendeeSelfCheckin/verify-otp/${eventId}`, {
        identifier,
        otpCode
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error verifying OTP' };
    }
  },

  getCheckinStatus: async (eventId, identifier) => {
    try {
      const response = await api.get(`/AttendeeSelfCheckin/checkin-status/${eventId}/${encodeURIComponent(identifier)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error checking status' };
    }
  }
};

export default AttendeeSelfCheckinService;
