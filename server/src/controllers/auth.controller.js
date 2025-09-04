const User = require('../models/user.model');
const Portfolio = require('../models/portfolio.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, verificationCode, firstName) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@tradingplatform.com',
    to: email,
    subject: 'Verify Your Trading Platform Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Trading Platform</h1>
          <p style="color: white; margin: 10px 0 0 0;">Your Gateway to Smart Trading</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome ${firstName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for registering with our trading platform. To complete your registration 
            and start trading, please verify your email address using the code below:
          </p>
          
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">Verification Code</h3>
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: monospace;">
              ${verificationCode}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 25px;">
            <strong>Important:</strong> This code will expire in 15 minutes for security reasons.
            If you didn't create this account, please ignore this email.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <h4 style="color: #333; margin-bottom: 15px;">What's Next?</h4>
            <ul style="color: #666; padding-left: 20px;">
              <li>Enter the verification code on the registration page</li>
              <li>Complete your profile setup</li>
              <li>Connect your trading account</li>
              <li>Start trading with real-time market data</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #667eea; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 14px;">
            © 2024 Trading Platform. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Register new user
const registerUser = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { firstName, lastName, email, phone, dateOfBirth, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Check phone number
  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    throw new ApiError(409, 'User with this phone number already exists');
  }

  // Generate verification code
  const verificationCode = generateVerificationCode();
  const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth: new Date(dateOfBirth),
    password,
    verifyCode: verificationCode,
    verifyCodeExpiration: verificationExpiry,
    isEmailVerified: false
  });

  // Create default portfolio
  await Portfolio.createDefaultPortfolio(user._id);

  // Send verification email
  try {
    await sendVerificationEmail(email, verificationCode, firstName);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Don't fail registration if email fails
  }

  // Generate auth token
  const token = user.generateAuthToken();

  // Remove sensitive data from response
  const userResponse = user.toJSON();

  res.status(201).json(
    new ApiResponse(201, {
      user: userResponse,
      token,
      message: 'Registration successful. Please check your email for verification code.'
    }, 'User registered successfully')
  );
});

// Verify email with code
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    throw new ApiError(400, 'Email and verification code are required');
  }

  // Find user with verification code
  const user = await User.findOne({
    email: email.toLowerCase(),
    verifyCode: verificationCode,
    verifyCodeExpiration: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification code');
  }

  // Update user verification status
  user.isEmailVerified = true;
  user.verifyCode = undefined;
  user.verifyCodeExpiration = undefined;
  await user.save();

  const userResponse = user.toJSON();

  res.status(200).json(
    new ApiResponse(200, {
      user: userResponse,
      message: 'Email verified successfully'
    }, 'Email verification successful')
  );
});

// Resend verification code
const resendVerificationCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findByEmail(email);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email is already verified');
  }

  // Generate new verification code
  const verificationCode = generateVerificationCode();
  const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

  user.verifyCode = verificationCode;
  user.verifyCodeExpiration = verificationExpiry;
  await user.save();

  // Send verification email
  try {
    await sendVerificationEmail(email, verificationCode, user.firstName);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    throw new ApiError(500, 'Failed to send verification email');
  }

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Verification code sent successfully'
    }, 'Verification code resent')
  );
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { email, password } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Check if account is locked
  if (user.isLocked) {
    throw new ApiError(423, 'Account temporarily locked due to too many failed login attempts');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(403, 'Account has been deactivated');
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    // Increment login attempts
    await user.incLoginAttempts();
    throw new ApiError(401, 'Invalid credentials');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login info
  await user.updateLastLogin(clientIP, userAgent);

  // Generate tokens
  const authToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Get user's portfolio
  const portfolio = await Portfolio.findByUserId(user._id);

  const userResponse = user.toJSON();

  res.status(200).json(
    new ApiResponse(200, {
      user: userResponse,
      authToken,
      refreshToken,
      portfolio,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }, 'Login successful')
  );
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  // For now, we'll just send a success response
  res.status(200).json(
    new ApiResponse(200, {
      message: 'Logged out successfully'
    }, 'Logout successful')
  );
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new ApiError(401, 'Invalid token type');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Generate new auth token
    const newAuthToken = user.generateAuthToken();

    res.status(200).json(
      new ApiResponse(200, {
        authToken: newAuthToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }, 'Token refreshed successfully')
    );
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }
});

// Get current user profile
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const portfolio = await Portfolio.findByUserId(req.user.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const userResponse = user.toJSON();

  res.status(200).json(
    new ApiResponse(200, {
      user: userResponse,
      portfolio
    }, 'User profile retrieved successfully')
  );
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const allowedUpdates = [
    'firstName', 'lastName', 'phone', 'dateOfBirth', 'address',
    'annualIncome', 'tradingExperience', 'riskTolerance', 'preferences'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const userResponse = user.toJSON();

  res.status(200).json(
    new ApiResponse(200, {
      user: userResponse
    }, 'Profile updated successfully')
  );
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Password changed successfully'
    }, 'Password updated')
  );
});

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal whether user exists or not
    res.status(200).json(
      new ApiResponse(200, {
        message: 'If an account with this email exists, a password reset link has been sent'
      }, 'Password reset initiated')
    );
    return;
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Send reset email (implement email sending)
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@tradingplatform.com',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset for your trading account. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (emailError) {
    console.error('Failed to send reset email:', emailError);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    throw new ApiError(500, 'Failed to send password reset email');
  }

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Password reset link sent to your email'
    }, 'Password reset initiated')
  );
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ApiError(400, 'Reset token and new password are required');
  }

  const user = await User.findByPasswordResetToken(token);
  
  if (!user || user.passwordResetExpires < Date.now()) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Password reset successful'
    }, 'Password reset completed')
  );
});

module.exports = {
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
};
