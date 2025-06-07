import { useState, useContext, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiPhone, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import { AuthContext } from '../Contexts/authContext';
import { AnimatePresence, motion } from 'framer-motion';
import { PhoneInput } from 'react-international-phone';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Phone } from 'lucide-react';
import 'react-international-phone/style.css';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';

const OtpInput = ({ length = 6, value, onChange }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const newValue = e.target.value;
    if (isNaN(newValue)) return;

    const digit = newValue.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    if (digit && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }

    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
      } else if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(clipboardData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < Math.min(clipboardData.length, length); i++) {
      newOtp[i] = clipboardData[i];
    }

    setOtp(newOtp);
    onChange(newOtp.join(''));
    const focusIndex = Math.min(clipboardData.length, length - 1);
    inputRefs.current[focusIndex].focus();
  };

  return (
    <div className="flex justify-center space-x-3">
      {Array.from({ length }).map((_, index) => (
        <motion.input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-bold border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.05 }}
        />
      ))}
    </div>
  );
};

const AnimatedButton = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  icon,
  className = "",
  type = "button"
}) => {
  const variants = {
    primary: `bg-blue-600 hover:bg-blue-700 text-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    secondary: `bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    success: `bg-green-600 hover:bg-green-700 text-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      type={type}
      className={`${variants[variant]} rounded-lg py-2 px-4 font-medium flex items-center justify-center transition-all shadow-md ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </motion.button>
  );
};

