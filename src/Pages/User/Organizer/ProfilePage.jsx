import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Lock, Eye, EyeOff,
  Camera, Check, X, Loader2, Pencil, Save, Key, 
  ChevronRight, Trash2, Image as ImageIcon, Video
} from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import profileService from '../../../Services/profileServices';
// import Modal from 'react-modal';

// Set modal root for accessibility
Modal.setAppElement('#root');

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [showImageOptions, setShowImageOptions] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    control,
    watch
  } = useForm();

  const currentPassword = watch('currentPassword', '');
  const newPassword = watch('newPassword', '');

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile();
        setUserData(data);
        reset({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address
        });

        if (data.hasProfilePicture) {
          fetchProfilePicture();
        }
      } catch (error) {
        toast.error(error.message || 'Failed to fetch profile');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchProfilePicture = async () => {
      try {
        const blob = await profileService.getProfilePicture();
        const imageUrl = URL.createObjectURL(blob);
        setProfilePicture(imageUrl);
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    fetchProfile();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [navigate, reset]);

  // Get available camera devices
  useEffect(() => {
    const getCameraDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };

    if (showCameraModal) {
      getCameraDevices();
    }
  }, [showCameraModal]);

  // Handle camera stream when ref changes
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    }
  }, [cameraStream]);

  const handleUpdateProfile = async (data) => {
    try {
      const response = await profileService.updateProfile(data);
      toast.success(response.message);
      setEditMode(false);
      const profileData = await profileService.getProfile();
      setUserData(profileData);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (data) => {
    try {
      const response = await profileService.changePassword(data);
      toast.success(response.message);
      setPasswordMode(false);
      reset({
        currentPassword: '',
        newPassword: ''
      });
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    }
  };

 const compressImage = async (file) => {
    // Skip compression for already small files (under 100KB)
    if (file.size <= 100 * 1024) {
        return file;
    }

    const isPNG = file.type === 'image/png';
    const options = {
        maxSizeMB: isPNG ? 0.5 : 0.2,
        maxWidthOrHeight: isPNG ? 800 : 1024,
        useWebWorker: true,
        initialQuality: isPNG ? 0.7 : 0.8,
        fileType: isPNG ? 'image/png' : 'image/jpeg'
    };

    try {
        const imageCompression = (await import('browser-image-compression')).default;
        const compressedBlob = await imageCompression(file, options);
        
        // If compression didn't reduce size, return original
        if (compressedBlob.size >= file.size) {
            console.log('Compression not effective, returning original');
            return file;
        }
        
        console.log('Original size:', file.size, 'Compressed size:', compressedBlob.size);
        
        // Convert Blob back to File with original file's name and lastModified date
        const compressedFile = new File([compressedBlob], file.name, {
            type: compressedBlob.type,
            lastModified: file.lastModified
        });
        
        return compressedFile;
    } catch (error) {
        console.error('Image compression error:', error);
        return file; // Return original if compression fails
    }
};

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and GIF images are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      const compressedFile = await compressImage(file);
      setProfilePictureFile(compressedFile);
      setProfilePicture(URL.createObjectURL(compressedFile));
    } catch (error) {
      toast.error('Failed to process image');
      console.error('Image processing error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const startCamera = async () => {
    setCameraLoading(true);
    setShowCameraModal(true);
    setShowImageOptions(false);
    try {
      // Stop any existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }

      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: !selectedCamera ? 'user' : undefined
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setCameraLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraLoading(false);
      
      let errorMessage = 'Could not access camera';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Please allow camera access in your browser settings';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera device found';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints could not be satisfied';
      }
      
      toast.error(errorMessage);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCameraLoading(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('Failed to capture photo');
        return;
      }
      
      const file = new File([blob], 'profile-photo.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      try {
        setIsUploading(true);
        const compressedFile = await compressImage(file);
        setProfilePictureFile(compressedFile);
        setProfilePicture(URL.createObjectURL(compressedFile));
        stopCamera();
      } catch (error) {
        toast.error('Failed to process captured image');
        console.error('Image processing error:', error);
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const uploadProfilePicture = async () => {
    if (!profilePictureFile) return;

    try {
      setIsUploading(true);
      const response = await profileService.uploadProfilePicture(profilePictureFile);
      toast.success(response.message);
      const profileData = await profileService.getProfile();
      setUserData(profileData);
      const blob = await profileService.getProfilePicture();
      setProfilePicture(URL.createObjectURL(blob));
      setProfilePictureFile(null);
    } catch (error) {
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteProfilePicture = async () => {
    try {
      const response = await profileService.deleteProfilePicture();
      toast.success(response.message);
      setProfilePicture(null);
      setProfilePictureFile(null);
      const profileData = await profileService.getProfile();
      setUserData(profileData);
    } catch (error) {
      toast.error(error.message || 'Failed to delete profile picture');
    }
  };

    // Update the triggerFileInput function
  const triggerFileInput = () => {
    setShowImageOptions(true);
  };
// Add this new modal for image source selection
  const ImageSourceModal = () => (
    <Modal
      isOpen={showImageOptions}
      onRequestClose={() => setShowImageOptions(false)}
      contentLabel="Image Source Options"
      className="modal"
      overlayClassName="modal-overlay"
    >
      <div className="relative max-w-md mx-auto bg-white rounded-lg p-6">
        <button 
          onClick={() => setShowImageOptions(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-xl font-bold mb-6 text-center">Select Image Source</h3>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => {
              fileInputRef.current.click();
              setShowImageOptions(false);
            }}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <ImageIcon className="h-5 w-5 mr-2" />
            Choose from Gallery
          </button>
          <button
            onClick={startCamera}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <Video className="h-5 w-5 mr-2" />
            Take a Photo
          </button>
        </div>
      </div>
    </Modal>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No user data found</h2>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" richColors closeButton />
        <ImageSourceModal />
      {/* Image View Modal */}
      <Modal
        isOpen={showImageModal}
        onRequestClose={() => setShowImageModal(false)}
        contentLabel="Profile Picture"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="relative max-w-4xl mx-auto bg-white rounded-lg p-4">
          <button 
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="flex justify-center p-8">
            {profilePicture && (
              <img 
                src={profilePicture} 
                alt="Profile" 
                className="max-h-[80vh] max-w-full object-contain"
              />
            )}
          </div>
        </div>
      </Modal>

      {/* Camera Modal */}
      <Modal
        isOpen={showCameraModal}
        onRequestClose={stopCamera}
        contentLabel="Camera"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="relative max-w-2xl mx-auto bg-black rounded-lg overflow-hidden">
          <button 
            onClick={stopCamera}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="h-6 w-6" />
          </button>
          
          {/* Camera selector */}
          {availableCameras.length > 1 && (
            <div className="absolute top-4 left-4 z-10">
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="bg-gray-800 text-white p-2 rounded text-sm"
              >
                {availableCameras.map(camera => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Loading state */}
          {cameraLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">Starting camera...</p>
              </div>
            </div>
          )}
          
          {/* Video element */}
          <div className="relative aspect-square">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraLoading ? 'invisible' : 'visible'}`}
            />
            
            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Capture button */}
            {!cameraLoading && cameraStream && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex justify-center">
                  <button
                    onClick={capturePhoto}
                    className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition"
                  >
                    <Camera className="h-8 w-8 text-gray-800" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          {/* Profile header */}
          <div className="relative">
            <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            
            <div className="absolute top-1/2 right-8 transform -translate-y-1/2 text-right">
              <h1 className="text-3xl font-bold text-white">{userData.firstName} {userData.lastName}</h1>
              <p className="text-indigo-100">{userData.email}</p>
            </div>
            
            {/* Profile picture */}
            <div className="absolute -bottom-16 left-8">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <button 
                  onClick={() => profilePicture && setShowImageModal(true)}
                  className="w-32 h-32 rounded-full bg-white p-1 shadow-xl focus:outline-none"
                >
                  <div className="w-full h-full rounded-full overflow-hidden">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 text-indigo-400">
                        <User className="h-16 w-16" />
                      </div>
                    )}
                  </div>
                </button>
                 {editMode && (
        <>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={triggerFileInput} // Changed from startCamera to triggerFileInput
            className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 group-hover:opacity-100 opacity-90"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </>
      )}
              </motion.div>
            </div>
            
            {/* Remove picture button */}
            {userData.hasProfilePicture && editMode && (
              <div className="absolute bottom-0 right-0 mb-4 mr-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={deleteProfilePicture}
                  className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Picture
                </motion.button>
              </div>
            )}
          </div>
          
          {/* Profile content */}
          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar navigation */}
              <div className="w-full md:w-1/4">
                <div className="bg-white rounded-xl shadow-sm p-4 sticky top-8">
                  <nav className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setEditMode(false);
                        setPasswordMode(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>Profile Information</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveTab('edit');
                        setEditMode(true);
                        setPasswordMode(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all ${activeTab === 'edit' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>Edit Profile</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveTab('password');
                        setPasswordMode(true);
                        setEditMode(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all ${activeTab === 'password' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>Change Password</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              </div>

              {/* Main content */}
              <div className="w-full md:w-3/4">
                <AnimatePresence mode="wait">
                  {passwordMode ? (
                    <motion.div
                      key="password"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-xl shadow-sm p-6"
                    >
                      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <Key className="h-6 w-6 mr-2 text-indigo-500" />
                        Change Password
                      </h2>
                      
                      <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Current Password</label>
                            <div className="relative">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                {...register('currentPassword', { required: 'Current password is required' })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="Enter your current password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-3.5 text-gray-500 hover:text-indigo-600 transition"
                              >
                                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                            {errors.currentPassword && (
                              <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                {...register('newPassword', {
                                  required: 'New password is required',
                                  minLength: {
                                    value: 8,
                                    message: 'Password must be at least 8 characters'
                                  },
                                  pattern: {
                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                    message: 'Password must include uppercase, lowercase, number and special character'
                                  }
                                })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="Enter your new password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-3.5 text-gray-500 hover:text-indigo-600 transition"
                              >
                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                            {errors.newPassword && (
                              <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setPasswordMode(false)}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={!currentPassword || !newPassword}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                          >
                            Update Password
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  ) : editMode ? (
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-xl shadow-sm p-6"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                          <Pencil className="h-6 w-6 mr-2 text-indigo-500" />
                          Edit Profile
                        </h2>
                        {profilePictureFile && (
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={uploadProfilePicture}
                              disabled={isUploading}
                              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                            >
                              {isUploading ? (
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              Save Picture
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setProfilePictureFile(null);
                                if (userData.hasProfilePicture) {
                                  setProfilePicture(URL.createObjectURL(profileService.getProfilePicture()));
                                } else {
                                  setProfilePicture(null);
                                }
                              }}
                              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                            >
                              Cancel
                            </motion.button>
                          </div>
                        )}
                      </div>
                      
                      <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                              type="text"
                              {...register('firstName', { required: 'First name is required' })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                            {errors.firstName && (
                              <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                              type="text"
                              {...register('lastName', { required: 'Last name is required' })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                            {errors.lastName && (
                              <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-400 mr-2" />
                            <input
                              type="email"
                              {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Invalid email address'
                                }
                              })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                          </div>
                          {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <div className="flex items-center">
                            <Phone className="h-5 w-5 text-gray-400 mr-2" />
                            <Controller
                              name="phone"
                              control={control}
                              rules={{ required: 'Phone number is required' }}
                              render={({ field }) => (
                                <PhoneInput
                                  defaultCountry="pk"
                                  value={field.value}
                                  onChange={field.onChange}
                                  inputClassName="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                              )}
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Address</label>
                          <div className="flex items-center">
                            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                            <input
                              type="text"
                              {...register('address')}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setEditMode(false)}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={!isDirty}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                          >
                            Save Changes
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-xl shadow-sm p-6"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Profile
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">First Name</p>
                            <p className="text-lg font-medium text-gray-800">{userData.firstName}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Last Name</p>
                            <p className="text-lg font-medium text-gray-800">{userData.lastName}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Email</p>
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-400 mr-2" />
                            <p className="text-lg font-medium text-gray-800">{userData.email}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Phone</p>
                          <div className="flex items-center">
                            <Phone className="h-5 w-5 text-gray-400 mr-2" />
                            <p className="text-lg font-medium text-gray-800">{userData.phone}</p>
                          </div>
                        </div>

                        {userData.address && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Address</p>
                            <div className="flex items-center">
                              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                              <p className="text-lg font-medium text-gray-800">{userData.address}</p>
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Member Since</p>
                          <p className="text-lg font-medium text-gray-800">
                            {new Date(userData.dateCreated).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .modal {
          position: fixed;
          top: 50%;
          left: 50%;
          right: auto;
          bottom: auto;
          transform: translate(-50%, -50%);
          background: transparent;
          border: none;
          overflow: auto;
          outline: none;
          padding: 0;
          max-width: 95vw;
          width: auto;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
          z-index: 999;
        }

        /* Fix for react-international-phone input */
        .react-international-phone-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          line-height: 1.5;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .react-international-phone-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;