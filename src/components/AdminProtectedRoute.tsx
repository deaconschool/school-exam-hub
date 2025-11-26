import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAdminSession } from '@/utils/adminSessionValidator';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Brute force: check localStorage directly
    if (!validateAdminSession()) {
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  // Always render children if localStorage has admin data
  return <>{children}</>;
};