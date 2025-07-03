import { h } from "preact";
import { useEffect } from "preact/hooks";
import { AuthManager } from "../utils/auth";

interface ProtectedRouteProps {
  children: any;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  onRedirect: (path: string) => void;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireAdmin = false, 
  onRedirect 
}: ProtectedRouteProps) {
  
  useEffect(() => {
    if (requireAuth && !AuthManager.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      onRedirect('/login');
      return;
    }

    if (requireAdmin) {
      const user = AuthManager.getCurrentUser();
      if (!user || !user.isAdmin) {
        console.log('User not admin, redirecting to dashboard');
        onRedirect('/');
        return;
      }
    }
  }, [requireAuth, requireAdmin, onRedirect]);

  return children;
}