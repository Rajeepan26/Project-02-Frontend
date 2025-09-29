"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import authService from '@/services/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  address?: string;
  agreeToTerms?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
  });

  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Password should be at least 8 characters long');
    } else {
      score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      feedback.push('Include at least one uppercase letter');
    } else {
      score += 1;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      feedback.push('Include at least one lowercase letter');
    } else {
      score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
      feedback.push('Include at least one number');
    } else {
      score += 1;
    }

    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Include at least one special character');
    } else {
      score += 1;
    }

    return { score, feedback };
  };

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    }
  }, [formData.password]);

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
      case 3:
        return 'bg-yellow-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak';
    }

    // Confirm Password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation
    const phoneRegex = /^\+?[\d]{10,13}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (10-13 digits only)';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
      };

      await authService.register(registerData);
      // Clear any existing auth data
      authService.logout();
      // Show success message
      setSuccess('Registration successful! Redirecting to login...');
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Check if it's a duplicate email error
        if (err.message.includes('User already exists') || err.message.includes('already exists')) {
          setError('An account with this email address already exists. Please try logging in instead.');
        } else if (err.message.includes('400') || err.message.includes('Bad Request')) {
          setError('Registration failed. Please check your information and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Special handling for phone number - only allow digits and + at the beginning
    if (name === 'phone') {
      // Remove any non-digit characters except + at the beginning
      let cleanValue = value.replace(/[^\d+]/g, '');
      // Ensure + is only at the beginning
      if (cleanValue.includes('+') && !cleanValue.startsWith('+')) {
        cleanValue = '+' + cleanValue.replace(/\+/g, '');
      }
      // Limit to 13 characters
      if (cleanValue.length > 13) {
        cleanValue = cleanValue.substring(0, 13);
      }
      setFormData(prev => ({
        ...prev,
        [name]: cleanValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  // const handleGoogleSignup = () => {
  //   try {
  //     setLoading(true);
  //     authService.googleSignup();
  //     // No need to handle response as we're redirecting
  //   } catch (err) {
  //     setError('Failed to initiate Google sign-up. Please try again.');
  //     setLoading(false);
  //   }
  // };

  // Check for OAuth callback
  useEffect(() => {
    // Check if there's a token in the URL (after OAuth callback)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      // Store the token
      sessionStorage.setItem('token', token);
      // Redirect to dashboard or appropriate page
      router.push('/dashboard');
    } else if (error) {
      setError(decodeURIComponent(error));
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-3">
        <div className="max-w-6xl mx-auto">
          {/* Registration Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="md:flex">
              {/* Left Side - Image and Info */}
              <div className="md:w-1/3 bg-gradient-to-b from-blue-600 to-blue-800 p-12 text-white hidden md:block relative">
                {/* Medical Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="medical-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M8 2h4v4h4v4h-4v4H8v-4H4V6h4V2z" fill="currentColor"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#medical-pattern)"/>
                  </svg>
                </div>

                {/* Medical Hero Image */}
                <div className="relative z-10 mb-8">
                  <svg className="w-24 h-24 mb-6" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32 4C16.536 4 4 16.536 4 32s12.536 28 28 28 28-12.536 28-28S47.464 4 32 4z" fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeWidth="2"/>
                    <path d="M32 20v24M20 32h24" stroke="#ffffff" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                </div>

                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-6">Welcome to SK Medicals</h2>
                  <p className="mb-8 text-blue-100">Join our community and get access to:</p>
                  
                  {/* Feature List with Medical Icons */}
                  <ul className="space-y-6">
                    {[
                      {
                        text: 'Online Consultations',
                        icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )
                      },
                      {
                        text: 'Medicine Delivery',
                        icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )
                      },
                      {
                        text: 'Health Records Management',
                        icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )
                      },
                      {
                        text: 'Expert Medical Advice',
                        icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )
                      }
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                          {feature.icon}
                        </div>
                        <span className="text-lg">{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Bottom Decorative Element */}
                  <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 opacity-10">
                    <svg className="w-48 h-48" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M100 0v200M0 100h200M70 30h60v60H70zM70 110h60v60H70z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right Side - Registration Form */}
              <div className="md:w-2/3 p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800">Create an Account</h3>
                  <p className="text-gray-600 mt-2">Fill in your details to get started</p>
                </div>


                {/* Error Message */}
                {error && (
                  <div className="mb-6">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                          {error.includes('already exists') && (
                            <p className="text-sm text-red-600 mt-1">
                              <Link href="/login" className="underline hover:text-red-800">
                                Click here to login instead
                              </Link>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="mb-6">
                    <div className="bg-green-50 border-l-4 border-green-500 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">{success}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={loading}
                          className={`block w-full pl-10 pr-3 py-2 rounded-lg border ${
                            errors.firstName ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                          } text-black`}
                          placeholder="John"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          disabled={loading}
                          className={`block w-full pl-10 pr-3 py-2 rounded-lg border ${
                            errors.lastName ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                          } text-black`}
                          placeholder="Doe"
                        />
                      </div>
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={loading}
                          maxLength={13}
                          className={`block w-full pl-10 pr-3 py-2 rounded-lg border ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                          } text-black`}
                          placeholder="+1234567890"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                        className={`block w-full pl-10 pr-3 py-2 rounded-lg border ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        } text-black`}
                        placeholder="john.doe@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={loading}
                          className={`block w-full pl-10 pr-3 py-2 rounded-lg border ${
                            errors.password ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                          } text-black`}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                      )}
                      
                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex space-x-1 mb-2">
                            {[1, 2, 3, 4, 5].map((index) => (
                              <div
                                key={index}
                                className={`h-2 w-full rounded-full ${
                                  index <= passwordStrength.score
                                    ? getStrengthColor(passwordStrength.score)
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          {passwordStrength.feedback.length > 0 && (
                            <ul className="text-xs text-gray-600 space-y-1">
                              {passwordStrength.feedback.map((feedback, index) => (
                                <li key={index} className="flex items-center space-x-1">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{feedback}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={loading}
                          className={`block w-full pl-10 pr-3 py-2 rounded-lg border ${
                            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                          } text-black`}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Address Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={loading}
                        rows={3}
                        className={`block w-full pl-10 pr-3 py-2 rounded-lg border ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        } text-black`}
                        placeholder="Enter your full address"
                      />
                    </div>
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                        disabled={loading}
                        className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                    <div className="text-sm">
                      <label className="font-medium text-gray-700">
                        I agree to the{' '}
                        <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                          Terms and Conditions
                        </Link>
                      </label>
                      {errors.agreeToTerms && (
                        <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button - Updated with blue gradient */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loading ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating your account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>

                  {/* Login Link */}
                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
                      Sign in
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 