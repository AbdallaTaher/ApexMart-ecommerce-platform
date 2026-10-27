import apiClient from './apiClient';

/**
 * Fetch platform executive metrics, GMV, demographics, 30-day trajectory, top products
 * @returns {Promise<Object>}
 */
export async function getPlatformAnalytics() {
  const response = await apiClient.get('/admin/analytics');
  return response.data?.data?.analytics || {};
}

/**
 * Fetch user management list with search, role filtering, pagination
 * @param {Object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=50]
 * @param {string} [params.role]
 * @param {string} [params.search]
 * @param {string} [params.sort='-createdAt']
 * @returns {Promise<Object>} { users: [], totalCount: number, results: number }
 */
export async function getAdminUsers({ page = 1, limit = 50, role, search, sort = '-createdAt' } = {}) {
  const query = new URLSearchParams();
  if (page) query.append('page', page);
  if (limit) query.append('limit', limit);
  if (role && role !== 'all') query.append('role', role);
  if (search && search.trim()) query.append('search', search.trim());
  if (sort) query.append('sort', sort);

  const queryString = query.toString();
  const url = queryString ? `/admin/users?${queryString}` : '/admin/users';
  const response = await apiClient.get(url);

  return {
    users: response.data?.data?.users || [],
    totalCount: response.data?.totalCount || 0,
    results: response.data?.results || 0,
  };
}

/**
 * Update user role (promote/demote user)
 * @param {Object} payload
 * @param {string} payload.userId
 * @param {string} payload.role - 'user' | 'seller' | 'admin'
 * @returns {Promise<Object>}
 */
export async function updateUserRole({ userId, role }) {
  const response = await apiClient.patch(`/admin/users/${userId}/role`, { role });
  return response.data?.data?.user;
}

/**
 * Fetch immutable audit logs with search, severity filtering, pagination
 * @param {Object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=50]
 * @param {string} [params.severity]
 * @param {string} [params.action]
 * @param {string} [params.entity]
 * @param {string} [params.search]
 * @param {string} [params.sort='-createdAt']
 * @returns {Promise<Object>} { auditLogs: [], totalCount: number, results: number }
 */
export async function getAuditLogs({
  page = 1,
  limit = 50,
  severity,
  action,
  entity,
  search,
  sort = '-createdAt',
} = {}) {
  const query = new URLSearchParams();
  if (page) query.append('page', page);
  if (limit) query.append('limit', limit);
  if (severity && severity !== 'all') query.append('severity', severity);
  if (action && action !== 'all') query.append('action', action);
  if (entity && entity !== 'all') query.append('entity', entity);
  if (search && search.trim()) query.append('search', search.trim());
  if (sort) query.append('sort', sort);

  const queryString = query.toString();
  const url = queryString ? `/admin/audit-logs?${queryString}` : '/admin/audit-logs';
  const response = await apiClient.get(url);

  return {
    auditLogs: response.data?.data?.auditLogs || [],
    totalCount: response.data?.totalCount || 0,
    results: response.data?.results || 0,
  };
}

/**
 * Fetch audit trail summary statistics
 * @returns {Promise<Object>}
 */
export async function getAuditStats() {
  const response = await apiClient.get('/admin/audit-logs/stats');
  return response.data?.data?.stats || {};
}
