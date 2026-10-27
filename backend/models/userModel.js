const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [60, 'A user name must have less or equal to 60 characters'],
      minlength: [2, 'A user name must have at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email address'],
    },
    photo: {
      type: String,
      default: 'default-user.jpg',
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'seller', 'admin'],
        message: 'Role must be either user, seller, or admin',
      },
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // Custom validator only works on CREATE and SAVE
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords do not match',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogoutAt: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// COMPOUND INDEXES FOR HIGH-FREQUENCY QUERIES (Optimization Rule)
userSchema.index({ role: 1, active: 1 });

/**
 * Pre-save hook: Hash user password with bcrypt (cost = 12) if modified
 */
userSchema.pre('save', async function (next) {
  // Only run if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash password with salt cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field before persistence
  this.passwordConfirm = undefined;
  next();
});

/**
 * Pre-save hook: Update passwordChangedAt timestamp
 */
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // Subtract 1 second to account for token issuance delay
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/**
 * Query middleware: Automatically filter out inactive (soft-deleted) accounts
 */
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

/**
 * Instance method: Verify candidate password against encrypted database hash
 */
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * Instance method: Check if password was modified after a JWT token was issued
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

/**
 * Instance method: Check if user logged out after a JWT token was issued
 */
userSchema.methods.loggedOutAfter = function (JWTTimestamp) {
  if (this.lastLogoutAt) {
    const logoutTimestamp = parseInt(
      this.lastLogoutAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < logoutTimestamp;
  }

  // False means NOT logged out after token issuance
  return false;
};

/**
 * Instance method: Generate unhashed crypto token for password reset
 */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and store in database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires in 30 minutes for generous verification window
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
