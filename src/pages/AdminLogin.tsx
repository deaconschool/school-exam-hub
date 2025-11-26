import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Shield, User, Lock, Home } from 'lucide-react';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { login, logout, adminLogin, isAuthenticated, user, isAdmin } = useAuth();
  // Admin portal is English-only - no language switching
  // Force LTR direction for admin portal regardless of global language setting

  const goToHome = () => {
    navigate('/');
  };

  // Set LTR direction when component mounts
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    return () => {
      // Restore original direction when unmounting
      const storedLanguage = localStorage.getItem('language') || 'ar';
      document.documentElement.setAttribute('dir', storedLanguage === 'ar' ? 'rtl' : 'ltr');
    };
  }, []);

  // Redirect if already authenticated as an admin
  useEffect(() => {
    if (isAuthenticated && user) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        // Teacher is trying to access admin portal
        setError('Access denied. Admin privileges required.');
      }
    }
  }, [isAuthenticated, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      // Use adminLogin function from AuthContext
      const success = await adminLogin(username, password);

      if (success) {
        setSuccess(true);
        // Navigate after a short delay to show success message
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Login Form */}
        <Card className="shadow-2xl border-2 border-purple-100 bg-white/95 backdrop-blur-sm w-full max-w-md">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Admin Login
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Enter your admin credentials
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    placeholder="Enter admin username"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Enter admin password"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>Login as Admin</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Demo Info - REMOVED FOR SECURITY */}
            {import.meta.env.VITE_DEMO_MODE === 'true' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-700">
                    <p className="font-semibold mb-1">
                      Demo Mode Active
                    </p>
                    <p>
                      This is a demonstration environment only.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <Button
            onClick={goToHome}
            size="sm"
            className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50 mx-auto"
            variant="outline"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
          <div className="text-gray-500 text-sm">
            <p>
              Secure admin access • All activities monitored
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;