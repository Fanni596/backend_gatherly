import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const ProfileService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/Profile/get-profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching profile' };
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/Profile/update-profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error updating profile' };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/Profile/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error changing password' };
    }
  },

  // Get profile picture
  getProfilePicture: async () => {
    try {
      const response = await api.get('/Profile/profile-picture', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching profile picture' };
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(
        '/Profile/upload-profile-picture',
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

  // Delete profile picture
  deleteProfilePicture: async () => {
    try {
      const response = await api.delete('/Profile/profile-picture');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error deleting profile picture' };
    }
  },
  sendEmailVerification: async (email) => {
    try {
      const response = await api.post('Authentication/send-email-verification', { email })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Error sending email verification' }
    }
  },
  
  // Send phone verification OTP
  sendPhoneVerification: async (phone) => {
    try {
      const response = await api.post('Authentication/send-phone-verification', { phone })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Error sending phone verification' }
    }
  },
  
  // Verify attendee OTP
  verifyAttendeeOtp: async (data) => {
    try {
      const response = await api.post('/Authentication/verify-code', data)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Error verifying OTP' }
    }
  },
};

export default ProfileService;