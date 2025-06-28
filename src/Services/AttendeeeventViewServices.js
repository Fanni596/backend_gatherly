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

  // Get event statistics (attendee side)
  getEventAttendeesStatistics: async (listId) => {
    try {
      const response = await api.get(`/AttendeeEvents/stats_confirmed?listId=${listId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching statistics' };
    }
  },


  // Get attendee lists for an event attendee side without jwt
getEventAttendeeLists: async (eventId) => {
  try {
    const response = await api.get(`/AttendeeEvents/${eventId}/attendee-lists`);
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error.response?.data || { message: 'Error fetching attendee lists' };
  }
},
  // // Register for an event (public access)
  // registerForEvent: async (eventId, registrationData) => {
  //   try {
  //     const response = await api.post(
  //       `/eventview/${eventId}/register`,
  //       registrationData
  //     );
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || { message: 'Error registering for event' };
  //   }
  // },

  // // Check registration status (for authenticated users)
  // checkRegistrationStatus: async (eventId) => {
  //   try {
  //     const response = await api.get(`/eventview/${eventId}/registration-status`);
  //     return response.data;
  //   } catch (error) {
  //     if (error.response?.status === 401) {
  //       return { registered: false, message: 'Not authenticated' };
  //     }
  //     throw error.response?.data || { message: 'Error checking registration status' };
  //   }
  // }
   // Register for an event
  // Register for an event
registerForEvent: async (eventId, registrationData) => {
  try {
    const response = await api.post(`/AttendeeEvents/${eventId}/register`, registrationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error registering for event' };
  }
},

// Check registration status
checkRegistrationStatus: async (eventId) => {
  try {
    const response = await api.get(`/AttendeeEvents/${eventId}/check-registration`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      return { isRegistered: false, message: 'Not authenticated' };
    }
    throw error.response?.data || { message: 'Error checking registration status' };
  }
},

// Confirm attendee (after verification/payment)
confirmAttendee: async (eventId, attendeeId, isPaid = false) => {
  try {
    const response = await api.post(`/AttendeeEvents/${eventId}/confirm-attendee`, {
      attendeeId,
      isPaid
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error confirming attendee' };
  }
},
// Add these methods to AttendeeeventViewService

// Check payment status
checkPaymentStatus: async (eventId, attendeeId) => {
  try {
    const response = await api.get(`/AttendeeEvents/${eventId}/payment-status/${attendeeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error checking payment status' };
  }
},

// Get payment details
getPaymentDetails: async (paymentId) => {
  try {
    const response = await api.get(`/payment/status/${paymentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error fetching payment details' };
  }
}
};

export default AttendeeeventViewService;