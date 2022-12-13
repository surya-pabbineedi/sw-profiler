export interface Workspace {
  createdDate: Date;
  createdByUser: CreatedByUser;
  modifiedDate: Date;
  modifiedByUser: ModifiedByUser;
  dashboards?: any[];
  applications?: string[];
  permissions: any;
  uid: string;
  version: number;
  id: string;
  name: string;
  disabled: boolean;
}

export interface CreatedByUser {
  id: string;
  name: string;
}

export interface ModifiedByUser {
  id: string;
  name: string;
}
