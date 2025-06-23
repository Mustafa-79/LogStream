import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function DashboardLayout() {
    return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden',
    }}>
      <Sidebar />
      <div style={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
      }}>
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout