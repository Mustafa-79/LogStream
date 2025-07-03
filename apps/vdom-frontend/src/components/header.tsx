/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import { h } from "preact";
import { useRef, useState, useEffect } from "preact/hooks";
import * as ResponsiveUtils from "ojs/ojresponsiveutils";
import "ojs/ojtoolbar";
import "ojs/ojmenu";
import "ojs/ojbutton";
import "oj-c/button";

type Props = Readonly<{
  appName: string,
  userLogin: string,
  onLogout?: () => void,
  onToggleDrawer: () => void,
  isAuthenticated?: boolean
}>;

export function Header({ appName, userLogin, onLogout,  onToggleDrawer, isAuthenticated = false }: Props) {
  const mediaQueryRef = useRef<MediaQueryList>(window.matchMedia(ResponsiveUtils.getFrameworkQuery("sm-only")!));
  
  const [isSmallWidth, setIsSmallWidth] = useState(mediaQueryRef.current.matches);

  useEffect(() => {
    mediaQueryRef.current.addEventListener("change", handleMediaQueryChange);
    return (() => mediaQueryRef.current.removeEventListener("change", handleMediaQueryChange));
  }, [mediaQueryRef]);

  function handleMediaQueryChange(e: MediaQueryListEvent) {
    setIsSmallWidth(e.matches);
  }

  function getDisplayType() {
    return (isSmallWidth ? "icons" : "all");
  };

  function getEndIconClass() {
    return (isSmallWidth ? "oj-icon demo-appheader-avatar" : "oj-component-icon oj-button-menu-dropdown-icon");
  }

  function handleMenuAction(event: any) {
    const value = event.detail.selectedValue;
    if (value === 'out' && onLogout) {
      onLogout();
    }
  }

  return (
    <header role="banner" class="oj-web-applayout-header">
      <div class="oj-flex-bar oj-sm-align-items-center" style="width: 100%;">
        <div class="oj-flex-bar-start" style="padding-left: 0; margin-left: 0;">
          <oj-c-button display="icons" onojAction={onToggleDrawer} label="Toggle Menu">
            <span slot="startIcon" className="oj-ux-ico-menu"></span>
          </oj-c-button>
        </div>
        <div class="oj-flex-bar-middle oj-sm-align-items-baseline oj-web-applayout-max-width">
        {/* <img class="oj-icon demo-oracle-icon"
              title="Oracle Logo"
              alt="Oracle Logo"/> */}
          <h6 class="oj-typography-heading-sm oj-sm-margin-0">LogStream</h6>
        </div>
        <div class="oj-flex-bar-end" style="padding-right: 0; margin-right: 0;">
        <oj-toolbar>
          <oj-menu-button id="userMenu" display={getDisplayType()} chroming="borderless">
            <span>{userLogin}</span>
            <span slot="endIcon" class={getEndIconClass()}></span>
            <oj-menu id="menu1" slot="menu" onojMenuAction={handleMenuAction}>
              <oj-option id="out" value="out">Sign Out</oj-option>
            </oj-menu>
          </oj-menu-button>
        </oj-toolbar>
        </div>
      </div>
    </header>
  );  
}
