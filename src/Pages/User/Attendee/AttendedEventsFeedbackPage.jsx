import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaClock, 
  FaUserFriends, 
  FaStar,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import feedbackService from '../../../Services/feedbackService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AttendedEventsFeedbackPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState({});
  const [myFeedback, setMyFeedback] = useState({}); // Store feedback data
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get attended events
        const attendedEvents = await feedbackService.getMyAttendedEvents();
        
        // Get user's existing feedback to check which events already have feedback
        const myFeedback = await feedbackService.getMyFeedback();
        
        // Create maps for feedback status and feedback data
        const feedbackMap = {};
        const feedbackDataMap = {};
        
        myFeedback.forEach(fb => {
          feedbackMap[fb.eventId] = true;
          feedbackDataMap[fb.eventId] = {
            rating: fb.rating,
            comment: fb.comment
          };
        });
        
        // Set feedback status and data for each event
        const statusMap = {};
        attendedEvents.forEach(event => {
          statusMap[event.id] = feedbackMap[event.id] ? 'submitted' : 'pending';
        });
        
        setFeedbackStatus(statusMap);
        setMyFeedback(feedbackDataMap);
        setEvents(attendedEvents);
      } catch (err) {f
        setError(err.message || 'Failed to load data');
        toast.error(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewFeedback = (eventId) => {
    if (feedbackStatus[eventId] === 'submitted') {
      navigate(`/attendee/events/${eventId}/feedback/thank-you`, {
        state: {
          feedback: myFeedback[eventId]
        }
      });
    } else {
      navigate(`/attendee/events/${eventId}/feedback`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading your attended events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-6 bg-red-100 rounded-lg max-w-md">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Events</h2>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Attended Events</h1>
          <p className="text-md text-gray-600">Events you've attended and can provide feedback for</p>
        </motion.div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-700 mb-4">No attended events found</h2>
            <p className="text-gray-500 mb-6">
              You haven't attended any events yet or all your attended events already have feedback.
            </p>
            <button
              onClick={() => navigate('/attendee/events')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-800 mb-1">{event.title}</h2>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-1 text-indigo-500" />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <FaClock className="mr-1 text-indigo-500" />
                          <span>{formatTime(event.start_time)} - {formatTime(event.endTime)}</span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center">
                            <FaMapMarkerAlt className="mr-1 text-indigo-500" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      {feedbackStatus[event.id] === 'submitted' ? (
                        <div className="flex items-center text-green-600 text-sm mb-1">
                          <FaCheckCircle className="mr-1" />
                          <span>Feedback Submitted</span>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm mb-1">
                          Feedback Pending
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleViewFeedback(event.id)}
                        className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center ${
                          feedbackStatus[event.id] === 'submitted'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <FaStar className="mr-1" />
                        {feedbackStatus[event.id] === 'submitted' ? 'View' : 'Provide'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendedEventsFeedbackPage;