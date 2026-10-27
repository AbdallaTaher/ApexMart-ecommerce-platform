const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

/**
 * Signs a cryptographic JWT payload with user ID
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Issues signed JWT token, writes secure HttpOnly cookie, and sanitizes user payload
 */
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  // Cookie expiration calculations (defaults to 7 days)
  const cookieExpiresInDays = parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 7;
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpiresInDays * 24 * 60 * 60 * 1000),
    httpOnly: true, // Prevents XSS client script access
    sameSite: 'lax', // Protects against cross-site request forgery
    secure:
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      process.env.NODE_ENV === 'production',
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from sensitive JSON response
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

/**
 * Public User Registration
 * Enforces role restriction (admin tier cannot be publicly self-assigned)
 */
exports.signup = catchAsync(async (req, res, next) => {
  // Prevent unauthorized privilege escalation during signup
  const role = req.body.role === 'seller' ? 'seller' : 'user';

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role,
  });

  createSendToken(newUser, 201, req, res);
});

/**
 * User Login
 * Rotates token on every login for Session Fixation Defense
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Validate email and password presence
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Find user and explicitly select password hash
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Send rotated token and cookie if credentials match
  createSendToken(user, 200, req, res);
});

/**
 * User Logout
 * Overwrites active JWT cookie and records lastLogoutAt to permanently invalidate token server-side
 */
exports.logout = catchAsync(async (req, res, next) => {
  // 1) Extract token if present (from Authorization header or cookie) to revoke server-side
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // 2) If a valid token exists, update user's lastLogoutAt timestamp to invalidate all prior tokens
  if (token && token !== 'loggedout') {
    try {
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      await User.findByIdAndUpdate(decoded.id, { lastLogoutAt: Date.now() });
    } catch (err) {
      // If token is invalid or expired, continue to clear cookie
    }
  }

  // 3) Instantly purge active JWT cookie from client browser with zero maxAge
  res.cookie('jwt', 'loggedout', {
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure:
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      process.env.NODE_ENV === 'production',
  });

  // Explicitly prevent browser/proxy 304 caching of logout endpoint
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

/**
 * Route Protection Middleware
 * Verifies JWT validity, user existence, and password modification timestamps
 */
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Extract token from Authorization header or HttpOnly cookie
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token || token === 'loggedout') {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Asynchronously verify token signature
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists in database
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // 5) Check if user logged out after the token was issued (Token Revocation Defense)
  if (currentUser.loggedOutAfter && currentUser.loggedOutAfter(decoded.iat)) {
    return next(
      new AppError('You have been logged out! Please log in again.', 401)
    );
  }

  // 6) Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

/**
 * Optional Route Protection Middleware
 * Attaches req.user if a valid token is present; otherwise silently passes next() with req.user = null
 */
exports.protectOptional = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token || token === 'loggedout') {
    req.user = null;
    return next();
  }

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      req.user = null;
      return next();
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      req.user = null;
      return next();
    }

    if (currentUser.loggedOutAfter && currentUser.loggedOutAfter(decoded.iat)) {
      req.user = null;
      return next();
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    return next();
  } catch (err) {
    req.user = null;
    return next();
  }
});

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts endpoint to specified user roles (e.g. 'seller', 'admin')
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

/**
 * Request Password Reset Token & Transmit Recovery Email
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  if (!req.body.email) {
    return next(new AppError('Please provide your email address.', 400));
  }

  const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
  if (!user) {
    return next(
      new AppError('There is no registered account with that email address.', 404)
    );
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send token to user's email
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetURL = `${clientUrl}/reset-password/${resetToken}`;

    const message = `Hello ${user.name},\n\nWe received a request to reset your password on ApexMart.\nPlease follow the link below to set a new password:\n\n${resetURL}\n\nThis password reset link is valid for 10 minutes.\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">ApexMart Password Assistance</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="margin: 28px 0;">
          <a href="${resetURL}" style="background-color: #f59e0b; color: #111827; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #3b82f6; font-size: 13px; word-break: break-all;">${resetURL}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">This link will expire in 10 minutes. If you did not make this request, you can safely ignore this email.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'ApexMart: Password Reset Request (Valid for 10 min)',
      message,
      html,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to your email!',
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the reset email. Please try again later!', 500)
    );
  }
});

/**
 * Reset Password using Crypto Hash Validation
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  const rawToken = req.params.token ? req.params.token.trim() : '';

  if (!rawToken || rawToken === ':token') {
    return next(new AppError('Password reset token is missing or malformed.', 400));
  }

  // 1) Get user based on token hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token is invalid or expired
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 3) Validate new password input
  if (!req.body.password || !req.body.passwordConfirm) {
    return next(new AppError('Please provide password and passwordConfirm', 400));
  }

  // 4) Update user password & clear reset tokens
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 5) Log the user in and return fresh JWT cookie
  createSendToken(user, 200, req, res);
});

/**
 * Update Current Authenticated User Password
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection (must explicitly select +password)
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if current password is provided and correct
  if (!req.body.passwordCurrent) {
    return next(new AppError('Please provide your current password.', 400));
  }

  if (
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  // 3) Update user password
  if (!req.body.password || !req.body.passwordConfirm) {
    return next(
      new AppError('Please provide new password and passwordConfirm.', 400)
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in with fresh token
  createSendToken(user, 200, req, res);
});

