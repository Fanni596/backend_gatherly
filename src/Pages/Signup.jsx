import { useState, useEffect, useRef } from 'react';
import { useForm, Controller, set } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PhoneInput } from 'react-international-phone';
import axios from 'axios';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import 'react-international-phone/style.css';
import { Toaster, toast } from 'sonner';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight,
  ArrowLeft, Check, Clock, Sparkles, RefreshCw,
  ChevronRight, ChevronLeft, CheckCircle, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
// import { get } from 'http';
const ProgressSteps = ({ currentStep, totalSteps }) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between px-2">
        {[...Array(totalSteps)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${i < currentStep - 1
                ? 'bg-green-500 text-white'
                : i === currentStep - 1
                  ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                  : 'bg-gray-200 text-gray-400'
                }`}
              whileHover={{ scale: 1.1 }}
            >
              {i < currentStep - 1 ? (
                <CheckCircle size={16} />
              ) : (
                <span>{i + 1}</span>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
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
// Add this component to both Login.jsx and Signup.jsx
const PhoneInputField = ({
  control,
  name,
  errors,
  label,
  validation = {},
  onBlur
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
              onChange={(phone) => {
                field.onChange(phone);
                if (!phone) {
                  onBlur?.();
                }
              }}
              onBlur={(e) => {
                field.onBlur();
                onBlur?.(e);
              }}
              inputClassName={`pl-10 block w-full py-2.5 border ${errors?.[name] ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              countrySelectorStyleProps={{
                buttonClassName: 'pl-10 pr-2 h-full border-r border-gray-300',
                dropdownClassName: 'z-10',
              }}
            />
          )}
        />
      </div>
      {errors?.[name] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm mt-1 flex items-center"
        >
          <AlertCircle size={14} className="mr-1" />
          {errors[name].message}
        </motion.p>
      )}
    </div>
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
          <AlertCircle size={14} className="mr-1" />
          {errors[id].message}
        </motion.p>
      )}
    </div>
  );
};
const validateEmailOrPhone = async (value, fieldName) => {
  const exists = await checkUserExists(fieldName, value);
  if (exists) {
    return `User with this ${fieldName} already exists. Please sign in instead.`;
  }
  return true;
};
// Add this function to check if user exists
const checkUserExists = async (method, value) => {
  try {
    const endpoint = import.meta.env.VITE_API_BASE_URL+'/Authentication/check-user-exists';
    const payload = method === 'email'
      ? { email: value, phone: '' }
      : { email: '', phone: value };

    const response = await axios.post(endpoint, payload);
    return response.data.exists;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};
const OtpInput = ({ length = 6, onChange }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const newValue = e.target.value;
    if (isNaN(newValue) || newValue === ' ') return;

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

    let focusIndex = Math.min(clipboardData.length, length - 1);
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

const PasswordStrengthMeter = ({ password }) => {
  const calculateStrength = (password) => {
    if (!password) return 0;

    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    return Math.min(4, Math.floor(strength / 1.5));
  };

  const strength = calculateStrength(password);

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['#f87171', '#fbbf24', '#a3e635', '#34d399', '#60a5fa'];

  return (
    <div className="mt-1 space-y-2">
      <div className="flex h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="h-full transition-all duration-500"
            style={{
              backgroundColor: i < strength ? strengthColors[strength] : 'transparent',
              width: '20%'
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: i < strength ? 1 : 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          />
        ))}
      </div>
      {password && (
        <div className="flex justify-between text-xs">
          <span
            className="font-medium"
            style={{ color: strength > 0 ? strengthColors[strength] : '#9ca3af' }}
          >
            {password ? strengthLabels[strength] : 'Enter a password'}
          </span>
        </div>
      )}
    </div>
  );
};

const PasswordRequirements = ({ password }) => {
  const requirements = [
    { label: 'At least 8 characters', met: password?.length >= 8 },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter', met: /[a-z]/.test(password) },
    { label: 'At least one number', met: /\d/.test(password) },
    { label: 'At least one special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-1">
      {requirements.map((req, index) => (
        <motion.div
          key={index}
          className="flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <motion.div
            animate={{
              color: req.met ? '#10b981' : '#9ca3af',
              scale: req.met ? [1, 1.2, 1] : 1
            }}
            transition={{ duration: 0.3 }}
          >
            {req.met ? <CheckCircle size={16} className="text-green-500" /> : <Check size={16} className="text-gray-400" />}
          </motion.div>
          <span className={`ml-2 text-xs ${req.met ? 'text-green-500' : 'text-gray-500'}`}>
            {req.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};


const SignupPage = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();
  const totalSteps = 5;
  const [isVerified, setIsVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }, // Ensure errors is destructured here
    trigger,
    getValues,
    control,
    setError,
    clearErrors
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    }
  });

  const password = watch('password', '');
  const confirmPassword = watch('confirmPassword', '');

  const isStepValid = async (stepToValidate) => {
    const fieldsToValidate = getFieldsToValidate(stepToValidate);
    return await trigger(fieldsToValidate);
  };

  const getFieldsToValidate = (currentStep) => {
    switch (currentStep) {
      case 1:
        return ['firstName', 'lastName'];
      case 2:
        return ['email', 'phone'];
      case 3:
        return [];
      case 4:
        return [];
      case 5:
        return ['password', 'confirmPassword'];
      default:
        return [];
    }
  };

  const handleNextStep = async () => {
    // console.log(getValues('email'));
    // console.log(isVerified, step);
    // console.log(verifiedCredentials.Credential, verifiedCredentials.method);
    // console.log(getValues(verifiedCredentials.method));

    // console.log(step === 2 && isVerified && (getValues(verifiedCredentials.method) === verifiedCredentials.Credential));
    // console.log(step === 2 && isVerified && (getValues(verifiedCredentials.method) !== verifiedCredentials.Credential));

    if (step === 2 && isVerified && (getValues(verifiedCredentials.method) === verifiedCredentials.Credential)) {
      // console.log('sad')
      setStep(5);
    }

    else if (step === 2 && isVerified && (getValues(verifiedCredentials.method) !== verifiedCredentials.Credential)) {
      setIsVerified(false);
      setStep(3);
    }

    else {

      const isValid = await isStepValid(step);
      if (isValid) {
        const values = getValues();
        setFormData({ ...formData, ...values });

        setStep(step + 1);

        if (step === totalSteps - 1) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 500);
        }
      } else {
        toast.error("Please fix the errors before continuing");
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 5 && isVerified) {
      setStep(2); // Go back to verification method selection if already verified
    }
    else {

      setStep(step - 1);
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

  // Update the sendVerificationCode function
  const sendVerificationCode = async (method) => {
    if (codeSent && countdown > 0) {
      toast.info(`Please wait ${countdown} seconds before resending`);
      return;
    }

    try {
      setIsLoading(true);

      // First trigger validation
      const isValid = await trigger(method);
      if (!isValid) {
        toast.error(`Please fix the ${method} errors before verifying`);
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
      setCodeSent(true);
      startCountdown();
      setStep(4); // Go directly to OTP verification step
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to send ${method} verification`);
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    if (countdown > 0) {
      toast.info(`Please wait ${countdown} seconds before resending`);
      return;
    }
  
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
      setCodeSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to resend ${verificationMethod} verification`);
    } finally {
      setIsResending(false);
    }
  };

  const [verifiedCredentials, setverifiedCredentials] = useState({
    Credential: null,
    method: null
  });

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
      setverifiedCredentials({ Credential: verificationMethod === 'email' ? getValues('email') : getValues('phone'), method: verificationMethod });
      // console.log(verifiedCredentials);
      setStep(5); // Directly move to password step after verification
      setIsVerified(true); // Mark as verified
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data) => {
    if (step !== totalSteps) {
      handleNextStep();
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        passwordHash: data.password,
      };
      
      console.log('signup', userData);
      await axios.post(import.meta.env.VITE_API_BASE_URL+'/Authentication/signup', userData);
      toast.success('Account created successfully!');

      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });
      setTimeout(async () => {
        await axios.post(
          import.meta.env.VITE_API_BASE_URL+'/Authentication/login/phone',
          {
            phone: userData.phone,
            password: userData.passwordHash,
          },
          { withCredentials: true }
        );
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

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
            Create your account
          </h2>
          <div className="mt-3 text-center">
            <motion.div
              className="inline-flex items-center text-sm text-gray-500 font-medium"
              whileHover={{ scale: 1.05 }}
            >
              Step {step} of {totalSteps}
              <Sparkles className="ml-2 text-blue-500" size={16} />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ProgressSteps currentStep={step} totalSteps={totalSteps} />
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <motion.div
                  key="personal-info"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <motion.div variants={fadeInUpVariants}>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                    <p className="text-sm text-gray-500 mb-6">Let's start with your name</p>
                  </motion.div>

                  <InputField
                    id="firstName"
                    label="First Name"
                    register={register}
                    errors={errors}
                    icon={<User size={18} className="text-gray-400" />}
                    placeholder="John"
                    validation={{
                      required: "First name is required",
                      minLength: {
                        value: 2,
                        message: "First name must be at least 2 characters"
                      }
                    }}
                  />

                  <InputField
                    id="lastName"
                    label="Last Name"
                    register={register}
                    errors={errors}
                    icon={<User size={18} className="text-gray-400" />}
                    placeholder="Doe"
                    validation={{
                      required: "Last name is required",
                      minLength: {
                        value: 2,
                        message: "Last name must be at least 2 characters"
                      }
                    }}
                  />

                  <div className="flex justify-end pt-4">
                    <AnimatedButton
                      onClick={handleNextStep}
                      icon={<ArrowRight size={18} />}
                      className="px-6"
                    >
                      Continue
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Contact Info */}
              {step === 2 && (
                <motion.div
                  key="contact-info"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <motion.div variants={fadeInUpVariants}>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <p className="text-sm text-gray-500 mb-6">How can we reach you?</p>
                  </motion.div>

                  <InputField
                    id="email"
                    label="Email Address"
                    register={register}
                    errors={errors}
                    type="email"
                    icon={<Mail size={18} className="text-gray-400" />}
                    placeholder="john.doe@example.com"
                    validation={{
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      },
                      validate: {
                        unique: async (value) => await validateEmailOrPhone(value, 'email')
                      }
                    }}
                    onBlur={async (e) => {
                      if (e.target.value) {
                        await trigger('email');
                      }
                    }}
                  />

                  <div className="space-y-1 display-flex-flex-row">

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
                              unique: async (value) => await validateEmailOrPhone(value, 'phone'),
                              validPhone: value => {
                                const phoneNumber = parsePhoneNumberFromString(value);
                                return phoneNumber?.isValid() || "Invalid phone number";
                              }
                            }
                          }}
                          onBlur={async (e) => {
                            if (getValues('phone')) {
                              await trigger('phone');
                            }
                          }}
                        />

                      )}
                    />

                    {/* {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )} */}
                  </div>

                  <motion.div
                    className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg flex items-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <AlertCircle size={18} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p>You'll need to verify at least one contact method (email or phone) in the next step.</p>
                  </motion.div>

                  <div className="flex justify-between pt-4">
                    <AnimatedButton
                      onClick={handlePrevStep}
                      variant="secondary"
                      icon={<ArrowLeft size={18} />}
                    >
                      Back
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={handleNextStep}
                      disabled={!getValues('email') && !getValues('phone')}
                      icon={<ArrowRight size={18} />}
                    >
                      Continue
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Verification Method Selection */}
              {step === 3 && (
                <motion.div
                  key="verification-code"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <motion.div variants={fadeInUpVariants}>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Verify Your Account</h3>
                    <p className="text-sm text-gray-500 mb-6">Choose your preferred verification method</p>
                  </motion.div>

                  <div className="space-y-4">
                    {getValues('email') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <button
                          type="button"
                          onClick={() => sendVerificationCode('email')}
                          disabled={isLoading || (codeSent && verificationMethod === 'email' && countdown > 0)}
                          className="relative w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full p-3 mr-4">
                              <Mail size={20} className="text-blue-500" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Verify with Email</p>
                              <p className="text-sm text-gray-500">{getValues('email')}</p>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-gray-400" />
                        </button>
                      </motion.div>
                    )}

                    {getValues('phone') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <button
                          type="button"
                          onClick={() => sendVerificationCode('phone')}
                          disabled={isLoading || (codeSent && verificationMethod === 'phone' && countdown > 0)}
                          className="relative w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <div className="flex items-center">
                            <div className="bg-green-100 rounded-full p-3 mr-4">
                              <Phone size={20} className="text-green-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Verify with Phone</p>
                              <p className="text-sm text-gray-500">{getValues('phone')}</p>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-gray-400" />
                        </button>
                      </motion.div>
                    )}
                  </div>

                  <motion.div
                    className="text-sm bg-amber-50 p-3 rounded-lg flex items-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <AlertCircle size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p>For your security, we'll send a one-time verification code to verify your identity.</p>
                  </motion.div>
                  {codeSent && countdown > 0 && (
                    <motion.div
                      className="text-sm text-blue-600 mt-2 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Verification code already sent. You can request a new one in {countdown} seconds.
                    </motion.div>
                  )}
                  <div className="flex justify-start pt-4">
                    <AnimatedButton
                      onClick={handlePrevStep}
                      variant="secondary"
                      icon={<ArrowLeft size={18} />}
                    >
                      Back
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}
              {/* Step 4: Verification Code Input */}
              {step === 4 && (
                <motion.div
                  key="verification-code"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
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
                        <Clock size={16} className="mr-2 text-gray-500" />
                        <span>Resend code in <span className="font-semibold">{countdown}s</span></span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={resendVerificationCode}
                        disabled={isResending}
                        className="text-blue-600 hover:text-blue-800 flex items-center focus:outline-none font-medium"
                      >
                        <RefreshCw size={16} className={`mr-2 ${isResending ? "animate-spin" : ""}`} />
                        {isResending ? "Sending..." : "Resend code"}
                      </button>
                    )}
                  </motion.div>

                  <motion.div
                    className="bg-blue-50 p-3 rounded-lg flex items-start text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <AlertCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p>
                      Didn't receive the code? Check your {verificationMethod === 'email' ? 'spam folder' : 'messages'} or try resending after the countdown completes.
                    </p>
                  </motion.div>

                  <div className="flex justify-between pt-4">
                    <AnimatedButton
                      onClick={() => {
                        setVerificationMethod(null);
                        handlePrevStep();
                      }}
                      variant="secondary"
                      icon={<ArrowLeft size={18} />}
                    >
                      Back
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={verifyCode}
                      disabled={verificationCode.length !== 6 || isVerifying}
                      className={isVerifying ? "animate-pulse" : ""}
                      icon={<Check size={18} />}
                    >
                      {isVerifying ? "Verifying..." : "Verify Code"}
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Password Setup */}
              {step === 5 && (
                <motion.div
                  key="password-setup"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <motion.div variants={fadeInUpVariants}>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Create Password</h3>
                    <p className="text-sm text-gray-500 mb-6">Create a strong password to secure your account</p>
                  </motion.div>

                  <div className="space-y-4">
                    <InputField
                      id="password"
                      label="Password"
                      register={register}
                      errors={errors}
                      type={showPassword ? 'text' : 'password'}
                      icon={<Lock size={18} className="text-gray-400" />}
                      rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      rightIconAction={() => setShowPassword(!showPassword)}
                      placeholder="Create your password"
                      validation={{
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters"
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                          message: "Password must include uppercase, lowercase, number and special character"
                        }
                      }}
                    />

                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ delay: 0.3 }}
                    >
                      <PasswordStrengthMeter password={password} />
                      <PasswordRequirements password={password} />
                    </motion.div>

                    <InputField
                      id="confirmPassword"
                      label="Confirm Password"
                      register={register}
                      errors={errors}
                      type={showConfirmPassword ? 'text' : 'password'}
                      icon={<Lock size={18} className="text-gray-400" />}
                      rightIcon={showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      rightIconAction={() => setShowConfirmPassword(!showConfirmPassword)}
                      placeholder="Confirm your password"
                      validation={{
                        required: "Please confirm your password",
                        validate: value => value === password || "Passwords do not match"
                      }}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <AnimatedButton
                      onClick={handlePrevStep}
                      variant="secondary"
                      icon={<ArrowLeft size={18} />}
                    >
                      Back
                    </AnimatedButton>
                    <AnimatedButton
                      type="submit"
                      disabled={!isValid || isLoading}
                      variant="success"
                      className="px-6 py-2.5"
                      icon={<CheckCircle size={18} />}
                    >
                      Complete Signup
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;