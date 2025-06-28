import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft, FaStar } from 'react-icons/fa';

const ThankYouPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <FaCheckCircle className="text-green-500 text-6xl" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Thank You for Your Feedback!</h1>
        
        {feedback && (
          <div className="mb-6 text-left bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Your Feedback:</h3>
            <div className="flex items-center mb-2">
              <span className="mr-2">Rating:</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`text-xl ${
                      i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {feedback.comment && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Comment:</p>
                <p className="text-gray-600">{feedback.comment}</p>
              </div>
            )}
          </div>
        )}
        
        <p className="text-gray-600 mb-6">
          Your feedback helps us improve future events. We appreciate you taking the time to share your experience.
        </p>
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => navigate(`/attendee/events/${eventId}`)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
          >
            <FaArrowLeft className="mr-2" />
            Back to Event
          </button>
          <button
            onClick={() => navigate('/attendee/events')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Browse More Events
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;