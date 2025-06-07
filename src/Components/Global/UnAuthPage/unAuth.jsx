import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  // Handle login button click
  const handleLogin = () => {
    navigate('/login'); // Redirect to login with the original path
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05, backgroundColor: 'var(--cta-hover)', transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  return (
    <motion.div
      className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="bg-white/95 backdrop-blur-md p-8 rounded-lg shadow-lg w-full max-w-md text-center border border-gray-200"
        variants={cardVariants}
      >
        <h2 className="text-2xl font-bold text-[var(--text)] mb-4">Unauthorized Access</h2>
        <p className="text-[var(--text)] mb-6">
          You must be logged in to access this page.
        </p>
        <motion.button
          onClick={handleLogin}
          className="bg-[var(--cta)] text-white px-6 py-2 rounded-md font-medium hover:bg-[var(--cta-hover)] transition-colors duration-300"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          Login
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default UnauthorizedPage;