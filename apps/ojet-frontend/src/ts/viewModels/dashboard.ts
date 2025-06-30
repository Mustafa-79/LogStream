import * as ko from 'knockout';
import rootVM from '../appController';

class DashboardViewModel {
  logsDataProvider = ko.pureComputed(() => rootVM.logsDataProvider());
  isPaused = rootVM.isPaused;

  togglePause = () => {
    rootVM.togglePause();
  };

  disconnected() {
    if (rootVM.intervalId) {
      clearInterval(rootVM.intervalId);
    }
  }
}

export = DashboardViewModel;
