import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const attendeeProfileService = {
  getProfile: async () => {
    try {
      const response = await api.get('/AttendeeProfile/get-profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching profile' };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/AttendeeProfile/update-profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error updating profile' };
    }
  },

/*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Fetches the profile picture of the currently logged in attendee.
   * @returns A blob of the profile picture, or an error if something went wrong.
   */
/*******  6cc35b8c-8862-4745-8b8d-0942dcba9efe  *******/  getProfilePicture: async () => {
    try {
      const response = await api.get('/AttendeeProfile/profile-picture', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      // Return null if no profile picture exists (404)
      if (error.response?.status === 404) {
        return null;
      }
      throw error.response?.data || { message: 'Error fetching profile picture' };
    }
  },

  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(
        '/AttendeeProfile/upload-profile-picture',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error uploading profile picture' };
    }
  },

  deleteProfilePicture: async () => {
    try {
      const response = await api.delete('/AttendeeProfile/profile-picture');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error deleting profile picture' };
    }
  }
};

export default attendeeProfileService;