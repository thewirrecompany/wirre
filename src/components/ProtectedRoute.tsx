import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: 'company' | 'candidate' | 'admin' | 'superadmin';
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground font-mono text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole) {
    // Allow superadmins to access admin routes
    const allowed = profile.role === requiredRole || (requiredRole === 'admin' && profile.role === 'superadmin');
    if (!allowed) {
      let dashboardPath = '';
      if (profile.role === 'superadmin') {
        dashboardPath = '/superadmin/dashboard';
      } else if (profile.role === 'admin') {
        dashboardPath = '/admin/dashboard';
      } else if (profile.role === 'candidate') {
        dashboardPath = '/candidate/profile';
      } else {
        dashboardPath = `/${profile.role}/dashboard`;
      }
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return <>{children}</>;
}
