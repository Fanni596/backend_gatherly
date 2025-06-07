import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
      <h1 className="text-9xl font-bold text-[var(--text)]">404</h1>
      <p className="mt-4 text-2xl text-[var(--text)]">Oops! Page Not Found</p>
      <p className="mt-2 text-[var(--text)]">
        The page you are looking for might have been removed or doesn't exist.
      </p>
      <div className="mt-8 flex space-x-4">
        <Link
          to="/login"
          className="px-8 py-4 bg-[var(--cta)] text-white font-semibold rounded-lg shadow-lg hover:bg-[var(--primary)] transition-colors duration-300"
        >
          Go to Login
        </Link>
        <Link
          to="/"
          className="px-8 py-4 bg-[var(--primary)] text-white font-semibold rounded-lg shadow-lg hover:bg-[var(--cta)] transition-colors duration-300"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;