import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Log, TableLog, SortableColumn, SortDirection, Pagination, LogTableProps } from "./types";
import { convertLogsToTableFormat, sortTableData, createHeaderText } from "../../../utils/logUtils";
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider');
import 'oj-c/table';
import 'oj-c/progress-circle';

export function LogTable({ logs, pagination, loading = false, onSort }: LogTableProps) {
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('default');
  const [dataProvider, setDataProvider] = useState<any>(null);

  const handleSort = (column: SortableColumn) => {
    let newDirection: 'asc' | 'desc' | 'default' | null;
    let newColumn: SortableColumn | null;

    if (sortColumn === column) {
      if (sortDirection === 'default' || sortDirection === null) {
        newDirection = 'asc';
        newColumn = column;
      } else if (sortDirection === 'asc') {
        newDirection = 'desc';
        newColumn = column;
      } else {
        // Going back to default
        newDirection = 'default';
        newColumn = null;
      }
    } else {
      newDirection = 'asc';
      newColumn = column;
    }

    setSortColumn(newColumn);
    setSortDirection(newDirection);

    // ✅ Avoid forcing fallback to timestamp. Reset to undefined.
    if (onSort) {
      if (newDirection === 'default' || newColumn === null) {
        console.log("Resetting sort to default");
        onSort(undefined, 'default'); 
      } else {
        onSort(newColumn, newDirection);
      }
    }
  };


  useEffect(() => {
    if (logs.length > 0) {
      const tableData: TableLog[] = convertLogsToTableFormat(logs);
      
      const newDataProvider = new MutableArrayDataProvider<string, TableLog>(
        tableData, 
        { 
          keyAttributes: 'id'
        }
      );
      
      setDataProvider(newDataProvider);
    } else {
      setDataProvider(null);
    }
  }, [logs]);

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
      headerText: createHeaderText("Timestamp", "timestamp", sortColumn, sortDirection),
      field: "timestamp",
      headerClassName: "oj-sm-only-hide",
      className: "oj-sm-only-hide",
      resizable: "enabled"
    },
    logLevel: {
      headerText: createHeaderText("Log Level", "logLevel", sortColumn, sortDirection),
      field: "logLevel", 
      resizable: "enabled"
    },
    sourceApp: {
      headerText: createHeaderText("Source Application", "sourceApp", sortColumn, sortDirection),
      field: "sourceApp",
      headerClassName: "oj-md-down-hide",
      className: "oj-md-down-hide", 
      resizable: "enabled"
    },
    traceId: {
      headerText: createHeaderText("Trace ID", "traceId", sortColumn, sortDirection),
      field: "traceId",
      headerClassName: "oj-lg-down-hide",
      className: "oj-lg-down-hide", 
      resizable: "enabled"
    },
    message: {
      headerText: createHeaderText("Message", "message", sortColumn, sortDirection),
      field: "message",
      resizable: "enabled"
    }
  };

  const scrollPolicyOptions = {
    fetchSize: 10
  };

  const getSortDisplayText = () => {
    if (!sortColumn || !sortDirection || sortDirection === 'default') {
      return null;
    }
    
    return `${sortColumn} (${sortDirection === 'asc' ? 'ascending' : 'descending'})`;
  };

  return (
    <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
        <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #374151;">
          Total Application Logs ({pagination.totalCount})
          {loading && (
            <span style="margin-left: 16px; display: inline-flex; align-items: center; color: #6b7280; font-size: 0.875rem; font-weight: 400;">
              <oj-c-progress-circle
                size="sm"
                value={-1}
                style="width: 16px; height: 16px; margin-right: 8px;"
              ></oj-c-progress-circle>
              Loading...
            </span>
          )}
        </h2>
      </div>
      
      {loading ? (
        <div style="padding: 60px; text-align: center; color: #6b7280;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
            <oj-c-progress-circle
              size="lg"
              value={-1}
              style="width: 48px; height: 48px;"
            ></oj-c-progress-circle>
            <p style="margin: 0; font-size: 1rem;">Loading logs...</p>
          </div>
        </div>
      ) : logs.length === 0 ? (
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
            scrollPolicyOptions={scrollPolicyOptions}
            class="demo-table-container"
            style="width: 100%; min-height: 400px;"
          ></oj-c-table>
        </div>
      ) : null}

      {/* Sort Info */}
      {logs.length > 0 && getSortDisplayText() && !loading && (
        <div style="padding: 12px 20px; border-top: 1px solid #e5e7eb; background: #f8fafc; color: #64748b; font-size: 0.875rem;">
          Sorted by {getSortDisplayText()}
        </div>
      )}
    </div>
  );
}
