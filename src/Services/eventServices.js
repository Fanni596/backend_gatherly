import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Replace with your actual API URL

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true // This is crucial for cookies to be sent
});
const logFormData = (formData) => {
  console.log('--- FormData Contents ---');
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(key, ':', {
        name: value.name,
        type: value.type,
        size: value.size + ' bytes'
      });
    } else {
      console.log(key, ':', value);
    }
  }
};
// const logFormData = (formData) => {
//   console.log('--- FormData Contents ---');
//   for (let [key, value] of formData.entries()) {
    
//       console.log(key, ':', value);
    
//   }
// };
const eventService = {
  // Create a new event (without media)
  createEvent: async (eventData) => {
    try {
      logFormData(eventData); // Add this line
      const response = await api.post('/event', eventData);
      return response.data;
    } catch (error) {
      console.error('Full error response:', error.response); // Add this line
      throw error.response?.data || { message: 'Error creating event' };
    }
  },
  // Update an existing event
  updateEvent: async (eventId, eventData) => {
    logFormData(eventData); // Log the event data
    try {
      const response = await api.put(`/event/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error updating event' };
    }
  },

  // Upload images
  // Upload images
  uploadImages: async (eventId, images) => {
    try {
      const formData = new FormData();
      
      // Append each image file
      images.forEach(file => {
        if (file instanceof File) {
          formData.append('images', file); // Match Swagger's expected field name
        }
      });
  
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value.name, value.size, value.type);
      }
  
      const response = await api.post(
        `/event/${eventId}/images`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error.response?.data || { message: 'Error uploading images' };
    }
  },

  // Upload video
  uploadVideo: async (eventId, video) => {
    console.log('Uploading video:', video);
    try {
      const formData = new FormData();
      formData.append('videos', video);

      const response = await api.post(
        `/event/${eventId}/videos`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error uploading video' };
    }
  },

  // Publish event
  publishEvent: async (eventId) => {
    try {
      const response = await api.post(`/event/${eventId}/publish`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error publishing event' };
    }
  },
  draftEvent: async (eventId) => {
    try {
      const response = await api.post(`/event/${eventId}/draft`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error publishing event' };
    }
  },
  // Get event media
  getEventMedia: async (eventId) => {
    try {
      const response = await api.get(`/event/${eventId}/media`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching media' };
    }
  },

  getEventById: async (eventId) => {
    try {
      const response = await api.get(`/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching event' };
    }
  },

  // Delete an event
  deleteEvent: async (eventId) => {
    try {
      const response = await api.delete(`/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error deleting event' };
    }
  },

  // Delete an image
  deleteImage: async (imageId) => {
    try {
      const response = await api.delete(`/event/images/${imageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error deleting image' };
    }
  },

  // Delete a video
  deleteVideo: async (videoId) => {
    try {
      const response = await api.delete(`/event/videos/${videoId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error deleting video' };
    }
  },

  // In eventService.js
  getAllEvents: async () => {
    const response = await api.get('/event');
    return response.data; // Should return an array
},
// Get attendee lists for an event
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

// Get all lists for the current user
getAllLists: async () => {
  try {
    const response = await api.get('/organizer/attendeeLists/getall');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error fetching lists' };
  }
},

// Attach a list to an event
attachAttendeeList: async (eventId, listId) => {
  try {
    console.log('Attempting to attach list with ID:', listId, 'to event with ID:', eventId);
    const response = await api.post(`/Event/${eventId}/attach-attendee-list/${listId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error attaching list' };
  }
},

// Detach a list from an event
detachAttendeeList: async (eventId, listId) => {
  try {
    const response = await api.delete(`/event/${eventId}/detach-attendee-list/${listId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error detaching list' };
  }
},

// Send email invite to single attendee
sendEmailInvite: async (eventId, attendeeId, message) => {
  try {
    const response = await api.post(
      `/Event/${eventId}/send-email-invite/${attendeeId}`,
      { message }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error sending email invite' };
  }
},

// Send SMS invite to single attendee
sendSmsInvite: async (eventId, attendeeId, message) => {
  try {
    const response = await api.post(
      `/Event/${eventId}/send-sms-invite/${attendeeId}`,
      { message }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error sending SMS invite' };
  }
},

// Send invites to entire list (email or SMS)
sendListInvites: async (eventId, listId, message, method) => {
  try {
    const response = await api.post(
      `/Event/${eventId}/send-list-invites/${listId}`,
      { message, method }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error sending list invites' };
  }
},

createDefaultList: async (eventId, eventTitle) => {
  try {
    const listData = {
      Name: `Attendees for ${eventTitle}`,
      Description: `Default attendee list for ${eventTitle}`,
      IsPrivate: false,
      Tags: [],
      Category: "Event"
    };
      
    const response = await api.post('/organizer/attendeeLists/create', listData);
    console.log('Default list response:', response);
    const listId = response.data.listId;
    
    console.log('Default list created with ID:', listId);

    // Attach the list to the event
    await api.post(`/event/${eventId}/attach-attendee-list/${listId}`);
    
    return listId;
  } catch (error) {
    console.error('Error creating default list:', error);
    throw error.response?.data || { message: 'Error creating default list' };
  }
},

deleteDefaultList: async (listToDelete, eventId) => {
  console.log('hellloo',listToDelete, eventId)
  try {
    await api.delete(`/event/${eventId}/detach-attendee-list/${listToDelete}`);
    const response = await api.delete(`/organizer/AttendeeLists/deleteby:${listToDelete}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error deleting default list' };
  }
},

// Register attendee to event's default list
registerAttendee: async (eventId, attendeeData) => {
  try {
    const response = await api.post(`/event/${eventId}/register`, attendeeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error registering attendee' };
  }
},


};

export default eventService;