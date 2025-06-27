/**
 * @license
 * Oracle Universal Permissive License (UPL)
 */
import * as ko from "knockout";
import * as ResponsiveUtils from "ojs/ojresponsiveutils";
import * as ResponsiveKnockoutUtils from "ojs/ojresponsiveknockoututils";
import CoreRouter = require("ojs/ojcorerouter");
import ModuleRouterAdapter = require("ojs/ojmodulerouter-adapter");
import KnockoutRouterAdapter = require("ojs/ojknockoutrouteradapter");
import UrlParamAdapter = require("ojs/ojurlparamadapter");
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");
import "ojs/ojknockout";
import "ojs/ojmodule-element";
import Context = require("ojs/ojcontext");

export interface Log {
  _id: string;
  message: string;
  log_level: string;
  trace_id: string;
  date: string;
}

interface CoreRouterDetail {
  label: string;
  iconClass: string;
}

class RootViewModel {
  manner = ko.observable("polite");
  message = ko.observable<string | undefined>();
  smScreen: ko.Observable<boolean> | undefined;

  moduleAdapter: ModuleRouterAdapter<CoreRouterDetail>;
  selection: KnockoutRouterAdapter<CoreRouterDetail>;
  navDataProvider: ArrayDataProvider<string, CoreRouter.CoreRouterState<CoreRouterDetail>>;

  appName = ko.observable("App Name");
  userLogin = ko.observable("john.hancock@oracle.com");

  footerLinks: Array<object>;

  // ✅ Logs-related fields
  logsArray: Log[] = [];
  logsDataProvider = ko.observable<MutableArrayDataProvider<string, Log>>(
    new MutableArrayDataProvider<string, Log>([], { keyAttributes: '_id' })
  );
  isPaused = ko.observable(false);
  latestDate: string | null = null;
  intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Responsive layout setup
    const smQuery = ResponsiveUtils.getFrameworkQuery("sm-only");
    if (smQuery) {
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
    }

    // Routing
    const navData = [
      { path: "", redirect: "dashboard" },
      { path: "dashboard", isDefault: true, detail: { label: "Dashboard", iconClass: "oj-ux-ico-bar-chart" } },
      { path: "application", detail: { label: "Applications", iconClass: "oj-ux-ico-apps" } }, 
      { path: "incidents", detail: { label: "Incidents", iconClass: "oj-ux-ico-fire" } },
      { path: "customers", detail: { label: "Customers", iconClass: "oj-ux-ico-contact-group" } },
      { path: "about", detail: { label: "About", iconClass: "oj-ux-ico-information-s" } }
    ];
    const router = new CoreRouter(navData, { urlAdapter: new UrlParamAdapter() });
    router.sync();

    this.moduleAdapter = new ModuleRouterAdapter(router);
    this.selection = new KnockoutRouterAdapter(router);
    this.navDataProvider = new ArrayDataProvider(navData.slice(1), { keyAttributes: "path" });

    this.footerLinks = [
      { name: "About Oracle", linkId: "aboutOracle", linkTarget: "http://www.oracle.com/us/corporate/index.html#menu-about" },
      { name: "Contact Us", id: "contactUs", linkTarget: "http://www.oracle.com/us/corporate/contact/index.html" },
      { name: "Legal Notices", id: "legalNotices", linkTarget: "http://www.oracle.com/us/legal/index.html" },
      { name: "Terms Of Use", id: "termsOfUse", linkTarget: "http://www.oracle.com/us/legal/terms/index.html" },
      { name: "Your Privacy Rights", id: "yourPrivacyRights", linkTarget: "http://www.oracle.com/us/legal/privacy/index.html" }
    ];

    // 👇 Start log fetching
    this.fetchNewLogs();
    this.intervalId = setInterval(() => {
      if (!this.isPaused()) {
        this.fetchNewLogs();
      }
    }, 5000);

    Context.getPageContext().getBusyContext().applicationBootstrapComplete();
  }

  fetchNewLogs = async () => {
    try {
      const url = `http://localhost:3000/api/logs/new${this.latestDate ? `?since=${encodeURIComponent(this.latestDate)}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      const newLogs: Log[] = json.data;
      console.log('New logs:', newLogs);

      if (newLogs.length > 0) {
        this.logsArray = [...this.logsArray, ...newLogs];
        this.logsDataProvider(
          new MutableArrayDataProvider<string, Log>(this.logsArray, { keyAttributes: '_id' })
        );
        console.log("logsDataProvider updated:", this.logsDataProvider().data);
        this.latestDate = newLogs[newLogs.length - 1].date;
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  togglePause = () => {
    this.isPaused(!this.isPaused());
  };
}

export default new RootViewModel();
