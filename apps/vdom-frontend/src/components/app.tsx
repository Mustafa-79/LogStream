import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import Context = require("ojs/ojcontext");
import { Footer } from "./footer";
import { Header } from "./header";
import { Applications } from "./pages/Applications/index";
import { Log } from "../utils/applicationUtils";

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
    const latestDateRef = useRef<string | null>(null);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    const fetchNewLogs = async () => {
      try {
        const url = `http://localhost:3000/api/logs/new${
          latestDateRef.current ? `?since=${encodeURIComponent(latestDateRef.current)}` : ''
        }`;

        const res = await fetch(url);
        if (!res.ok) {
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
    
        if (log.logLevel && log.logLevel.toLowerCase().includes('error')) {
          counts[sourceAppId].errors++;
        }
      });

      setLogCounts(counts);
    };

    useEffect(() => {
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
    }, [isPaused]);

    const togglePause = () => {
      setIsPaused(prev => !prev);
    };

    return (
      <div id="appContainer" class="oj-web-applayout-page">
        <Header appName={appName} userLogin={userLogin} />
        <Applications logs={logs} logCounts={logCounts} />
        <Footer />
      </div>
    );
  }
);