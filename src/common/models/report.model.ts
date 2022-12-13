export interface Report {
  id: string;
  name: string;
  createdDate: any;
  modifiedDate: any;

  // ICreatedModifiedUser
  createdByUser: any;
  modifiedByUser: any;

  // IAllowed
  allowed: any[];

  groupBys: any[];
  aggregates: any[];
  applicationIds: string[];

  keywords: string;

  columns: string[];
  sorts: any;
  filters: any[];

  pageSize: number; // integer
  offset: number; // integer
  defaultSearchReport: boolean;

  newName?: string;
  applicationId?: string;

  canEdit?: boolean;
  canDelete?: boolean;
  canRead?: boolean;

  version?: number;
  uid?: string;
  scheduledReports?: [];
}
