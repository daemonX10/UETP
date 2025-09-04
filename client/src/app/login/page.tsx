'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormValidation } from '@/hooks/useFormValidation';
import { getEmailValidationRules, getPasswordValidationRules } from '@/lib/validation';
import { authService, type LoginCredentials } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
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
  } = useFormValidation<LoginFormData>(
    {
      email: '',
      password: '',
    },
    {
      email: getEmailValidationRules(),
      password: getPasswordValidationRules(),
    }
  );

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await authService.googleLogin();
      
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Login Successful',
          message: 'Welcome to UETP!'
        });
        router.push('/dashboard');
      } else {
        addToast({
          type: 'error',
          title: 'Login Failed',
          message: response.message
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Login Error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
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
      const credentials: LoginCredentials = {
        email: values.email,
        password: values.password,
      };
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome back, ${response.user?.name}!`
        });
        router.push('/dashboard');
      } else {
        addToast({
          type: 'error',
          title: 'Login Failed',
          message: response.message
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Login Error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue(field, e.target.value);
  };

  const handleInputBlur = (field: keyof LoginFormData) => () => {
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
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Unified Equity Trading Platform
                </h1>
                <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                  Experience next-generation trading with advanced analytics, real-time data, and institutional-grade security.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center mt-8">
                <div className="p-3">
                  <div className="text-2xl font-bold text-blue-400">99.9%</div>
                  <div className="text-sm text-gray-400">Uptime</div>
                </div>
                <div className="p-3">
                  <div className="text-2xl font-bold text-green-400">50K+</div>
                  <div className="text-sm text-gray-400">Active Users</div>
                </div>
                <div className="p-3">
                  <div className="text-2xl font-bold text-purple-400">24/7</div>
                  <div className="text-sm text-gray-400">Support</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-400">
                  Sign in to access your trading dashboard
                </p>
              </div>

              <div className="transition-all duration-300 ease-in-out">
                {!showEmailLogin ? (
                  <div className="space-y-4">
                    {/* Google Login */}
                    <Button
                      onClick={handleGoogleLogin}
                      loading={isLoading}
                      loadingText="Connecting..."
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
                      Continue with Google
                    </Button>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                      <hr className="flex-grow border-gray-600" />
                      <span className="px-4 text-gray-500 text-sm">OR</span>
                      <hr className="flex-grow border-gray-600" />
                    </div>

                    {/* Switch to Email Login */}
                    <Button
                      onClick={() => setShowEmailLogin(true)}
                      variant="outline"
                      size="lg"
                      className="w-full border-gray-600 hover:bg-gray-700"
                      disabled={isLoading}
                    >
                      Use Email and Password
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleEmailLoginSubmit} className="space-y-6">
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
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />

                    {/* Password Input */}
                    <Input
                      type="password"
                      label="Password"
                      placeholder="Enter your password"
                      value={values.password}
                      onChange={handleInputChange('password')}
                      onBlur={handleInputBlur('password')}
                      error={touched.password ? errors.password : undefined}
                      required
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />

                    {/* Demo Credentials Info */}
                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                      <p className="text-sm text-blue-300 mb-1">Demo Credentials:</p>
                      <p className="text-xs text-blue-200">Email: demo@uetp.com</p>
                      <p className="text-xs text-blue-200">Password: demo123</p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      loading={isLoading}
                      loadingText="Signing In..."
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      disabled={isLoading}
                    >
                      Sign In
                    </Button>

                    {/* Back to Google Login */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowEmailLogin(false)}
                        disabled={isLoading}
                        className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        ← Back to Google login
                      </button>
                    </div>
                  </form>
                )}
                
                {/* Registration Link */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <p className="text-center text-sm text-gray-400">
                    Don't have an account?{' '}
                    <Link 
                      href="/register" 
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Create Account
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