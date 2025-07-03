
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import "oj-c/drawer-layout";
import "ojs/ojnavigationlist";
import { RouteConfig } from "./router";

type SidebarProps = {
  children?: any;
  routes: RouteConfig[];
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
};

export function Sidebar({ children, isOpen, routes, currentPath, onNavigate }: SidebarProps) {
  console.log('Sidebar render, isOpen:', isOpen);
  const drawerRef = useRef<any>(null);

  const isActive = (routePath: string) => {
    // Exact match for all routes
    return currentPath === routePath;
  };

  useEffect(() => {
    if (drawerRef.current) {
      drawerRef.current.startOpened = isOpen;
    }
  }, [isOpen]);

  return (
    <oj-c-drawer-layout ref={drawerRef} startOpened={isOpen}>
      {/* Drawer/Sidebar */}
      <div slot="start" className="demo-drawer-start" style="width: 280px; min-width: 280px;">
        <div className="demo-drawer-header oj-sm-padding-2x">
          <h6 class="oj-typography-heading-sm oj-sm-margin-0">LogStream</h6>
        </div>

        {/* <oj-navigation-list>
          <ul>
            <li><a href="#">Dashboard</a></li>
            <li><a href="#">Analytics</a></li>
            <li><a href="#">Applications</a></li>
            <li><a href="#">User Groups</a></li>
          </ul>
        </oj-navigation-list> */}
        {routes.map((routeItem) => {
          const active = isActive(routeItem.path);

          return (
            <oj-button
              key={routeItem.path}
              chroming={active ? "callToAction" : "outlined"}
              onojAction={() => onNavigate(routeItem.path)}
              style={`
                  border-radius: 8px !important;
                  padding: 8px 16px !important;
                  font-family: 'Poppins', sans-serif !important;
                  font-weight: 500 !important;
                  ${active
                  ? '--oj-button-bg-color: #6366f1 !important; --oj-button-text-color: white !important; border: none !important;'
                  : '--oj-button-bg-color: transparent !important; --oj-button-text-color: #64748b !important; border: 1px solid transparent !important;'
                }
                  transition: all 0.2s ease !important;
                `}
            >
              <span
                slot="startIcon"
                class={routeItem.icon}
                style="margin-right: 6px;"
              ></span>
              {routeItem.label}
            </oj-button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="oj-md-padding-2x">
        {/* This is where the main content will be rendered */}
        {children}
      </div>
    </oj-c-drawer-layout>

  );
}