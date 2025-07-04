import { useState, useEffect } from "preact/hooks";
import { useRouter, RouteConfig } from "../components/router";
import { useAuth } from "./useAuth";
import { useLogs } from "./useLogs";
import RouteUtils from "../utils/routeUtils";

interface UseAppStateOptions {
  routes: RouteConfig[];
  defaultUserLogin?: string;
  appName?: string;
}

export const useAppState = (options: UseAppStateOptions) => {
  const { routes, defaultUserLogin, appName } = options;
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  const auth = useAuth(defaultUserLogin);
  
  const { currentPath, navigate, currentRoute } = useRouter(routes);
  
  const logs = useLogs({
    autoFetch: auth.isAuthenticated,
    onUnauthorized: auth.actions.handleLogout
  });

  useEffect(() => {
    const { shouldRedirect, redirectTo } = RouteUtils.shouldRedirect(
      currentPath, 
      auth.isAuthenticated, 
      auth.isInitialized
    );

    if (shouldRedirect && redirectTo) {
      navigate(redirectTo);
    }
  }, [auth.isAuthenticated, currentPath, navigate, auth.isInitialized]);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      logs.actions.clearLogs();
    }
  }, [auth.isAuthenticated]);

  const handleLoginSuccess = () => {
    auth.actions.handleLoginSuccess();
    navigate('/');
  };

  const handleLogout = () => {
    auth.actions.handleLogout();
    logs.actions.clearLogs();
    navigate('/login');
  };

  const handleRedirect = (path: string) => {
    navigate(path);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(prev => !prev);
  };

  const getVisibleRoutes = () => {
    return RouteUtils.getVisibleRoutes(routes);
  };

  const getCurrentComponent = () => {
    if (!auth.isInitialized) {
      return null; 
    }

    if (currentRoute && currentRoute.component) {
      return currentRoute.component();
    }
    
    return null;
  };

  return {
    // Auth state
    isAuthenticated: auth.isAuthenticated,
    currentUser: auth.currentUser,
    isInitialized: auth.isInitialized,
    
    // Logs state
    logs: logs.logs,
    logCounts: logs.logCounts,
    logsLoading: logs.loading,
    logsError: logs.error,
    isPaused: logs.isPaused,
    
    // UI state
    isDrawerOpen,
    
    // Router state
    currentPath,
    currentRoute,
    
    // Actions
    actions: {
      handleLoginSuccess,
      handleLogout,
      handleRedirect,
      toggleDrawer,
      navigate,
      pauseLogs: logs.actions.pausePolling,
      resumeLogs: logs.actions.resumePolling,
      refetchLogs: logs.actions.refetch
    },
    
    // Computed values
    visibleRoutes: getVisibleRoutes(),
    currentComponent: getCurrentComponent(),
    
    // Auth utilities
    hasPermission: auth.utils.hasPermission,
    isUserAdmin: auth.utils.isUserAdmin,
    
    // App config
    appName: appName || "Log Stream"
  };
};

export default useAppState;