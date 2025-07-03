
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
  const drawerRef = useRef<any>(null);

  const isActive = (routePath: string) => {
    return currentPath === routePath;
  };

  useEffect(() => {
    if (drawerRef.current) {
      drawerRef.current.startOpened = isOpen;
    }
  }, [isOpen]);

  return (
    <oj-c-drawer-layout ref={drawerRef} startOpened={isOpen}>
      <div slot="start" className="demo-drawer-start" style="width: 280px; min-width: 280px;">
        <oj-navigation-list selection={currentPath}>
          <ul>
            {routes.map((routeItem) => {
              const active = isActive(routeItem.path);

              return (
                <li
                  key={routeItem.path}
                >
                  <a 
                    href="#"
                    class={`oj-navigationlist-item oj-navigationlist-item-label`}
                    className={`oj-navigationlist-item oj-navigationlist-item-label`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(routeItem.path);
                    }}
                    style="display: flex; align-items: center; gap: 12px;"
                  >
                    {routeItem.icon && (
                      <span class={`oj-navigationlist-item-icon ${routeItem.icon}`}></span>
                    )}
                    <span>{routeItem.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </oj-navigation-list>

      </div>

      {/* Main Content Area */}
      <div className="oj-md-padding-2x">
        {children}
      </div>
    </oj-c-drawer-layout>

  );
}