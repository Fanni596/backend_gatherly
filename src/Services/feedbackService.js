import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const feedbackService = {
  // Submit feedback for an event
  submitFeedback: async (eventId, rating, comment) => {
    try {
      const response = await api.post('/feedback/submit', {
        eventId,
        rating,
        comment
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error submitting feedback' };
    }
  },

  // Get feedback for a specific event
  getEventFeedback: async (eventId) => {
    try {
      const response = await api.get(`/feedback/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching event feedback' };
    }
  },

  // Get feedback submitted by the current user
  getMyFeedback: async () => {
    try {
      const response = await api.get('/feedback/my-feedback');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching your feedback' };
    }
  },

  // Get events attended by the current user that have ended
  getMyAttendedEvents: async () => {
    try {
      const response = await api.get('/Feedback/my-attended-events');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching your attended events' };
    }
  }
};

export default feedbackService;