import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the AuthContext
export const AuthContext = createContext();

// Create a custom hook for using the context
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [attendeeUser, setattendeeUser] = useState(() => {
    const storedUser = localStorage.getItem('attendeeUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const Logout = async () => {
    try {
      await axios.post(
        import.meta.env.VITE_API_BASE_URL+'/Authentication/logout',
        {},
        { withCredentials: true }
      );
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const AttendeeLogout = async () => {
    try {
      await axios.post(
        import.meta.env.VITE_API_BASE_URL+'/AttendeeAuthentication/logout',
        {},
        { withCredentials: true }
      );
      setattendeeUser(null);
      localStorage.removeItem('attendeeUser');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_BASE_URL+'/Authentication/check-auth',
        { withCredentials: true }
      );
      // Check if the response contains user data
      console.log('Auth check response:', response.data); 
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    }
  };
  const AttendeecheckAuth = async () => {
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_BASE_URL+'/AttendeeAuthentication/check-auth',
        { withCredentials: true }
      );
      // Check if the response contains user data
      console.log('Auth check response:', response.data); 
      if (response.data) {
        setattendeeUser(response.data);
        localStorage.setItem('attendeeUser', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setattendeeUser(null);
    }
  };
  const CurrentPath = window.location.pathname;
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    AttendeecheckAuth();
  }, []);
  return (
    <AuthContext.Provider value={{ user, attendeeUser, Logout, checkAuth,AttendeeLogout,AttendeecheckAuth }}>
      {children}
    </AuthContext.Provider>
  );
};