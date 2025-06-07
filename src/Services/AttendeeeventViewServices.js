import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Replace with your actual API URL

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true // This is crucial for cookies to be sent
});

const AttendeeeventViewService = {
  // Get all events (with access control)
  getAllEvents: async (status = null) => {
    try {
      const response = await api.get('/eventview', {
        params: status ? { status } : {}
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching events' };
    }
  },

  // Get single event by ID (with access control)
  getEventById: async (eventId) => {
    try {
      const response = await api.get(`/AttendeeEvents/${eventId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw { message: 'Event not found or you don\'t have access' };
      }
      throw error.response?.data || { message: 'Error fetching event' };
    }
  },

  // Get event media (with access control)
  getEventMedia: async (eventId) => {
    try {
      const response = await api.get(`/AttendeeEvents/${eventId}/media`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw { message: 'Event not found or you don\'t have access' };
      }
      throw error.response?.data || { message: 'Error fetching media' };
    }
  },

  // Get event statistics (organizer only)
  getEventStatistics: async (eventId) => {
    try {
      const response = await api.get(`/eventview/${eventId}/statistics`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching statistics' };
    }
  },

  // Register for an event (public access)
  registerForEvent: async (eventId, registrationData) => {
    try {
      const response = await api.post(
        `/eventview/${eventId}/register`,
        registrationData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error registering for event' };
    }
  },

  // Check registration status (for authenticated users)
  checkRegistrationStatus: async (eventId) => {
    try {
      const response = await api.get(`/eventview/${eventId}/registration-status`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return { registered: false, message: 'Not authenticated' };
      }
      throw error.response?.data || { message: 'Error checking registration status' };
    }
  }
};

export default AttendeeeventViewService;