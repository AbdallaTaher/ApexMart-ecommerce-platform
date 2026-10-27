import apiClient from './apiClient';

/**
 * Public User Registration
 * @param {Object} userData - Registration payload
 * @returns {Promise<Object>} Created user profile
 */
export async function signupApi({ name, email, password, passwordConfirm, role = 'user' }) {
  const response = await apiClient.post('/users/signup', {
    name,
    email,
    password,
    passwordConfirm,
    role,
  });

  return response.data?.data?.user;
}

/**
 * Public User Authentication
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} Authenticated user profile
 */
export async function loginApi({ email, password }) {
  const response = await apiClient.post('/users/login', {
    email,
    password,
  });

  return response.data?.data?.user;
}

/**
 * User Session Invalidation / Logout
 * @returns {Promise<Object>} Logout confirmation
 */
export async function logoutApi() {
  const response = await apiClient.post('/users/logout');
  return response.data;
}

/**
 * Get Current Authenticated User Profile via Session Cookie
 * @returns {Promise<Object|null>} Current user document or null if unauthenticated
 */
export async function getCurrentUserApi() {
  try {
    const response = await apiClient.get('/users/me');
    return response.data?.data?.data || null;
  } catch (error) {
    // If not authenticated (401), return null gracefully to indicate guest state
    if (error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

/**
 * Request Password Reset Email Token
 * @param {Object} payload - { email }
 * @returns {Promise<Object>} Response confirmation
 */
export async function forgotPasswordApi({ email }) {
  const response = await apiClient.post('/users/forgotPassword', { email });
  return response.data;
}

/**
 * Reset Password using Recovery Token
 * @param {Object} payload - { token, password, passwordConfirm }
 * @returns {Promise<Object>} Authenticated user profile
 */
export async function resetPasswordApi({ token, password, passwordConfirm }) {
  const response = await apiClient.patch(`/users/resetPassword/${token}`, {
    password,
    passwordConfirm,
  });
  return response.data?.data?.user;
}

/**
 * Update Authenticated User Password
 * @param {Object} payload - { passwordCurrent, password, passwordConfirm }
 * @returns {Promise<Object>} Updated user profile
 */
export async function updatePasswordApi({ passwordCurrent, password, passwordConfirm }) {
  const response = await apiClient.patch('/users/updateMyPassword', {
    passwordCurrent,
    password,
    passwordConfirm,
  });
  return response.data?.data?.user;
}

/**
 * Update Authenticated User Profile Information (name, email)
 * @param {Object} payload - { name, email }
 * @returns {Promise<Object>} Updated user profile
 */
export async function updateMeApi({ name, email }) {
  const response = await apiClient.patch('/users/updateMe', { name, email });
  return response.data?.data?.user;
}

/**
 * Soft Delete Current User Account
 * @returns {Promise<Object>} Confirmation
 */
export async function deleteMeApi() {
  const response = await apiClient.delete('/users/deleteMe');
  return response.data;
}
