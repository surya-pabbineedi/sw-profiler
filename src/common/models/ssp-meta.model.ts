export interface SSPEntity {
  uid: string;
  version: number;
  id: string;
  name: string;
  disabled: boolean;

  applicationId?: string;
}

export interface SSPMeta {
  entities: {
    Application: Array<SSPEntity>;
    Task: Array<SSPEntity>;
    Asset: Array<SSPEntity>;
    PackageDescriptor: Array<SSPEntity>;
    AvailableActionDescriptor: Array<SSPEntity>;
    AssetDescriptor: Array<SSPEntity>;
    Plugin: Array<SSPEntity>;
    Report: Array<SSPEntity>;
    Workflow: Array<SSPEntity>;
    Workspace: Array<SSPEntity>;
    Dashboard: Array<SSPEntity>;
  };
  swimlaneVersion: string;
}
