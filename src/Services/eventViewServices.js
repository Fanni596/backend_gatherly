import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Replace with your actual API URL

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true // This is crucial for cookies to be sent
});

const eventViewService = {
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
      const response = await api.get(`/eventview/${eventId}`);
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
      const response = await api.get(`/eventview/${eventId}/media`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw { message: 'Event not found or you don\'t have access' };
      }
      throw error.response?.data || { message: 'Error fetching media' };
    }
  },

  // Get attendee lists for an event (organizer only)
  getEventAttendeeLists: async (eventId) => {
    try {
      const response = await api.get(`/event/${eventId}/attendee-lists`);
      return response.data || [];
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error.response?.data || { message: 'Error fetching attendee lists' };
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

  // Get event attendees (organizer only)
  getEventAttendees: async (eventId) => {
    try {
      const response = await api.get(`/Event/${eventId}/attendees`);
      return response.data || [];
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching attendees' };
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
  },

  // ============ NEW SERVICES FOR ATTENDEE STATUS MANAGEMENT ============

  // Add an individual attendee to an event
  addIndividualAttendee: async (eventId, attendeeId) => {
    try {
      const response = await api.post(`/event/${eventId}/add-attendee/${attendeeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error adding attendee' };
    }
  },

  // Remove an attendee from an event
  removeAttendee: async (eventId, attendeeId) => {
    try {
      const response = await api.delete(`/event/${eventId}/remove-attendee/${attendeeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error removing attendee' };
    }
  },

  // Mark an attendee as invited
  markAsInvited: async (eventId, attendeeId) => {
    try {
      const response = await api.post(`/event/${eventId}/attendees/${attendeeId}/invite`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error marking attendee as invited' };
    }
  },

  // Mark an attendee as confirmed
  markAsConfirmed: async (eventId, attendeeId) => {
    try {
      const response = await api.post(`/event/${eventId}/attendees/${attendeeId}/confirm`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error marking attendee as confirmed' };
    }
  },

  // Mark an attendee as paid
  markAsPaid: async (eventId, attendeeId) => {
    try {
      const response = await api.post(`/event/${eventId}/attendees/${attendeeId}/paid`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error marking attendee as paid' };
    }
  },

  // Send email invite to an attendee for public 
  sendEmailInvite: async (eventId, attendeeId, message) => {
    try {
      const response = await api.post(`/eventview/${eventId}/send-email-invite/${attendeeId}`, { message });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error sending email invite' };
    }
  },

  // Send SMS invite to an attendee for public
  sendSmsInvite: async (eventId, attendeeId, message) => {
    try {
      const response = await api.post(`/eventview/${eventId}/send-sms-invite/${attendeeId}`, { message });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error sending SMS invite' };
    }
  },

  // Send invites to all attendees in a list
  sendListInvites: async (eventId, listId, method, message) => {
    try {
      const response = await api.post(`/eventview/${eventId}/send-list-invites/${listId}`, { 
        method, 
        message 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error sending list invites' };
    }
  },
  // Add this to eventViewService in eventViewServices.js
checkAttendeeStatus: async (eventId, attendeeId) => {
  try {
    const response = await api.get(`/eventview/${eventId}/attendees/${attendeeId}/status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error checking attendee status' };
  }
},
// Add these methods to the eventViewService object
checkPublicAttendee: async (eventId, email, phone) => {
  console.log(eventId, email, phone);
  try {
    const response = await api.get(`/EventView/check-public-attendee`, {
      params: { eventId, email, phone }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error checking public attendee' };
  }
},

checkPrivateAttendee: async (eventId, email, phone) => {
  try {
    const response = await api.get(`/EventView/check-private-attendee`, {
      params: { eventId, email, phone }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error checking private attendee' };
  }
},

updateAttendee: async (eventId, attendeeId, attendeeData, visibility) => {
  try {
    const endpoint = visibility === 'public' 
      ? `/Eventview/update-public-attendee/${attendeeId}`
      : `/Eventview/update-private-attendee/${attendeeId}`;
    
    const response = await api.put(endpoint, attendeeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error updating attendee' };
  }
},
};

export default eventViewService;