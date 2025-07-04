import { useState, useEffect } from "preact/hooks";
import { AuthManager } from "../utils/auth";

export interface User {
  email: string;
  isAdmin?: boolean;
}

export const useAuth = (defaultUserLogin?: string) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => 
    AuthManager.isAuthenticated()
  );
  const [currentUser, setCurrentUser] = useState<string>(() => {
    const user = AuthManager.getCurrentUser();
    return user?.email || defaultUserLogin || "";
  });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const initializeAuth = () => {
    const authenticated = AuthManager.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      const user = AuthManager.getCurrentUser();
      setCurrentUser(user?.email || defaultUserLogin || "");
    }
    
    setIsInitialized(true);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const user = AuthManager.getCurrentUser();
    setCurrentUser(user?.email || defaultUserLogin || "");
  };

  const handleLogout = () => {
    AuthManager.clearAuth();
    setIsAuthenticated(false);
    setCurrentUser("");
  };

  const getCurrentUserData = (): User | null => {
    return AuthManager.getCurrentUser();
  };

  const isUserAdmin = (): boolean => {
    const user = AuthManager.getCurrentUser();
    return user?.isAdmin || false;
  };

  const hasPermission = (requireAdmin: boolean = false): boolean => {
    if (!isAuthenticated) return false;
    if (requireAdmin && !isUserAdmin()) return false;
    return true;
  };

  useEffect(() => {
    initializeAuth();
  }, [defaultUserLogin]);

  return {
    isAuthenticated,
    currentUser,
    isInitialized,
    actions: {
      handleLoginSuccess,
      handleLogout,
      initializeAuth
    },
    utils: {
      getCurrentUserData,
      isUserAdmin,
      hasPermission
    }
  };
};

export default useAuth;