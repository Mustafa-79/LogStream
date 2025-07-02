import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import Context = require("ojs/ojcontext");
import { Footer } from "./footer";
import { Header } from "./header";
import { Applications } from "./pages/Applications/index";
import { Login } from "./pages/Login/index";
import { Log } from "../utils/applicationUtils";
import { AuthManager } from "../utils/auth";

type Props = Readonly<{
  appName?: string;
  userLogin?: string;
}>;

export const App = registerCustomElement(
  "app-root",
  ({ appName = "App Name", userLogin = "john.hancock@oracle.com" }: Props) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<string>("");
    const [logs, setLogs] = useState<Log[]>([]);
    const [logCounts, setLogCounts] = useState<Record<string, { logsToday: number; errors: number }>>({});
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const latestDateRef = useRef<string | null>(null);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    // Check authentication status on component mount
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
    };

    const fetchNewLogs = async () => {
      if (!isAuthenticated) return;
      
      try {
        const url = `http://localhost:3000/api/logs/new${
          latestDateRef.current ? `?since=${encodeURIComponent(latestDateRef.current)}` : ''
        }`;

        const token = AuthManager.getToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) {
          if (res.status === 401) {
            // Token expired or invalid, logout user
            handleLogout();
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        const newLogs: Log[] = data.data;

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
    
        if (log.logLevel?.toLowerCase().includes('error')) {
          counts[sourceAppId].errors++;
        }
      });

      setLogCounts(counts);
    };

    useEffect(() => {
      if (!isAuthenticated) return;

      Context.getPageContext().getBusyContext().applicationBootstrapComplete();

      fetchNewLogs();

      const id = setInterval(() => {
        if (!isPaused) {
          fetchNewLogs();
        }
      }, 30000);

      intervalIdRef.current = id;

      return () => {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }
      };
    }, [isPaused, isAuthenticated]);

    return (
      <div id="appContainer" class="oj-web-applayout-page">
        {!isAuthenticated ? (
          <Login loginSuccess={handleLoginSuccess} />
        ) : (
          <>
            <Header 
              appName={appName} 
              userLogin={currentUser || userLogin} 
              onLogout={handleLogout}
            />
            <Applications logs={logs} logCounts={logCounts} />
            <Footer />
          </>
        )}
      </div>
    );
  }
);