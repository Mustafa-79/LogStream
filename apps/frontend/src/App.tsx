import { useLocation } from 'react-router-dom';
import './App.css'
import ThemeRoutes from './routes'

function App() {

  const location = useLocation();
  // const authed = isAuthenticated();

  // // Allow unauthenticated users to access /login and /analytics only
  // if (!authed && location.pathname !== "/login" && location.pathname !== "/analytics") {
  //   return <Navigate to="/login" replace />;
  // }

  // // Prevent authenticated users from seeing the login page
  // if (authed && location.pathname === "/login") {
  //   return <Navigate to="/dashboard" replace />;
  // }

  return <ThemeRoutes />;
}

export default App