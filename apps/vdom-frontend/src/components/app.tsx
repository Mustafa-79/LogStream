import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useEffect } from "preact/hooks";
import Context = require("ojs/ojcontext");

import { Footer } from "./footer";
import { Header } from "./header";
import { Applications } from "./pages/Applications/index";
import { Sidebar } from "./sidebar";
import { UserGroups } from "./pages/UserGroups/UserGroups";
import { Dashboard } from "./pages/Dashboard/index";
import { Login } from "./pages/Login/index";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAppState } from "../hooks/useAppState";
import { RouteConfig } from "./router";
import "oj-c/button";

type Props = Readonly<{
  appName?: string;
  userLogin?: string;
}>;

export const App = registerCustomElement(
  "app-root",
  ({ appName = "Log Stream", userLogin = "john.hancock@oracle.com" }: Props) => {
    
    const routes: RouteConfig[] = [
      {
        path: '/',
        component: () => (
          <ProtectedRoute 
            requireAuth={true}
            onRedirect={appState.actions.handleRedirect}
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
            onRedirect={appState.actions.handleRedirect}
          >
            <Applications logs={appState.logs} logCounts={appState.logCounts} />
          </ProtectedRoute>
        ),
        label: 'Applications',
        icon: 'oj-ux-ico-applications',
        requireAuth: true
      },
      {
        path: '/user-groups',
        component: () => (
          <ProtectedRoute 
            requireAuth={true}
            requireAdmin={true}
            onRedirect={appState.actions.handleRedirect}
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
        component: () => <Login loginSuccess={appState.actions.handleLoginSuccess} />,
        label: 'Login',
        icon: 'oj-ux-ico-login',
        requireAuth: false
      }
    ];

    const appState = useAppState({
      routes,
      defaultUserLogin: userLogin,
      appName
    });

    useEffect(() => {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    }, []);

    if (!appState.isInitialized) {
      return (
        <div id="appContainer" class="oj-web-applayout-page">
          <div class="oj-flex oj-justify-content-center oj-align-items-center" style="height: 100vh;">
            <span>Loading...</span>
          </div>
        </div>
      );
    }

    if (!appState.isAuthenticated) {
      return (
        <div id="appContainer" class="oj-web-applayout-page">
          <div style="transition: opacity 0.2s ease-in-out;">
            <Login loginSuccess={appState.actions.handleLoginSuccess} />
          </div>
        </div>
      );
    }

    return (
      <div id="appContainer" class="oj-web-applayout-page">
        <Header 
          appName={appState.appName}
          userLogin={appState.currentUser} 
          onToggleDrawer={appState.actions.toggleDrawer}
          onLogout={appState.actions.handleLogout}
          isAuthenticated={appState.isAuthenticated}
        />

        <Sidebar 
          isOpen={appState.isDrawerOpen}
          routes={appState.visibleRoutes}
          currentPath={appState.currentPath}
          onNavigate={appState.actions.navigate}
        >
          <div style="transition: opacity 0.2s ease-in-out;">
            {appState.currentComponent || (
              <ProtectedRoute 
                requireAuth={true} 
                onRedirect={appState.actions.handleRedirect}
              >
                <Dashboard />
              </ProtectedRoute>
            )}
          </div>
        </Sidebar>

        <Footer />
      </div>
    );
  }
);