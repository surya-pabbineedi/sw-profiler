import { Report } from './report.model';

export interface App {
  id: string;
  name: string;

  acronym: string;
  description: string;

  layout: any[];
  fields: any[];
  workspaces: any[];
  reports?: Report[];

  createdDate: any;
  modifiedDate: any;

  timeSpentFieldId?: string;
  trackingFieldId: string;

  version: number | null;
  uid: string;
}
