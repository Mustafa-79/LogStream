import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import Context = require("ojs/ojcontext");

import { Footer } from "./footer";
import { Header } from "./header";
import { Applications } from "./pages/Applications/index";
import { Sidebar } from "./sidebar";
import { UserGroups } from "./pages/UserGroups/UserGroups";
import { useRouter, RouteConfig } from "./router";
import { Log } from "../utils/applicationUtils";
import { Dashboard } from "./pages/Dashboard/index";
import { Login } from "./pages/Login/index";
import { AuthManager } from "../utils/auth";
import { ProtectedRoute } from "./ProtectedRoute";
import "oj-c/button";

type Props = Readonly<{
  appName?: string;
  userLogin?: string;
}>;

export const App = registerCustomElement(
  "app-root",
  ({ appName = "App Name", userLogin = "john.hancock@oracle.com" }: Props) => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [logCounts, setLogCounts] = useState<Record<string, { logsToday: number; errors: number }>>({});
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
    const latestDateRef = useRef<string | null>(null);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<string>("");

    useEffect(() => {
      const authenticated = AuthManager.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const user = AuthManager.getCurrentUser();
        setCurrentUser(user?.email || userLogin);
      }
    }, [userLogin]);

    const handleLoginSuccess = () => {
      setIsAuthenticated(true);
      const user = AuthManager.getCurrentUser();
      setCurrentUser(user?.email || userLogin);
      navigate('/');
    };

    const handleLogout = () => {
      AuthManager.clearAuth();
      setIsAuthenticated(false);
      setCurrentUser("");
      setLogs([]);
      setLogCounts({});
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      navigate('/login');
    };

    const handleRedirect = (path: string) => {
      navigate(path);
    };

    const routes: RouteConfig[] = [
      {
        path: '/',
        component: () => (
          <ProtectedRoute 
            requireAuth={true}
            onRedirect={handleRedirect}
          >
            <Dashboard />
          </ProtectedRoute>
        ),
        label: 'Dashboard',
        icon: 'oj-ux-ico-dashboard',
        requireAuth: true
      },
      {
        path: '/applications',
        component: () => (
          <ProtectedRoute 
            requireAuth={true}
            onRedirect={handleRedirect}
          >
            <Applications logs={logs} logCounts={logCounts} />
          </ProtectedRoute>
        ),
        label: 'Applications',
        icon: 'oj-ux-ico-application',
        requireAuth: true
      },
      {
        path: '/user-groups',
        component: () => (
          <ProtectedRoute 
            requireAuth={true}
            requireAdmin={true}
            onRedirect={handleRedirect}
          >
            <UserGroups />
          </ProtectedRoute>
        ),
        label: 'User Groups',
        icon: 'oj-ux-ico-group',
        requireAuth: true,
        requireAdmin: true
      },
      {
        path: '/login',
        component: () => <Login loginSuccess={handleLoginSuccess} />,
        label: 'Login',
        icon: 'oj-ux-ico-login',
        requireAuth: false
      }
    ];

    const { currentPath, navigate, currentRoute } = useRouter(routes);

    const getVisibleRoutes = () => {
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
    };

    const fetchNewLogs = async () => {
      if (!AuthManager.isAuthenticated()) {
        return;
      }

      try {
        const token = AuthManager.getToken();
        const url = `http://localhost:3000/api/logs/new${
          latestDateRef.current ? `?since=${encodeURIComponent(latestDateRef.current)}` : ''
        }`;

        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            handleLogout();
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        const newLogs: Log[] = data.data;
        console.log('Fetched new logs:', newLogs);

        if (newLogs.length) {
          setLogs(prev => {
            const merged = [...prev, ...newLogs];
            computeLogCounts(merged);
            return merged;
          });
          latestDateRef.current = newLogs[newLogs.length - 1].date;
        }
      } catch (err) {
        console.error('Error fetching new logs:', err);
      }
    };

    const computeLogCounts = (logsToProcess: Log[]) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const counts: Record<string, { logsToday: number; errors: number }> = {};

      logsToProcess.forEach(log => {
        const sourceAppId = log.sourceApp;

        if (!sourceAppId) {
          return;
        }

        const logDate = new Date(log.date);
        if (isNaN(logDate.getTime())) {
          return;
        }

        logDate.setHours(0, 0, 0, 0);

        if (!counts[sourceAppId]) {
          counts[sourceAppId] = { logsToday: 0, errors: 0 };
        }

        counts[sourceAppId].logsToday++;

        if (log.logLevel && log.logLevel.toLowerCase().includes('error')) {
          counts[sourceAppId].errors++;
        }
      });

      setLogCounts(counts);
    };

    useEffect(() => {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();

      if (AuthManager.isAuthenticated()) {
        fetchNewLogs();

        const id = setInterval(() => {
          if (!isPaused) {
            fetchNewLogs();
          }
        }, 30000);

        intervalIdRef.current = id;
      }

      return () => {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }
      };
    }, [isPaused, isAuthenticated]);

    useEffect(() => {
      const authenticated = AuthManager.isAuthenticated();
      
      if (!authenticated && currentPath !== '/login') {
        navigate('/login');
        return;
      }
      
      if (authenticated && currentPath === '/login') {
        navigate('/');
        return;
      }
    }, [isAuthenticated, currentPath, navigate]);

    const getCurrentComponent = () => {
      if (currentRoute && currentRoute.component) {
        return currentRoute.component();
      }
      
      if (!AuthManager.isAuthenticated()) {
        return <Login loginSuccess={handleLoginSuccess} />;
      }
      
      return (
        <ProtectedRoute requireAuth={true} onRedirect={handleRedirect}>
          <Dashboard />
        </ProtectedRoute>
      );
    };

    const toggleDrawer = () => {
      setIsDrawerOpen(prev => !prev);
    };

    if (!isAuthenticated) {
      return (
        <div id="appContainer" class="oj-web-applayout-page">
          <div style="transition: opacity 0.2s ease-in-out;">
            {getCurrentComponent()}
          </div>
        </div>
      );
    }

    return (
      <div id="appContainer" class="oj-web-applayout-page">
        <Header 
          appName="Log Stream"
          userLogin={currentUser || userLogin} 
          onToggleDrawer={toggleDrawer}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
        />

        <Sidebar 
          isOpen={isDrawerOpen}
          routes={getVisibleRoutes()}
          currentPath={currentPath}
          onNavigate={navigate}
        >
          <div style="transition: opacity 0.2s ease-in-out;">
            {getCurrentComponent()}
          </div>
        </Sidebar>

        <Footer />
      </div>
    );
  }
);