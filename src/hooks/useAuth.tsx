import { useAuth as useAuthContext } from '@/contexts/AuthContext';

// Custom hook for easier access to auth functionality
export const useAuth = () => {
  const auth = useAuthContext();

  return {
    // Basic auth state
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    role: auth.role,

    // Actions
    login: auth.login,
    logout: auth.logout,
    adminLogin: auth.adminLogin,

    // Convenience getters
    teacherName: auth.user?.name || '',
    teacherId: auth.user?.id || '',
    adminName: (auth.user as any)?.username || '',
    adminId: auth.user?.id || '',
    isTeacher: auth.role === 'teacher',
    isAdmin: auth.role === 'admin',
  };
};