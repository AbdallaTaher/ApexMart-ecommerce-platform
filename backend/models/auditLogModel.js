const mongoose = require('mongoose');
const AppError = require('../utils/appError');

/**
 * Immutable Audit Log Schema (Module 06 - Comprehensive Auditing)
 * Records tamper-proof trails for high-risk operations:
 * - Authentication & Role Modifications
 * - Order Status Transitions & Invoicing
 * - Catalog Alterations & Destructive Operations
 * - Financial Settlements & Security Alerts
 */
const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Audit log requires an action identifier'],
      trim: true,
      index: true,
    },
    entity: {
      type: String,
      required: [true, 'Audit log requires an entity category'],
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
      trim: true,
    },
    userAgent: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    severity: {
      type: String,
      enum: {
        values: ['info', 'warning', 'critical'],
        message: 'Severity must be either info, warning, or critical',
      },
      default: 'info',
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// High-speed compound indexes for Admin Console Virtualized Table
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, action: 1, createdAt: -1 });

// Strict Immutability Guard: Rejects any attempt to modify or delete audit log entries
const preventMutation = function (next) {
  next(new AppError('Audit logs are immutable and cannot be modified or deleted.', 403));
};

auditLogSchema.pre('updateOne', preventMutation);
auditLogSchema.pre('updateMany', preventMutation);
auditLogSchema.pre('findOneAndUpdate', preventMutation);
auditLogSchema.pre('replaceOne', preventMutation);
auditLogSchema.pre('findOneAndReplace', preventMutation);
auditLogSchema.pre('deleteOne', preventMutation);
auditLogSchema.pre('deleteMany', preventMutation);
auditLogSchema.pre('findOneAndDelete', preventMutation);
auditLogSchema.pre('findOneAndRemove', preventMutation);
auditLogSchema.pre('remove', preventMutation);

// Query middleware: Auto-populate actor identity (name, email, role, photo)
auditLogSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name email role photo',
  });
  next();
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
