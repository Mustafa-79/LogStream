import { h } from "preact";
import "oj-c/button";
import { RouteConfig } from "./router";

interface NavigationProps {
  routes: RouteConfig[];
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Navigation({ routes, currentPath, onNavigate }: NavigationProps) {
  const isActive = (routePath: string) => {
    // Exact match for all routes
    return currentPath === routePath;
  };

  return (
    <nav class="oj-navigationlist-tabbar oj-md-margin-4x-bottom">
      <div class="oj-flex oj-justify-content-center">
        <div class="oj-flex" style="gap: 8px; background: #f8fafc; padding: 8px; border-radius: 12px; border: 1px solid #e2e8f0;">
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
      </div>
    </nav>
  );
}