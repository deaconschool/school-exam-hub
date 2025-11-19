import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAdminSession } from '@/utils/adminSessionValidator';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AdminProtectedRoute - Checking admin access...');

    // Brute force: check localStorage directly
    if (!validateAdminSession()) {
      console.log('AdminProtectedRoute - No valid admin session, redirecting to login');
      navigate('/admin/login');
      return;
    }

    console.log('AdminProtectedRoute - Admin session validated, granting access');
  }, [navigate]);

  // Always render children if localStorage has admin data
  return <>{children}</>;
};