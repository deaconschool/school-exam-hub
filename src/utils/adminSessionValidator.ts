// Direct localStorage-based admin session validation
export const validateAdminSession = () => {
  const localUserId = localStorage.getItem('userId');
  const localRole = localStorage.getItem('userRole');

  // Brute force: if localStorage has admin data, consider it valid
  if (localUserId && localRole === 'admin') {
    return true;
  }

  return false;
};

export const createAdminSession = (adminId: string) => {
  localStorage.setItem('userId', adminId);
  localStorage.setItem('userRole', 'admin');
  localStorage.setItem('adminSessionTimestamp', Date.now().toString());
};

export const clearAdminSession = () => {
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  localStorage.removeItem('adminSessionTimestamp');
};

export const getAdminSessionData = () => {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const timestamp = localStorage.getItem('adminSessionTimestamp');

  return {
    userId,
    userRole,
    timestamp,
    isValid: !!(userId && userRole === 'admin')
  };
};