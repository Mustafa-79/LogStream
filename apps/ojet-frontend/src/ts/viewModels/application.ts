import * as ko from 'knockout';
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider');
import 'ojs/ojlistview';

type Application = {
  _id: string;
  name: string;
  description: string;
  threshold: number;
  timePeriod: number;
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
};

class ApplicationViewModel {
  applicationsArray: Application[] = [];
  applicationsDataProvider = ko.observable(
    new MutableArrayDataProvider<string, Application>([], { keyAttributes: '_id' })
  );

  constructor() {
    this.fetchApplications();
  }

  fetchApplications = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/application');
      const json = await response.json();

      const apps: Application[] = json.data;
      this.applicationsArray = apps;

      this.applicationsDataProvider(
        new MutableArrayDataProvider<string, Application>(apps, { keyAttributes: '_id' })
      );
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };
}

export = ApplicationViewModel;
