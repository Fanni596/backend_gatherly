import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaStar, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaUserFriends, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import feedbackService from '../../../Services/feedbackService';
import EventsPage from './EventsPage'; // For consistent styling
import axios from 'axios';
const FeedbackPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user has already submitted feedback for this event
        const myFeedback = await feedbackService.getMyFeedback();
        const alreadySubmitted = myFeedback.some(fb => fb.eventId == eventId);
        
        if (alreadySubmitted) {
          setSubmitted(true);
          navigate(`/attendee/events/${eventId}/feedback/thank-you`);
          return;
        }

        // Get the event details
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/AttendeeEvents/${eventId}`,
          { withCredentials: true }
        );
        
        console

        setEvent(response.data);
        
        // Verify the event has ended
        const today = new Date();
        const eventDate = new Date(response.data.start_date);
        const endTime = new Date(response.data.end_time);
        const eventEndDateTime = new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate(),
          endTime.getHours(),
          endTime.getMinutes(),
          endTime.getSeconds()
        );

        if (today < eventEndDateTime) {
          setError('Feedback can only be submitted after the event has ended');
        }

      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load event details');
        toast.error(err.response?.data?.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, navigate]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      await feedbackService.submitFeedback(eventId, rating, comment);
      setSubmitted(true);
      navigate(`/attendee/events/${eventId}/feedback/thank-you`);
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-6 bg-red-100 rounded-lg max-w-md">
          <div className="text-red-500 text-3xl mx-auto mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Event</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/attendee/events')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-6 bg-white rounded-lg max-w-md shadow-lg">
          <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your feedback has been submitted successfully.</p>
          <button 
            onClick={() => navigate(`/attendee/events/${eventId}`)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Feedback</h1>
          <p className="text-lg text-gray-600">Help us improve by sharing your experience</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{event.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center text-gray-600">
              <FaCalendarAlt className="mr-2 text-indigo-500" />
              <span>{formatDate(event.start_date)}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <FaClock className="mr-2 text-indigo-500" />
              <span>
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <FaMapMarkerAlt className="mr-2 text-indigo-500" />
              <span>{event.location || 'Online Event'}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <FaUserFriends className="mr-2 text-indigo-500" />
              <span>Organized by {event.organizer_name}</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <form onSubmit={handleSubmitFeedback}>
            <div className="mb-8">
              <label className="block text-lg font-medium text-gray-700 mb-4">
                How would you rate this event?
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <FaStar
                      className={`text-4xl ${(hoverRating || rating) >= star 
                        ? 'text-yellow-400' 
                        : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            <div className="mb-8">
              <label htmlFor="comment" className="block text-lg font-medium text-gray-700 mb-2">
                Tell us about your experience (optional)
              </label>
              <textarea
                id="comment"
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="What did you like? What could be improved?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/attendee/events/${eventId}`)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                disabled={submitting || rating === 0}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default FeedbackPage;