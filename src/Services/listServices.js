import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const listService = {
  // Get attendees for a specific list
  getListAttendees: async (listId) => {
    try {
      const response = await api.get(`/organizer/attendees/getall?listId=${listId}`);
      return response.data || [];
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching attendees' };
    }
  },

  // Send email invite to an attendee
  sendEmailInvite: async (eventId, attendeeId, message) => {
    try {
      const response = await api.post(
        `/event/${eventId}/send-email-invite/${attendeeId}`,
        { message }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error sending email invite' };
    }
  },

  // Send SMS invite to an attendee
  sendSmsInvite: async (eventId, attendeeId, message) => {
    try {
      const response = await api.post(
        `/event/${eventId}/send-sms-invite/${attendeeId}`,
        { message }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error sending SMS invite' };
    }
  },

  // Send invites to an entire list
  sendListInvites: async (eventId, listId, message, method) => {
    try {
      const response = await api.post(
        `/event/${eventId}/send-list-invites/${listId}`,
        { message, method }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error sending list invites' };
    }
  }
};

export default listService;