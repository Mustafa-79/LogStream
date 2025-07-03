import { h } from "preact";
import { useState, useEffect } from "preact/hooks";

export interface RouteConfig {
  path: string;
  component: () => any;
  label: string;
  icon: string;
}

class SimpleRouter {
  private routes: RouteConfig[] = [];
  private listeners: ((path: string) => void)[] = [];
  private currentPath: string = '/';

  constructor(routes: RouteConfig[]) {
    this.routes = routes;
    this.currentPath = this.getPathFromHash();
    
    // Listen for browser back/forward
    window.addEventListener('popstate', () => {
      this.currentPath = this.getPathFromHash();
      this.notifyListeners();
    });
  }

  private getPathFromHash(): string {
    return window.location.hash ? window.location.hash.slice(1) : '/';
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentPath));
  }

  public navigate(path: string) {
    if (path !== this.currentPath) {
      this.currentPath = path;
      window.location.hash = path;
      this.notifyListeners();
    }
  }

  public subscribe(listener: (path: string) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getCurrentRoute(): RouteConfig | undefined {
    // First, try exact match
    const exactMatch = this.routes.find(route => route.path === this.currentPath);
    if (exactMatch) {
      return exactMatch;
    }

    // Then try prefix match for non-root routes
    const prefixMatch = this.routes.find(route => {
      if (route.path === '/') {
        return false; // Don't allow root to match other paths
      }
      return this.currentPath.startsWith(route.path);
    });

    return prefixMatch;
  }

  public getRoutes(): RouteConfig[] {
    return this.routes;
  }

  public getPath(): string {
    return this.currentPath;
  }
}

export function useRouter(routes: RouteConfig[]) {
  const [router] = useState(() => new SimpleRouter(routes));
  const [currentPath, setCurrentPath] = useState(router.getPath());

  useEffect(() => {
    const unsubscribe = router.subscribe((path) => {
      setCurrentPath(path);
    });

    return unsubscribe;
  }, [router]);

  return {
    currentPath,
    navigate: (path: string) => router.navigate(path),
    currentRoute: router.getCurrentRoute(),
    routes: router.getRoutes()
  };
}