import './App.css'
import ThemeRoutes from './routes'
import { useLocation, Navigate } from "react-router-dom";

function isAuthenticated() {
  const profileStr = localStorage.getItem("user_profile");
  if (!profileStr) return false;
  try {
    const profile = JSON.parse(profileStr);
    return profile.hd === "gosaas.io";
  } catch {
    return false;
  }
}

function App() {
  const location = useLocation();
  const authed = isAuthenticated();

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