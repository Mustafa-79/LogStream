import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Log } from "../../../utils/applicationUtils";
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider');
import 'oj-c/table';

interface DashboardProps {
  logs: Log[];
  loading?: boolean;
}

interface TableLog {
  id: string;
  timestamp: string;
  logLevel: string;
  sourceApp: string;
  message: string;
  traceId: string;
}

type SortDirection = 'asc' | 'desc' | null;
type SortableColumn = 'timestamp' | 'logLevel' | 'sourceApp' | 'traceId' | 'message';

export const Dashboard = ({ logs, loading = false }: DashboardProps) => {
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [dataProvider, setDataProvider] = useState<any>(null);

  console.log('Render - sortColumn:', sortColumn, 'sortDirection:', sortDirection);

  const formatTimestamp = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Create custom header text with sorting icons
  const createHeaderText = (text: string, column: SortableColumn) => {
    let icon: string;
    
    if (sortColumn === column && sortDirection) {
      icon = sortDirection === 'asc' ? ' ▲' : ' ▼';
    } else {
      icon = ' ⇅';
    }
    
    return text + icon;
  };

  // Sort the data based on current sort state
  const sortData = (data: TableLog[]): TableLog[] => {
    if (!sortColumn || !sortDirection) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case 'timestamp':
          aVal = a.timestamp;
          bVal = b.timestamp;
          break;
        case 'logLevel':
          aVal = a.logLevel.toLowerCase();
          bVal = b.logLevel.toLowerCase();
          break;
        case 'sourceApp':
          aVal = a.sourceApp.toLowerCase();
          bVal = b.sourceApp.toLowerCase();
          break;
        case 'traceId':
          aVal = (a.traceId || '').toLowerCase();
          bVal = (b.traceId || '').toLowerCase();
          break;
        case 'message':
          aVal = a.message.toLowerCase();
          bVal = b.message.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Update data provider when logs or sorting changes
  useEffect(() => {
    if (logs.length > 0) {
      const tableData: TableLog[] = logs.map((log, index) => ({
        id: log._id || index.toString(),
        timestamp: formatTimestamp(log.date),
        logLevel: log.logLevel,
        traceId: log.traceId || 'N/A',
        sourceApp: log.sourceApp || 'Unknown',
        message: log.message,
      }));

      const sortedData = sortData(tableData);
      
      const newDataProvider = new MutableArrayDataProvider<string, TableLog>(
        sortedData,
        { 
          keyAttributes: 'id'
        }
      );
      
      setDataProvider(newDataProvider);
    } else {
      setDataProvider(null);
    }
  }, [logs, sortColumn, sortDirection]);

  // Add click handlers to headers after table renders
  useEffect(() => {
    const timer = setTimeout(() => {
      const table = document.getElementById('logsTable');
      if (table) {
        const headerCells = table.querySelectorAll('th');
        
        headerCells.forEach((cell, index) => {
          const columnNames: SortableColumn[] = ['timestamp', 'logLevel', 'sourceApp', 'traceId', 'message'];
          const column = columnNames[index];
          
          if (column && cell) {
            const newCell = cell.cloneNode(true) as HTMLElement;
            cell.parentNode?.replaceChild(newCell, cell);
            
            newCell.addEventListener('click', () => {
              console.log('Header clicked:', column);
              handleSort(column);
            });
            
            newCell.style.cursor = 'pointer';
            newCell.style.userSelect = 'none';
          }
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [dataProvider, sortColumn, sortDirection]);

  const columns = {
    timestamp: {
      headerText: createHeaderText("Timestamp", "timestamp"),
      field: "timestamp",
      headerClassName: "oj-sm-only-hide",
      className: "oj-sm-only-hide",
      resizable: "enabled"
    },
    logLevel: {
      headerText: createHeaderText("Log Level", "logLevel"),
      field: "logLevel", 
      resizable: "enabled"
    },
    sourceApp: {
      headerText: createHeaderText("Source Application", "sourceApp"),
      field: "sourceApp",
      headerClassName: "oj-md-down-hide",
      className: "oj-md-down-hide", 
      resizable: "enabled"
    },
    traceId: {
      headerText: createHeaderText("Trace ID", "traceId"),
      field: "traceId",
      headerClassName: "oj-lg-down-hide",
      className: "oj-lg-down-hide", 
      resizable: "enabled"
    },
    message: {
      headerText: createHeaderText("Message", "message"),
      field: "message",
      resizable: "enabled"
    }
  };

  const selectionMode = {
    row: "multiple" as const,
    column: "multiple" as const
  };

  const scrollPolicyOptions = {
    fetchSize: 10
  };

  return (
    <div class="oj-web-applayout-page" style="padding: 40px;">
      <h1 class="oj-typography-heading-lg" style="margin: 0;">
        Dashboard
      </h1>
      
      <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #374151;">
            Application Logs ({logs.length})
          </h2>
        </div>
        
        {logs.length === 0 ? (
          <div style="padding: 40px; text-align: center; color: #6b7280;">
            <p style="margin: 0; font-size: 1rem;">No logs available</p>
          </div>
        ) : dataProvider ? (
          <div style="padding: 20px;">
            <oj-c-table
              id="logsTable"
              aria-label="Application Logs Table"
              data={dataProvider}
              columns={columns}
              // selectionMode={selectionMode}
              scrollPolicyOptions={scrollPolicyOptions}
              class="demo-table-container"
              style="width: 100%; min-height: 400px;"
            ></oj-c-table>
          </div>
        ) : null}
      </div>
      
      {logs.length > 0 && (
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 0.875rem; color: #6b7280;">
          <p style="margin: 0;">
            Showing {logs.length} log{logs.length !== 1 ? 's' : ''} • 
            Last updated: {new Date().toLocaleTimeString()} •
            {sortColumn && sortDirection && (
              <span> Sorted by {sortColumn} ({sortDirection === 'asc' ? 'ascending' : 'descending'})</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};