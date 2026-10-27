import { describe, it, expect } from 'vitest';
const bcrypt = require('bcryptjs');
const User = require('../../backend/models/userModel');

describe('User Model Schema & Methods Unit Tests', () => {
  it('should validate password confirmation matches password', () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      passwordConfirm: 'different123',
    });

    const error = user.validateSync();
    expect(error).toBeDefined();
    expect(error.errors['passwordConfirm']).toBeDefined();
    expect(error.errors['passwordConfirm'].message).toBe(
      'Passwords do not match'
    );
  });

  it('should validate email format using validator', () => {
    const user = new User({
      name: 'Jane Doe',
      email: 'invalid-email-format',
      password: 'password123',
      passwordConfirm: 'password123',
    });

    const error = user.validateSync();
    expect(error).toBeDefined();
    expect(error.errors['email']).toBeDefined();
    expect(error.errors['email'].message).toContain('Please provide a valid email');
  });

  it('should enforce role enum to user, seller, or admin', () => {
    const user = new User({
      name: 'Hacker',
      email: 'hacker@example.com',
      role: 'super-admin-bypass',
      password: 'password123',
      passwordConfirm: 'password123',
    });

    const error = user.validateSync();
    expect(error).toBeDefined();
    expect(error.errors['role']).toBeDefined();
  });

  it('should correctly verify passwords using bcrypt compare', async () => {
    const rawPassword = 'mySecurePassword!123';
    const hash = await bcrypt.hash(rawPassword, 10);

    const user = new User({
      name: 'Valid User',
      email: 'valid@example.com',
      password: hash,
    });

    const isMatch = await user.correctPassword(rawPassword, hash);
    const isWrong = await user.correctPassword('wrongPass', hash);

    expect(isMatch).toBe(true);
    expect(isWrong).toBe(false);
  });

  it('should detect when password was changed after JWT was issued', () => {
    const user = new User({
      name: 'Changed Password User',
      email: 'changed@example.com',
      passwordChangedAt: new Date(1700000000 * 1000), // timestamp: 1700000000
    });

    // Token issued before password change (e.g. 1699999000)
    const tokenIssuedBefore = 1699999000;
    expect(user.changedPasswordAfter(tokenIssuedBefore)).toBe(true);

    // Token issued after password change (e.g. 1700001000)
    const tokenIssuedAfter = 1700001000;
    expect(user.changedPasswordAfter(tokenIssuedAfter)).toBe(false);
  });

  it('should detect when user logged out after JWT was issued (token revocation)', () => {
    const user = new User({
      name: 'Logged Out User',
      email: 'loggedout@example.com',
      lastLogoutAt: new Date(1700000000 * 1000), // timestamp: 1700000000
    });

    // Token issued before logout (e.g. 1699999000) -> Should be rejected as revoked
    const tokenIssuedBefore = 1699999000;
    expect(user.loggedOutAfter(tokenIssuedBefore)).toBe(true);

    // Token issued after logout (e.g. 1700001000) -> Should be valid
    const tokenIssuedAfter = 1700001000;
    expect(user.loggedOutAfter(tokenIssuedAfter)).toBe(false);
  });

  it('should generate a cryptographic password reset token with expiration', () => {
    const user = new User({
      name: 'Reset User',
      email: 'reset@example.com',
    });

    const resetToken = user.createPasswordResetToken();

    expect(resetToken).toBeDefined();
    expect(typeof resetToken).toBe('string');
    expect(user.passwordResetToken).toBeDefined();
    expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
  });
});
