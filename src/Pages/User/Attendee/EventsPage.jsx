import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaSearch, 
  FaFilter, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaClock,
  FaTicketAlt,
  FaUserFriends,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaExclamationTriangle,
  FaRegBookmark,
  FaBookmark,
  FaRegHeart,
  FaHeart,
  FaLock,
  FaImage
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from '../../../Config/ProtectedRoute';
const VITE_API_IMG_BASE_URL = import.meta.env.VITE_API_IMG_BASE_URL; // Replace with your actual API URL

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [privateEvents, setPrivateEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    date: 'upcoming',
    price: 'all',
    category: 'all',
    type: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPrivateEvents, setShowPrivateEvents] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const eventsPerPage = 12;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_API_BASE_URL}/AttendeeAuthentication/check-auth`, { 
          withCredentials: true 
        });
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const fetchEventMedia = async (eventId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/AttendeeEvents/${eventId}/media`,
        { withCredentials: true }
      );
      return {
        images: response.data.images || [],
        videos: response.data.videos || []
      };
    } catch (error) {
      console.error(`Error fetching media for event ${eventId}:`, error);
      return { images: [], videos: [] };
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/AttendeeEvents`, {
        params: {
          search: searchQuery,
          category: filters.category !== 'all' ? filters.category : '',
          type: filters.type !== 'all' ? filters.type : ''
        },
        withCredentials: true 
      });
      
      const eventsWithMedia = await Promise.all(
        response.data.map(async (event) => {
          try {
            const media = await fetchEventMedia(event.id);
            const thumbnail = media.images.find(img => img.is_thumbnail) || media.images[0] || null;
            return { 
              ...event, 
              media, 
              thumbnail,
              is_saved: event.is_saved || false,
              is_liked: event.is_liked || false,
              like_count: event.like_count || 0
            };
          } catch (error) {
            console.error(`Error processing event ${event.id}:`, error);
            return { 
              ...event, 
              media: { images: [], videos: [] },
              thumbnail: null,
              is_saved: event.is_saved || false,
              is_liked: event.is_liked || false,
              like_count: event.like_count || 0
            };
          }
        })
      );

      let filteredEvents = eventsWithMedia;
      
      if (filters.price === 'free') {
        filteredEvents = filteredEvents.filter(event => event.ticket_type === 'free');
      } else if (filters.price === 'paid') {
        filteredEvents = filteredEvents.filter(event => event.ticket_type === 'paid');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filters.date === 'upcoming') {
        filteredEvents = filteredEvents.filter(event => new Date(event.start_date) >= today);
      } else if (filters.date === 'past') {
        filteredEvents = filteredEvents.filter(event => new Date(event.start_date) < today);
      }

      filteredEvents.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      const totalEvents = filteredEvents.length;
      setTotalPages(Math.ceil(totalEvents / eventsPerPage));
      const startIndex = (currentPage - 1) * eventsPerPage;
      const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);
      
      setEvents(paginatedEvents);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events');
      toast.error(err.response?.data?.message || 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrivateEvents = async () => {
    if (!isAuthenticated || !showPrivateEvents) return;
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/AttendeeEvents/private`,
        { withCredentials: true }
      );
      
      const privateEventsWithMedia = await Promise.all(
        response.data.map(async (event) => {
          try {
            const media = await fetchEventMedia(event.id);
            const thumbnail = media.images.find(img => img.is_thumbnail) || media.images[0] || null;
            return { 
              ...event, 
              media, 
              thumbnail,
              is_saved: event.is_saved || false,
              is_liked: event.is_liked || false,
              like_count: event.like_count || 0
            };
          } catch (error) {
            console.error(`Error processing private event ${event.id}:`, error);
            return { 
              ...event, 
              media: { images: [], videos: [] },
              thumbnail: null,
              is_saved: event.is_saved || false,
              is_liked: event.is_liked || false,
              like_count: event.like_count || 0
            };
          }
        })
      );
      
      setPrivateEvents(privateEventsWithMedia);
    } catch (err) {
      console.error('Error fetching private events:', err);
      toast.error(err.response?.data?.message || 'Failed to load private events');
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchPrivateEvents();
  }, [filters, currentPage, showPrivateEvents, isAuthenticated]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
      fetchEvents();
    fetchPrivateEvents();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
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

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleSaveEvent = async (eventId, e) => {
    e.stopPropagation();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/AttendeeEvents/${eventId}/save`,
        {},
        { withCredentials: true }
      );
      
      setEvents(events.map(event => 
        event.id === eventId ? { ...event, is_saved: response.data.isSaved } : event
      ));
      setPrivateEvents(privateEvents.map(event => 
        event.id === eventId ? { ...event, is_saved: response.data.isSaved } : event
      ));
      
      toast.success(response.data.isSaved ? 'Event saved to your list' : 'Event removed from saved list');
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Please sign in to save events');
      } else {
        toast.error(err.response?.data?.message || 'Failed to update saved status');
      }
    }
  };

  const toggleLikeEvent = async (eventId, e) => {
    e.stopPropagation();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/AttendeeEvents/${eventId}/like`,
        {},
        { withCredentials: true }
      );
      
      setEvents(events.map(event => 
        event.id === eventId ? { 
          ...event, 
          is_liked: response.data.isLiked,
          like_count: response.data.likeCount
        } : event
      ));
      setPrivateEvents(privateEvents.map(event => 
        event.id === eventId ? { 
          ...event, 
          is_liked: response.data.isLiked,
          like_count: response.data.likeCount
        } : event
      ));
      
      toast.success(response.data.isLiked ? 'Added to favorites' : 'Removed from favorites');
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Please sign in to like events');
      } else {
        toast.error(err.response?.data?.message || 'Failed to update like status');
      }
    }
  };

  const isRegistrationOpen = (event) => {
    if (!event.registration_expiry) return true;
    const now = new Date();
    const expiryDate = new Date(event.registration_expiry);
    return now < expiryDate;
  };

  const EventImage = ({ event, isPrivate = false }) => {
    return (
      <div className="relative h-48 bg-gray-100">
        {event.thumbnail ? (
          <img
            src={VITE_API_IMG_BASE_URL + `/${event.thumbnail.file_path}`}
            alt={event.title}
            className="w-full h-full object-cover"
            // onError={(e) => {
            //   e.target.onerror = null;
            //   e.target.src = `${import.meta.env.VITE_API_BASE_URL}/uploads/event_images/default-event.jpg`;
            // }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FaImage className="text-4xl mb-2" />
            <p>No Image Available</p>
          </div>
        )}
        {isPrivate && (
          <div className="absolute top-3 left-3 flex items-center bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
            <FaLock className="mr-1" /> Private
          </div>
        )}
        <div className="absolute top-3 right-3 flex space-x-2">
          <button 
            onClick={(e) => toggleSaveEvent(event.id, e)}
            className={`p-2 rounded-full ${event.is_saved 
              ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' 
              : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            aria-label={event.is_saved ? "Remove from saved" : "Save event"}
          >
            {event.is_saved ? <FaBookmark /> : <FaRegBookmark />}
          </button>
          <button 
            onClick={(e) => toggleLikeEvent(event.id, e)}
            className={`p-2 rounded-full ${event.is_liked 
              ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' 
              : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            aria-label={event.is_liked ? "Unlike event" : "Like event"}
          >
            <div className="flex items-center">
              {event.is_liked ? <FaHeart /> : <FaRegHeart />}
              <span className="ml-1 text-xs">{event.like_count || 0}</span>
            </div>
          </button>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            event.ticket_type === 'paid' 
              ? 'bg-indigo-100 text-indigo-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {event.ticket_type === 'paid' 
              ? `${event.ticket_price} ${event.currency}` 
              : 'FREE'}
          </span>
        </div>
        {!isRegistrationOpen(event) && (
          <div className="absolute top-3 left-3 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
            Registration Closed
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-6 bg-red-100 rounded-lg max-w-md">
          <FaExclamationTriangle className="text-red-500 text-3xl mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Events</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchEvents();
              fetchPrivateEvents();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-gray-900 mb-4"
        >
          Discover Events
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xl text-gray-600 max-w-3xl mx-auto"
        >
          Find exciting events happening near you or online
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search events by title, description, location or organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FaFilter className="mr-2" />
              Filters
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </form>

          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <select
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                  <option value="all">All Dates</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <select
                  name="price"
                  value={filters.price}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Prices</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="networking">Networking</option>
                  <option value="social">Social</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="in-person">In-Person</option>
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {isAuthenticated && (
        <div className="max-w-7xl mx-auto mb-6">
          <button
            onClick={() => setShowPrivateEvents(!showPrivateEvents)}
            className={`px-4 py-2 rounded-lg ${showPrivateEvents ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'} transition-colors`}
            >
            <FaLock className="inline mr-2" />
            {showPrivateEvents ? 'Hide Private Events' : 'Show My Private Events'}
          </button>
        </div>
      )}
    

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {showPrivateEvents && isAuthenticated && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Private Events</h2>
            {privateEvents.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                <p className="text-gray-600">You don't have any private events yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {privateEvents.map((event) => (
                  <motion.div 
                    key={`private-${event.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer border-2 border-indigo-200"
                    onClick={() => navigate(`/attendee/events/${event.id}`)}
                  >
                    <EventImage event={event} isPrivate={true} />
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {event.title}
                        </h3>
                        {event.ticket_type === 'paid' && (
                          <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded">
                            {event.ticket_price} {event.currency}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <span className="text-indigo-600 font-medium">{event.organizer_name}</span>
                      </div>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {event.summary || event.description?.substring(0, 100) + '...'}
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <FaCalendarAlt className="mr-2 text-gray-400" />
                          <span>{formatDate(event.start_date)}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                          <FaClock className="mr-2 text-gray-400" />
                          <span>
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                          <FaMapMarkerAlt className="mr-2 text-gray-400" />
                          <span className="line-clamp-1">
                            {event.location || 'Online Event'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex items-center text-sm text-gray-500">
                          <FaUserFriends className="mr-1 text-gray-400" />
                          <span>
                            {event.capacity ? `${event.capacity} spots` : 'Unlimited'}
                          </span>
                        </div>
                        <button 
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/attendee/events/${event.id}`);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Public Events</h2>
        {events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || Object.values(filters).some(f => f !== 'all') 
                ? "Try adjusting your search or filter criteria" 
                : "There are currently no events available. Please check back later."}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  date: 'upcoming',
                  price: 'all',
                  category: 'all',
                  type: 'all'
                });
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => navigate(`/attendee/events/${event.id}`)}
                >
                  <EventImage event={event} />
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {event.title}
                      </h3>
                      {event.ticket_type === 'paid' && (
                        <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded">
                          {event.ticket_price} {event.currency}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <span className="text-indigo-600 font-medium">{event.organizer_name}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.summary || event.description?.substring(0, 100) + '...'}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <FaClock className="mr-2 text-gray-400" />
                        <span>
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <FaMapMarkerAlt className="mr-2 text-gray-400" />
                        <span className="line-clamp-1">
                          {event.location || 'Online Event'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaUserFriends className="mr-1 text-gray-400" />
                        <span>
                          {event.capacity ? `${event.capacity} spots` : 'Unlimited'}
                        </span>
                      </div>
                      <button 
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/attendee/events/${event.id}`);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <FaChevronLeft />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        } transition-colors`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-2">...</span>
                  )}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => goToPage(totalPages)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === totalPages
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      } transition-colors`}
                    >
                      {totalPages}
                    </button>
                  )}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <FaChevronRight />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EventsPage;