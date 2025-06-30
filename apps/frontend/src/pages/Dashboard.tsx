// Dashboard.tsx
import { useEffect, useRef, useState, useMemo } from 'react';
import axios from 'axios';

interface Log {
  _id: string;
  message: string;
  log_level: string;
  trace_id: string;
  date: string;
}

const Dashboard = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const latestDateRef = useRef<string | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNewLogs = async () => {
    try {
      const url = `http://localhost:3000/api/logs/new${
        latestDateRef.current ? `?since=${encodeURIComponent(latestDateRef.current)}` : ''
      }`;

      const res = await axios.get(url);
      const newLogs: Log[] = res.data.data;

      if (newLogs.length) {
        setLogs((prev) => [...prev, ...newLogs]);
        latestDateRef.current = newLogs[newLogs.length - 1].date;
      }
    } catch (err) {
      console.error('Error fetching new logs:', err);
    }
  };

  useEffect(() => {
    fetchNewLogs(); // Initial fetch

    const id = setInterval(() => {
      if (!isPaused) {
        fetchNewLogs();
      }
    }, 5000);

    intervalIdRef.current = id;

    return () => clearInterval(id);
  }, [isPaused]);

  const stats = useMemo(() => {
    const levelCounts: Record<string, number> = {};
    logs.forEach((log) => {
      levelCounts[log.log_level] = (levelCounts[log.log_level] || 0) + 1;
    });

    return {
      total: logs.length,
      levels: levelCounts,
    };
  }, [logs]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>Log Stats</h2>
        <p><strong>Total Logs:</strong> {stats.total}</p>
        {Object.entries(stats.levels).map(([level, count]) => (
          <p key={level}>
            <strong>{level}:</strong> {count}
          </p>
        ))}
        <button onClick={() => setIsPaused((prev) => !prev)}>
          {isPaused ? 'Resume Updates' : 'Pause Updates'}
        </button>
      </div>

      <ul>
        {logs.map((log) => (
          <li key={log._id}>
            <strong>[{log.log_level}]</strong> {log.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;