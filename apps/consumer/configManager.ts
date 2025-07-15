import Application from './models/Application';

interface AppConfig {
  threshold: number;
  period: number;
}

class ConfigManager {
  private configs: Map<string, AppConfig> = new Map();

  constructor() {
    this.loadConfigs();
  }

  private async loadConfigs() {
    try {
      const applications = await Application.find({ active: true, deleted: false });
      
      this.configs.clear();
      applications.forEach(app => {
        this.configs.set(String(app._id), {
          threshold: app.threshold,
          period: app.timePeriod
        });
      });

      console.log(`Loaded ${this.configs.size} app configs from MongoDB`);
    } catch (error) {
      console.error('Error loading configs:', error);
    }
  }

  public getConfig(appId: string): AppConfig | undefined {
    return this.configs.get(appId);
  }
}

export const configManager = new ConfigManager();
export const getConfig = (appId: string) => configManager.getConfig(appId);
