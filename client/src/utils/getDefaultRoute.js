/**
 * Get the default route for a user based on their role
 * @param {Object} user - The user object
 * @returns {string} The default route path
 */
export const getDefaultRoute = (user) => {
  if (!user) {
    return '/login';
  }

  // Procurement and Legal users go to dashboard (ProcurementDashboard)
  if (user.role === 'procurement' || user.role === 'legal') {
    return '/dashboard';
  }

  // All other users go to dashboard
  return '/dashboard';
};

