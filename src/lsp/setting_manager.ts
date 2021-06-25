export interface ExampleSettings {
  maxNumberOfProblems: number;
}

const defaultSettings: ExampleSettings = {
  maxNumberOfProblems: 1000,
};

export class SettingManager {
  hasConfigurationCapability: boolean
  globalSettings: ExampleSettings = defaultSettings;
  documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

  onGetConfiguration?: (resource: string) => Thenable<ExampleSettings>;

  constructor(hasConfigurationCapability: boolean) {
    this.hasConfigurationCapability = hasConfigurationCapability
  }

  getDocumentSetting(resource: string): Thenable<ExampleSettings> {
    if (!this.hasConfigurationCapability)
      return Promise.resolve(this.globalSettings);

    let result = this.documentSettings.get(resource);
    if (!result) {
      result = this.onGetConfiguration!(resource);
      this.documentSettings.set(resource, result);
    }
    return result;
  }

  deleteSetting(uri: string) {
    this.documentSettings.delete(uri)
  }
  
  configurationChange(newGlobalSetting: ExampleSettings | undefined) {
    if (this.hasConfigurationCapability) this.documentSettings.clear();
    else this.globalSettings = newGlobalSetting || defaultSettings;
  }
}
