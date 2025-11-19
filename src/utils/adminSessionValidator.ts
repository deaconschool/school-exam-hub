// Direct localStorage-based admin session validation
export const validateAdminSession = () => {
  const localUserId = localStorage.getItem('userId');
  const localRole = localStorage.getItem('userRole');

  console.log('AdminSessionValidator - Checking session:', {
    localUserId,
    localRole,
    hasValidData: !!(localUserId && localRole === 'admin')
  });

  // Brute force: if localStorage has admin data, consider it valid
  if (localUserId && localRole === 'admin') {
    console.log('AdminSessionValidator - Valid admin session found');
    return true;
  }

  console.log('AdminSessionValidator - No valid admin session');
  return false;
};

export const createAdminSession = (adminId: string) => {
  console.log('AdminSessionValidator - Creating admin session:', adminId);
  localStorage.setItem('userId', adminId);
  localStorage.setItem('userRole', 'admin');
  localStorage.setItem('adminSessionTimestamp', Date.now().toString());
};

export const clearAdminSession = () => {
  console.log('AdminSessionValidator - Clearing admin session');
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