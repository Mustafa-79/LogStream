import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import Context = require("ojs/ojcontext");
import { Footer } from "./footer";
import { Header } from "./header";
import { Applications } from "./pages/Applications/index";

type Props = Readonly<{
  appName?: string;
  userLogin?: string;
}>;

type Log = {
  _id: string;
  message: string;
  log_level: string;
  trace_id: string;
  date: string;
};

export const App = registerCustomElement(
  "app-root",
  ({ appName = "App Name", userLogin = "john.hancock@oracle.com" }: Props) => {
    const [logs, setLogs] = useState<Log[]>([]);
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
        console.log('Fetched new logs:', newLogs);

        if (newLogs.length) {
          setLogs((prev) => [...prev, ...newLogs]);
          latestDateRef.current = newLogs[newLogs.length - 1].date;
        }
      } catch (err) {
        console.error('Error fetching new logs:', err);
      }
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

      // Cleanup interval on component unmount
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
        <Applications />
        <Footer />
      </div>
    );
  }
);