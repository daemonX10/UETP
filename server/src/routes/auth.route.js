const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Import controllers
const {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  logoutUser,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/auth.controller');

// Import middleware
const auth = require('../middlewares/auth');
const {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  resendCodeValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  refreshTokenValidation,
  handleValidationErrors
} = require('../middlewares/validation');

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth routes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const verificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit verification attempts
  message: {
    success: false,
    message: 'Too many verification attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit password reset requests
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public Routes (No authentication required)

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', 
  authLimiter,
  registerValidation,
  handleValidationErrors,
  registerUser
);

// @route   POST /api/auth/verify-email
// @desc    Verify user email with verification code
// @access  Public
router.post('/verify-email',
  verificationLimiter,
  verifyEmailValidation,
  handleValidationErrors,
  verifyEmail
);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification code
// @access  Public
router.post('/resend-verification',
  verificationLimiter,
  resendCodeValidation,
  handleValidationErrors,
  resendVerificationCode
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  authLimiter,
  loginValidation,
  handleValidationErrors,
  loginUser
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh authentication token
// @access  Public
router.post('/refresh-token',
  refreshTokenValidation,
  handleValidationErrors,
  refreshToken
);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidation,
  handleValidationErrors,
  forgotPassword
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password',
  passwordResetLimiter,
  resetPasswordValidation,
  handleValidationErrors,
  resetPassword
);

// Protected Routes (Authentication required)

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, logoutUser);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, getCurrentUser);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
  auth,
  updateProfileValidation,
  handleValidationErrors,
  updateProfile
);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password',
  auth,
  changePasswordValidation,
  handleValidationErrors,
  changePassword
);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
