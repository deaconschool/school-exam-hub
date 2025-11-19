import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'teacher' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to appropriate login based on required role
      if (requiredRole === 'admin') {
        navigate('/admin/login');
      } else {
        navigate('/teacher/login');
      }
      return;
    }

    if (requiredRole && role !== requiredRole) {
      // User doesn't have required role
      if (requiredRole === 'admin') {
        navigate('/admin/login');
      } else {
        navigate('/teacher/login');
      }
      return;
    }
  }, [isAuthenticated, role, requiredRole, navigate]);

  if (!isAuthenticated || (requiredRole && role !== requiredRole)) {
    return null; // Show nothing while redirecting
  }

  return <>{children}</>;
};