const InputField = ({
  id,
  label,
  register,
  errors,
  type = 'text',
  icon,
  rightIcon,
  rightIconAction,
  placeholder,
  validation = {},
  autoComplete = "off",
  disabled = false
}) => {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative rounded-md">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`${icon ? 'pl-10' : 'pl-3'} ${rightIcon ? 'pr-10' : 'pr-3'} block w-full py-2.5 border ${errors[id] ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
          placeholder={placeholder}
          {...register(id, validation)}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={rightIconAction}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {rightIcon}
            </button>
          </div>
        )}
      </div>
      {errors[id] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm mt-1 flex items-center"
        >
          <FiAlertCircle size={14} className="mr-1" />
          {errors[id].message}
        </motion.p>
      )}
    </div>
  );
};

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [verificationStep, setVerificationStep] = useState('send'); // 'send', 'verify', 'reset', 'success'
  const { user, checkAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [codeSent, setCodeSent] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    control,
    getValues,
    trigger
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
      phone: '',
      password: '',
      newPassword: '' // Add this
    }
  });

  useEffect(() => {
    if (user && user.role !== 'attendee') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  };

  const fadeInUpVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };
  // Add this function to check if user exists
  const checkUserExists = async (method) => {
    try {
      const endpoint = import.meta.env.VITE_API_BASE_URL+'/Authentication/check-user-exists';
      const payload = method === 'email'
        ? { email: getValues('email'), phone: '' }
        : { email: '', phone: getValues('phone') };
  
      const response = await axios.post(endpoint, payload);
      return response.data.exists;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  };
  const startCountdown = (seconds = 60) => {
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) clearInterval(timer);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  };

  // Update the sendVerificationCode function in Login.jsx
  const sendVerificationCode = async (method) => {
    if (codeSent && countdown > 0) {
      toast.info(`Please wait ${countdown} seconds before resending`);
      return;
    }
  
    try {
      setIsLoading(true);
      const userExists = await checkUserExists(method);
      if (!userExists) {
        toast.error(`No account found with this ${method}. Please sign up instead.`);
        return;
      }
  
      const endpoint = method === 'email'
        ? import.meta.env.VITE_API_BASE_URL+'/Authentication/send-email-verification'
        : import.meta.env.VITE_API_BASE_URL+'/Authentication/send-phone-verification';
  
      const payload = method === 'email'
        ? { email: getValues('email') }
        : { phone: getValues('phone') };
  
      await axios.post(endpoint, payload);
      toast.success(`Verification code sent to your ${method}`);
      setVerificationMethod(method);
      setVerificationStep('verify');
      startCountdown();
      setCodeSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to send ${method} verification`);
    } finally {
      setIsLoading(false);
    }
  };
  const resendVerificationCode = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      const endpoint = verificationMethod === 'email'
        ? import.meta.env.VITE_API_BASE_URL+'/Authentication/send-email-verification'
        : import.meta.env.VITE_API_BASE_URL+'/Authentication/send-phone-verification';

      const payload = verificationMethod === 'email'
        ? { email: getValues('email') }
        : { phone: getValues('phone') };

      await axios.post(endpoint, payload);
      setVerificationCode(''); // Clear existing OTP
      startCountdown();
      toast.success(`New verification code sent to your ${verificationMethod}`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to resend ${verificationMethod} verification`);
    } finally {
      setIsResending(false);
    }
  };
  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post(import.meta.env.VITE_API_BASE_URL+'/Authentication/verify-code', {
        identifier: verificationMethod === 'email' ? getValues('email') : getValues('phone'),
        code: verificationCode
      });

      toast.success('Verification successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const resetPassword = async () => {
    // Trigger validation
    const isValid = await trigger(['newPassword', 'confirmPassword']);
    if (!isValid) return;

    setIsLoading(true);
    try {
      const endpoint = verificationMethod === 'email'
        ? import.meta.env.VITE_API_BASE_URL+'/Authentication/reset-password-email'
        : import.meta.env.VITE_API_BASE_URL+'/Authentication/reset-password-phone';

      const payload = {
        identifier: verificationMethod === 'email' ? getValues('email') : getValues('phone'),
        newPassword: getValues('newPassword')
      };

      await axios.post(endpoint, payload);
      toast.success('Password reset successfully!');
      setVerificationStep('success');

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      let response;
      if (loginType === 'email') {
        response = await axios.post(
          import.meta.env.VITE_API_BASE_URL+'/Authentication/login/email',
          {
            email: data.email,
            password: data.password,
          },
          { withCredentials: true }
        );
      } else if (loginType === 'phone') {
        response = await axios.post(
          import.meta.env.VITE_API_BASE_URL+'/Authentication/login/phone',
          {
            phone: data.phone,
            password: data.password,
          },
          { withCredentials: true }
        );
      }
  
      await checkAuth();
      toast.success('Login successful! Redirecting...');
  
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });
  
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (loginType === 'email' && !getValues('email')) {
      toast.error("Please enter your email first");
      return;
    }
    if (loginType === 'phone' && !getValues('phone')) {
      toast.error("Please enter your phone number first");
      return;
    }
  
    setIsForgotPassword(true);
    await sendVerificationCode(loginType);
  };
  const handleBackFromVerification = () => {
    setVerificationStep('send');
    // Don't reset countdown or verification code
  };
  const handleVerifyAndReset = async () => {
    const isVerified = await verifyCode();
    if (isVerified) {
      setVerificationStep('reset'); // Move to password reset step
    }
  };
  // Add this component to both Login.jsx and Signup.jsx
  const PhoneInputField = ({ 
    control, 
    name, 
    errors, 
    label,
    validation = {} 
  }) => {
    return (
      <div className="space-y-1">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="relative rounded-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone size={18} className="text-gray-400" />
          </div>
          <Controller
            name={name}
            control={control}
            rules={validation}
            render={({ field }) => (
              <PhoneInput
                defaultCountry="pk"
                value={field.value}
                onChange={field.onChange}
                inputClassName={`pl-10 block w-full py-2.5 border ${
                  errors[name] ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                countrySelectorStyleProps={{
                  buttonClassName: 'pl-10 pr-2 h-full border-r border-gray-300',
                  dropdownClassName: 'z-10',
                }}
              />
            )}
          />
        </div>
        {errors[name] && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1 flex items-center"
          >
            <FiAlertCircle size={14} className="mr-1" />
            {errors[name].message}
          </motion.p>
        )}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Toaster position="top-center" richColors closeButton />

      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-16 h-16 mb-4">
              <motion.div
                className="w-full h-full border-4 border-blue-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="text-gray-700 font-medium">Processing...</p>
          </motion.div>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {isForgotPassword ? 'Reset Password' : 'Welcome back'}
          </h2>
          <div className="mt-3 text-center">
            <motion.div
              className="inline-flex items-center text-sm text-gray-500 font-medium"
              whileHover={{ scale: 1.05 }}
            >
              {isForgotPassword ? 'Follow the steps to reset your password' : 'Sign in to your account'}
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
        >
          <AnimatePresence mode="wait">
            {!isForgotPassword ? (
              <motion.div
                key="login-form"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <motion.div variants={fadeInUpVariants}>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Login Information</h3>
                    <p className="text-sm text-gray-500 mb-6">Choose your preferred login method</p>
                  </motion.div>

                  <div className="flex justify-center space-x-4">
                    <AnimatedButton
                      type="button"
                      onClick={() => setLoginType('email')}
                      variant={loginType === 'email' ? 'primary' : 'secondary'}
                      className="px-4 py-2 text-sm"
                    >
                      Email Login
                    </AnimatedButton>
                    <AnimatedButton
                      type="button"
                      onClick={() => setLoginType('phone')}
                      variant={loginType === 'phone' ? 'primary' : 'secondary'}
                      className="px-4 py-2 text-sm"
                    >
                      Phone Login
                    </AnimatedButton>
                  </div>

                  {loginType === 'email' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <InputField
      id="email"
      label="Email Address"
      register={register}
      errors={errors}
      type="email"
      icon={<FiMail size={18} className="text-gray-400" />}
      placeholder="your.email@example.com"
      validation={{
        required: "Email is required",
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: "Invalid email address"
        },
        validate: {
          exists: async (value) => {
            const exists = await checkUserExists('email', value);
            return exists || "No account found with this email. Please sign up.";
          }
        }
      }}
    />
                    </motion.div>
                  )}

                  {loginType === 'phone' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="space-y-1">
                                                <Controller
                          name="phone"
                          control={control}
                          render={({ field }) => (
                            <PhoneInputField 
      control={control}
      name="phone"
      errors={errors}
      label="Phone Number"
      validation={{
        required: "Phone number is required",
        validate: {
          validPhone: value => {
            const phoneNumber = parsePhoneNumberFromString(value);
            return phoneNumber?.isValid() || "Invalid phone number";
          },
          exists: async (value) => {
            const exists = await checkUserExists('phone', value);
            return exists || "No account found with this phone. Please sign up.";
          }
        }
      }}
    />
                          )}
                        />
                        {/* {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                        )} */}
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <InputField
                      id="password"
                      label="Password"
                      register={register}
                      errors={errors}
                      type={showPassword ? 'text' : 'password'}
                      icon={<FiLock size={18} className="text-gray-400" />}
                      rightIcon={showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      rightIconAction={() => setShowPassword(!showPassword)}
                      placeholder="Enter your password"
                      validation={{
                        required: "Password is required"
                      }}
                    />
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </motion.div>

                  <div className="pt-4">
                    <AnimatedButton
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                      icon={<FiArrowRight size={18} />}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </AnimatedButton>
                  </div>
                </form>

                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link
                      to="/signup"
                      className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-password"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                {verificationStep === 'send' && (
                  <>
                    <motion.div variants={fadeInUpVariants}>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Reset Password</h3>
                      <p className="text-sm text-gray-500 mb-6">
                        We'll send a verification code to your {loginType}
                      </p>
                    </motion.div>

                    <motion.div
                      className="flex justify-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <AnimatedButton
                        onClick={() => sendVerificationCode(loginType)}
                        disabled={isLoading}
                        className="w-full"
                      >
                        Send Verification Code
                      </AnimatedButton>
                    </motion.div>

                    <motion.div
                      className="flex justify-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <AnimatedButton
                        onClick={() => {
                          setIsForgotPassword(false);
                          setVerificationMethod(null);
                          setVerificationStep('send');
                        }}
                        variant="secondary"
                        className="w-full"
                        icon={<FiArrowLeft size={18} />}
                      >
                        Back to Login
                      </AnimatedButton>
                    </motion.div>
                  </>
                )}

{verificationStep === 'verify' && (
      <>
        <motion.div variants={fadeInUpVariants}>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Enter Verification Code</h3>
          <p className="text-sm text-gray-500 mb-6">
            We've sent a 6-digit code to your {verificationMethod === 'email'
              ? <span className="font-medium">{getValues('email')}</span>
              : <span className="font-medium">{getValues('phone')}</span>}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <OtpInput
            length={6}
            value={verificationCode}
            onChange={setVerificationCode}
          />
        </motion.div>

        <motion.div
          className="flex items-center justify-center text-sm text-gray-600 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {countdown > 0 ? (
  <div className="flex items-center">
    <FiClock size={16} className="mr-2 text-gray-500" />
    <span>Resend code in <span className="font-semibold">{countdown}s</span></span>
  </div>
) : (
  <button
    type="button"
    onClick={() => {
      resendVerificationCode();
      setCodeSent(false); // Reset the sent state
    }}
    disabled={isResending}
    className="text-blue-600 hover:text-blue-800 flex items-center focus:outline-none font-medium"
  >
    <FiRefreshCw size={16} className={`mr-2 ${isResending ? "animate-spin" : ""}`} />
    {isResending ? "Sending..." : "Resend code"}
  </button>
)}
        </motion.div>

        <div className="flex justify-between pt-4">
        <AnimatedButton
  onClick={handleBackFromVerification}
  variant="secondary"
  icon={<FiArrowLeft size={18} />}
>
  Back
</AnimatedButton>
          <AnimatedButton
            onClick={handleVerifyAndReset}
            disabled={!verificationCode || verificationCode.length !== 6 || isVerifying}
            className={isVerifying ? "animate-pulse" : ""}
            icon={<FiCheckCircle size={18} />}
          >
            {isVerifying ? "Verifying..." : "Verify Code"}
          </AnimatedButton>
        </div>
      </>
    )}

                {verificationStep === 'reset' && (
                  <>
                    <motion.div variants={fadeInUpVariants}>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Set New Password</h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Please enter a new password for your account
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <InputField
                        id="newPassword"
                        label="New Password"
                        register={register}
                        errors={errors}
                        type={showNewPassword ? 'text' : 'password'}
                        icon={<FiLock size={18} className="text-gray-400" />}
                        rightIcon={showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        rightIconAction={() => setShowNewPassword(!showNewPassword)}
                        placeholder="Enter your new password"
                        validation={{
                          required: "Password is required",
                          minLength: {
                            value: 8,
                            message: "Password must be at least 8 characters"
                          },
                          validate: {
                            hasNumber: value => /[0-9]/.test(value) || "Password must contain at least one number",
                            hasSpecialChar: value => /[!@#$%^&*(),.?":{}|<>]/.test(value) || "Password must contain at least one special character"
                          }
                        }}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <InputField
                        id="confirmPassword"
                        label="Confirm Password"
                        register={register}
                        errors={errors}
                        type={showNewPassword ? 'text' : 'password'}
                        icon={<FiLock size={18} className="text-gray-400" />}
                        placeholder="Confirm your new password"
                        validation={{
                          required: "Please confirm your password",
                          validate: value =>
                            value === watch('newPassword') || "Passwords do not match"
                        }}
                      />
                    </motion.div>

                    <div className="flex justify-between pt-4">
                      <AnimatedButton
                        onClick={() => setVerificationStep('verify')}
                        variant="secondary"
                        icon={<FiArrowLeft size={18} />}
                      >
                        Back
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={resetPassword}
                        disabled={isLoading || !watch('newPassword') || !watch('confirmPassword')}
                        variant="success"
                        icon={<FiCheckCircle size={18} />}
                      >
                        {isLoading ? "Resetting..." : "Reset Password"}
                      </AnimatedButton>
                    </div>
                  </>
                )}

                {verificationStep === 'success' && (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <FiCheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successful!</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Your password has been updated successfully. You can now login with your new password.
                    </p>
                    <AnimatedButton
                      onClick={() => {
                        setIsForgotPassword(false);
                        setVerificationMethod(null);
                        setVerificationStep('send');
                        setVerificationCode('');
                        setValue('newPassword', '');
                        setValue('confirmPassword', '');
                      }}
                      variant="success"
                      className="w-full"
                    >
                      Back to Login
                    </AnimatedButton>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;