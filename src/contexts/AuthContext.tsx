import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Teacher } from '@/data/types';
import { AdminUser } from '@/types/supabase';
import { SupabaseService, serviceClient, supabase } from '@/services/supabaseService';
import { AdminService } from '@/services/adminService';
import { AuthService } from '@/services/authService';

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
              console.log('AuthContext - Teacher session restored:', { id: teacher.id, name: teacher.name });
              return;
            } else {
              // Teacher session exists but teacher not found in database or is inactive
              console.warn('AuthContext - Teacher session invalid - teacher not found in database:', {
                savedUserId,
                error: teacherResponse.error
              });
              // Clear invalid session
              localStorage.removeItem('userId');
              localStorage.removeItem('userRole');
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
        console.log('AuthContext - Attempting teacher login for:', { id, password });

        // First, fetch teacher from database
        const teacherResponse = await SupabaseService.getTeacherById(id);

        console.log('AuthContext - Teacher database response:', {
          id,
          success: teacherResponse.success,
          data: teacherResponse.data,
          error: teacherResponse.error
        });

        // Check if teacher exists and is active
        if (!teacherResponse.success || !teacherResponse.data) {
          console.error('AuthContext - Teacher not found in database or inactive:', {
            id,
            error: teacherResponse.error
          });
          return false;
        }

        // Verify password using proper bcrypt comparison
        const storedHash = teacherResponse.data.password_hash;

        console.log('AuthContext - Password verification:', {
          id,
          storedHash: storedHash,
          password: password,
          hashLength: storedHash.length
        });

        try {
          // Use proper bcrypt password verification
          const isValidPassword = await AuthService.comparePassword(password, storedHash);

          console.log('AuthContext - Password comparison result:', {
            id,
            isValid: isValidPassword,
            passwordProvided: password,
            hashCompared: storedHash.substring(0, 20) + '...'
          });

          if (!isValidPassword) {
            console.error('AuthContext - Invalid password for teacher:', {
              id,
              storedHash: storedHash
            });
            return false;
          }
        } catch (error) {
          console.error('AuthContext - Error during password comparison:', {
            id,
            error: error.message,
            stack: error.stack
          });
          return false;
        }

        // Password is correct, create authenticated teacher session
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

        console.log('AuthContext - Teacher login successful:', { id, name: teacher.name });
        return true;
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
        // Create a custom token session for admin to bypass RLS
        try {
          // Use service client to create a custom JWT token for the admin user
          const { data, error } = await serviceClient.auth.admin.generateLink({
            type: 'signup',
            email: `${adminResponse.data.username}@admin.local`,
            password: 'admin_temp_token',
            options: {
              data: {
                user_id: adminResponse.data.id,
                role: 'admin',
                username: adminResponse.data.username
              }
            }
          });

          if (error) {
            console.warn('Could not generate admin auth link, proceeding with session-only login:', error);
          }
        } catch (tokenError) {
          console.warn('Admin token generation failed, proceeding with session-only login:', tokenError);
        }

        setUser(adminResponse.data);
        setIsAuthenticated(true);
        setRole('admin');

        // Save session to localStorage
        console.log('AuthContext - Saving admin session:', adminResponse.data.id);
        localStorage.setItem('userId', adminResponse.data.id);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('adminId', adminResponse.data.id); // Store admin ID for service operations
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
    localStorage.removeItem('adminId');

    // Sign out from Supabase if there's a session
    supabase.auth.signOut().catch(error => {
      console.warn('Error signing out from Supabase:', error);
    });
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

