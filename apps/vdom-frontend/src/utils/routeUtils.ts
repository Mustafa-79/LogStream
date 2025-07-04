import { RouteConfig } from "../components/router";
import { AuthManager } from "../utils/auth";

export class RouteUtils {
  static getVisibleRoutes(routes: RouteConfig[]): RouteConfig[] {
    const user = AuthManager.getCurrentUser();
    const authenticated = AuthManager.isAuthenticated();
    
    return routes.filter(route => {
      if (route.path === '/login') {
        return false;
      }
      
      if (route.requireAuth && !authenticated) {
        return false;
      }
      
      if (route.requireAdmin && (!user || !user.isAdmin)) {
        return false;
      }
      
      return true;
    });
  }

  static shouldRedirect(
    currentPath: string, 
    isAuthenticated: boolean, 
    isInitialized: boolean
  ): { shouldRedirect: boolean; redirectTo?: string } {
    if (!isInitialized) {
      return { shouldRedirect: false };
    }

    if (!isAuthenticated && currentPath !== '/login') {
      return { shouldRedirect: true, redirectTo: '/login' };
    }
    
    if (isAuthenticated && currentPath === '/login') {
      return { shouldRedirect: true, redirectTo: '/' };
    }

    return { shouldRedirect: false };
  }

  static requiresAuth(route: RouteConfig): boolean {
    return route.requireAuth || false;
  }

  static requiresAdmin(route: RouteConfig): boolean {
    return route.requireAdmin || false;
  }

  static getDefaultRoute(isAuthenticated: boolean): string {
    return isAuthenticated ? '/' : '/login';
  }
}

export default RouteUtils;