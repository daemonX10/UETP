'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormValidation } from '@/hooks/useFormValidation';
import { getEmailValidationRules, getPasswordValidationRules, getNameValidationRules, validationRules } from '@/lib/validation';
import { authService, type RegisterCredentials } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [showEmailRegister, setShowEmailRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  // Check if user is already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAllFields,
    reset,
  } = useFormValidation<RegisterFormData>(
    {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    {
      name: getNameValidationRules(),
      email: getEmailValidationRules(),
      password: getPasswordValidationRules(true), // Registration requires stronger password
      confirmPassword: [validationRules.confirmPassword('')], // Will be updated dynamically
    }
  );

  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true);
      const response = await authService.googleLogin(); // Same as login for Google OAuth
      
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Registration Successful',
          message: 'Welcome to UETP!'
        });
        router.push('/dashboard');
      } else {
        addToast({
          type: 'error',
          title: 'Registration Failed',
          message: response.message
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAllFields()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors in the form.'
      });
      return;
    }

    try {
      setIsLoading(true);
      const credentials: RegisterCredentials = {
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      };
      
      const response = await authService.register(credentials);
      
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Registration Successful',
          message: `Welcome to UETP, ${response.user?.name}!`
        });
        router.push('/dashboard');
      } else {
        addToast({
          type: 'error',
          title: 'Registration Failed',
          message: response.message
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue(field, e.target.value);
  };

  const handleInputBlur = (field: keyof RegisterFormData) => () => {
    setFieldTouched(field);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="w-full max-w-4xl bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="flex flex-col lg:flex-row">
          {/* Left Section - Branding */}
          <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-gray-900/90 to-gray-800/90 p-12 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 opacity-20"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="mb-8">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Join UETP Today
                </h1>
                <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                  Start your trading journey with advanced tools, real-time analytics, and expert support.
                </p>
              </div>
              
              <div className="space-y-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Real-time market data</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Advanced trading tools</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">Portfolio management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-300">24/7 customer support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Registration Form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  Create Account
                </h2>
                <p className="text-gray-400">
                  Join thousands of traders on UETP
                </p>
              </div>

              <div className="transition-all duration-300 ease-in-out">
                {!showEmailRegister ? (
                  <div className="space-y-4">
                    {/* Google Register */}
                    <Button
                      onClick={handleGoogleRegister}
                      loading={isLoading}
                      loadingText="Creating Account..."
                      variant="google"
                      size="lg"
                      className="w-full"
                      disabled={isLoading}
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png"
                        alt="Google Logo"
                        className="w-5 h-5 mr-2"
                      />
                      Sign up with Google
                    </Button>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                      <hr className="flex-grow border-gray-600" />
                      <span className="px-4 text-gray-500 text-sm">OR</span>
                      <hr className="flex-grow border-gray-600" />
                    </div>

                    {/* Switch to Email Register */}
                    <Button
                      onClick={() => setShowEmailRegister(true)}
                      variant="outline"
                      size="lg"
                      className="w-full border-gray-600 hover:bg-gray-700"
                      disabled={isLoading}
                    >
                      Sign up with Email
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleEmailRegisterSubmit} className="space-y-6">
                    {/* Name Input */}
                    <Input
                      type="text"
                      label="Full Name"
                      placeholder="Enter your full name"
                      value={values.name}
                      onChange={handleInputChange('name')}
                      onBlur={handleInputBlur('name')}
                      error={touched.name ? errors.name : undefined}
                      required
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                    />

                    {/* Email Input */}
                    <Input
                      type="email"
                      label="Email Address"
                      placeholder="Enter your email"
                      value={values.email}
                      onChange={handleInputChange('email')}
                      onBlur={handleInputBlur('email')}
                      error={touched.email ? errors.email : undefined}
                      required
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                    />

                    {/* Password Input */}
                    <Input
                      type="password"
                      label="Password"
                      placeholder="Create a strong password"
                      value={values.password}
                      onChange={handleInputChange('password')}
                      onBlur={handleInputBlur('password')}
                      error={touched.password ? errors.password : undefined}
                      required
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                    />

                    {/* Confirm Password Input */}
                    <Input
                      type="password"
                      label="Confirm Password"
                      placeholder="Confirm your password"
                      value={values.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      onBlur={handleInputBlur('confirmPassword')}
                      error={touched.confirmPassword ? errors.confirmPassword : undefined}
                      required
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                    />

                    {/* Terms and Conditions */}
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-green-500"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-300">
                        I agree to the{' '}
                        <Link href="/terms" className="text-green-400 hover:text-green-300">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-green-400 hover:text-green-300">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      loading={isLoading}
                      loadingText="Creating Account..."
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                      disabled={isLoading}
                    >
                      Create Account
                    </Button>

                    {/* Back to Google Register */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowEmailRegister(false)}
                        disabled={isLoading}
                        className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        ← Back to Google registration
                      </button>
                    </div>
                  </form>
                )}
                
                {/* Login Link */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <p className="text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link 
                      href="/login" 
                      className="text-green-400 hover:text-green-300 font-medium transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}