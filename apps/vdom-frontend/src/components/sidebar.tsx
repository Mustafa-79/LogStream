
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import "oj-c/drawer-layout";
import "ojs/ojnavigationlist";

type SidebarProps = {
  children?: any;
  isOpen: boolean;
};

export function Sidebar({ children, isOpen }: SidebarProps) {
  console.log('Sidebar render, isOpen:', isOpen);
  const drawerRef = useRef<any>(null);

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

        <oj-navigation-list>
          <ul>
            <li><a href="#">Dashboard</a></li>
            <li><a href="#">Analytics</a></li>
            <li><a href="#">Applications</a></li>
            <li><a href="#">User Groups</a></li>
          </ul>
        </oj-navigation-list>
      </div>

      {/* Main Content Area */}
      <div className="oj-md-padding-2x">
        {/* This is where the main content will be rendered */}
        {children}
      </div>
    </oj-c-drawer-layout>

  );
}