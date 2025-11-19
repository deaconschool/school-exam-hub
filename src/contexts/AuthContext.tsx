import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Teacher } from '@/data/types';
import { AdminUser } from '@/types/supabase';
import { SupabaseService } from '@/services/supabaseService';
import { AdminService } from '@/services/adminService';

interface AuthState {
  user: Teacher | AdminUser | null;
  isAuthenticated: boolean;
  role: 'teacher' | 'admin' | null;
  login: (id: string, password: string, userRole?: 'teacher' | 'admin') => Promise<boolean>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isTeacher: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Teacher | AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<'teacher' | 'admin' | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedRole = localStorage.getItem('userRole') as 'teacher' | 'admin' | null;

    if (savedUserId && savedRole) {
      // Load user from appropriate service
      const loadUserSession = async () => {
        console.log('AuthContext - Loading session:', { savedUserId, savedRole });
        try {
          if (savedRole === 'teacher') {
            const teacherResponse = await SupabaseService.getTeacherById(savedUserId);
            if (teacherResponse.success && teacherResponse.data) {
              const teacher: Teacher = {
                id: teacherResponse.data.id,
                name: teacherResponse.data.name,
                password: '', // Don't store password in session
              };
              setUser(teacher);
              setIsAuthenticated(true);
              setRole('teacher');
              return;
            }
          } else if (savedRole === 'admin') {
            console.log('AuthContext - Loading admin session from localStorage');

            // Always create minimal admin session immediately for persistence
            const minimalAdminUser: AdminUser = {
              id: savedUserId,
              username: 'admin',
              email: '',
              password_hash: '',
              role: 'admin',
              permissions: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_login: null,
              is_active: true
            };

            // Set authentication state immediately to prevent redirects
            setUser(minimalAdminUser);
            setIsAuthenticated(true);
            setRole('admin');
            console.log('AuthContext - Admin session set immediately with minimal data');

            // Try to fetch full admin data in background (non-blocking)
            AdminService.getAllAdmins()
              .then(adminResponse => {
                if (adminResponse.success && adminResponse.data) {
                  const fullAdmin = adminResponse.data.find(a => a.id === savedUserId);
                  if (fullAdmin && fullAdmin.is_active) {
                    console.log('AuthContext - Full admin data found, updating user');
                    setUser(fullAdmin);
                  } else {
                    console.warn('AuthContext - Admin not found or inactive in database, keeping minimal session');
                  }
                } else {
                  console.warn('AuthContext - Failed to fetch admin data, keeping minimal session:', adminResponse.error);
                }
              })
              .catch(error => {
                console.error('AuthContext - Error fetching admin data, keeping minimal session:', error);
              });

            return;
          }

          // Clear invalid session
          localStorage.removeItem('userId');
          localStorage.removeItem('userRole');
        } catch (error) {
          console.error('Error loading user session:', error);
          localStorage.removeItem('userId');
          localStorage.removeItem('userRole');
        }
      };

      loadUserSession();
    }
  }, []);

  const login = async (id: string, password: string, userRole: 'teacher' | 'admin' = 'teacher'): Promise<boolean> => {
    try {
      if (userRole === 'teacher') {
        // Teacher login
        const validTeacherIds = ['T001', 'T002', 'T003'];
        const validPassword = 'password123';

        if (validTeacherIds.includes(id) && password === validPassword) {
          const teacherResponse = await SupabaseService.getTeacherById(id);
          if (teacherResponse.success && teacherResponse.data) {
            const teacher: Teacher = {
              id: teacherResponse.data.id,
              name: teacherResponse.data.name,
              password: '', // Don't store password in session
            };

            setUser(teacher);
            setIsAuthenticated(true);
            setRole('teacher');

            // Save session to localStorage
            localStorage.setItem('userId', id);
            localStorage.setItem('userRole', 'teacher');

            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const adminResponse = await AdminService.adminLogin(username, password);

      if (adminResponse.success && adminResponse.data) {
        setUser(adminResponse.data);
        setIsAuthenticated(true);
        setRole('admin');

        // Save session to localStorage
        console.log('AuthContext - Saving admin session:', adminResponse.data.id);
        localStorage.setItem('userId', adminResponse.data.id);
        localStorage.setItem('userRole', 'admin');
        console.log('AuthContext - Admin session saved to localStorage');

        return true;
      }

      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setRole(null);

    // Clear session from localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || role !== 'admin') return false;
    return AdminService.hasPermission(user as AdminUser, permission);
  };

  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';

  // Debug logging for admin state changes
  useEffect(() => {
    console.log('AuthContext - State changed:', {
      user: user?.id,
      role,
      isAuthenticated,
      isAdmin,
      isTeacher,
      localStorage: {
        userId: localStorage.getItem('userId'),
        userRole: localStorage.getItem('userRole')
      }
    });
  }, [user, role, isAuthenticated, isAdmin, isTeacher]);

  const value: AuthState = {
    user,
    isAuthenticated,
    role,
    login,
    adminLogin,
    logout,
    hasPermission,
    isAdmin,
    isTeacher,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

