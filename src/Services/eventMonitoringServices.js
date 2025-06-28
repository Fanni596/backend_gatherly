import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const eventMonitoringService = {
  // ============ Event State Management ============
  
  getEventStatus: async (eventId) => {
    try {
      const response = await api.get(`/EventMonitoring/${eventId}/status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching event status' };
    }
  },

  startEvent: async (eventId) => {
    try {
      const response = await api.post(`/EventMonitoring/${eventId}/start`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error starting event' };
    }
  },

  pauseEvent: async (eventId) => {
    try {
      const response = await api.post(`/EventMonitoring/${eventId}/pause`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error pausing event' };
    }
  },

  resumeEvent: async (eventId) => {
    try {
      const response = await api.post(`/EventMonitoring/${eventId}/resume`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error resuming event' };
    }
  },

  endEvent: async (eventId) => {
    try {
      const response = await api.post(`/EventMonitoring/${eventId}/end`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error ending event' };
    }
  },

  // ============ Attendee Check-in/Check-out Management ============

  getEventAttendance: async (eventId) => {
    try {
      const response = await api.get(`/EventMonitoring/${eventId}/attendance`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching attendance data' };
    }
  },

  sendCheckInOtp: async (eventId, attendeeId, { method }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/send-checkin-otp/${attendeeId}`,
        { method }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error sending check-in OTP' };
    }
  },

  verifyCheckInOtp: async (eventId, attendeeId, { otp, method, numberOfPeople = 1 }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/verify-checkin-otp/${attendeeId}`,
        { otp, method, numberOfPeople }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error verifying check-in OTP' };
    }
  },

  manualCheckIn: async (eventId, attendeeId, { method = 'manual', numberOfPeople = 1 }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/manual-checkin/${attendeeId}`,
        { method, numberOfPeople }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error performing manual check-in' };
    }
  },

  checkOutAttendee: async (eventId, attendeeId, { method = 'organizer', numberOfPeople = null }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/checkout/${attendeeId}`,
        { method, numberOfPeople }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error checking out attendee' };
    }
  },

  selfCheckIn: async (eventId, { identifier, method, otp }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/self-checkin`,
        { identifier, method, otp }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error during self check-in' };
    }
  },

  selfCheckOut: async (eventId, { identifier, numberOfPeople = null }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/self-checkout`,
        { identifier, numberOfPeople }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error during self check-out' };
    }
  },

  // ============ Attendance Statistics ============

  getAttendanceStats: async (eventId) => {
    try {
      const response = await api.get(`/EventMonitoring/${eventId}/attendance-stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error retrieving attendance statistics' };
    }
  },

  getAttendanceHistory: async (eventId, date = null) => {
    try {
      const params = date ? { date: date.toISOString().split('T')[0] } : {};
      const response = await api.get(`/EventMonitoring/${eventId}/attendance-history`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error retrieving attendance history' };
    }
  },

  // ============ Bulk Operations ============

  bulkCheckIn: async (eventId, { attendeeIds }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/bulk-checkin`,
        { attendeeIds }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error during bulk check-in' };
    }
  },

  bulkCheckOut: async (eventId, { attendeeIds }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/bulk-checkout`,
        { attendeeIds }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error during bulk check-out' };
    }
  },

  // ============ Monitoring Management ============

  createEventMonitoring: async (eventId) => {
    try {
      const response = await api.post(`/EventMonitoring/${eventId}/create`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error creating event monitoring' };
    }
  },

  getEventMonitoringDetails: async (eventId) => {
    try {
      const response = await api.get(`/EventMonitoring/${eventId}/details`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error retrieving monitoring details' };
    }
  },

  updateEventMonitoring: async (eventId, { notes }) => {
    try {
      const response = await api.put(`/EventMonitoring/${eventId}`, { notes });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error updating event monitoring' };
    }
  },

  // ============ Facial Recognition ============

  storeFacialData: async (eventId, attendeeId, { facialDataJson }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/facial-data/${attendeeId}`,
        { facialDataJson }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error storing facial data' };
    }
  },

  getFacialData: async (eventId, attendeeId) => {
    try {
      const response = await api.get(`/EventMonitoring/${eventId}/facial-data/${attendeeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error retrieving facial data' };
    }
  },

  deleteFacialData: async (eventId, attendeeId) => {
    try {
      const response = await api.delete(`/EventMonitoring/${eventId}/facial-data/${attendeeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error deleting facial data' };
    }
  },

  facialCheckIn: async (eventId, { facialDataJson, imageData = null }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/facial-checkin`,
        { facialDataJson, imageData }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error during facial recognition check-in' };
    }
  },

  facialCheckOut: async (eventId, { facialDataJson, imageData = null, numberOfPeople = null }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/facial-checkout`,
        { facialDataJson, imageData, numberOfPeople }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error during facial recognition check-out' };
    }
  },

  // ============ Export and Search ============

  exportAttendance: async (eventId, format = 'csv') => {
    try {
      const response = await api.get(`/EventMonitoring/${eventId}/export-attendance`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error exporting attendance data' };
    }
  },

  searchAttendees: async (eventId, query) => {
    try {
      const response = await api.get(`/EventMonitoring/${eventId}/search-attendees`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error searching attendees' };
    }
  },

  // ============ Notes Management ============

  addEventMonitoringNote: async (eventId, { note }) => {
    try {
      const response = await api.post(
        `/EventMonitoring/${eventId}/notes`,
        { note }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error adding note' };
    }
  },

  getEventMonitoringNotes: async (eventId) => {
    try {
      const response = await api.get(`/EventMonitoring/${eventId}/notes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error retrieving notes' };
    }
  },

  // ============ Event Summary ============

  getEventMonitoringSummary: async (eventId) => {
    try {
      const response = await api.get(`/EventMonitoring/${eventId}/summary`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error generating event summary' };
    }
  },

  // ============ Messaging Services ============

  sendMessage: async ({ identifier, method, message }) => {
    try {
      const response = await api.post(
        '/EventMonitoring/send-message',
        { identifier, method, message }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error sending message' };
    }
  },
verifyOtp: async (identifier, otpCode) => {
    try {
      const response = await api.post(
        '/EventMonitoring/verify-otp',
        {}, // empty body
        {
          params: { identifier, otpCode }, // query parameters
          headers: { 'accept': '*/*' } // headers if needed
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error verifying OTP' };
    }
  }
};

export default eventMonitoringService;