import { DashboardCardTypes } from '../enums/dashboard-card-type.enum';

export interface Dashboard {
  id: string;
  name: string;
  createdDate: any;

  // IModifiedTimeStamp
  modifiedDate: any;

  // ICreatedModifiedUser
  createdByUser: any;
  modifiedByUser: any;

  items: DashboardItem[];
  workspaces: string[];
  allowed: boolean;

  description: string;
  autoRefreshMilliseconds?: number;
  timelineEnabled: boolean;
  minTimelineDate: any;
  maxTimelineDate: any;

  version?: number;
  uid?: string;
  scheduledReports?: [];
  $meta: any;
}

export interface IDashboardItem {
  id: string;
  name: string;
  description: string;

  row: number; // integer
  col: number; // integer

  sizeX: number; // integer
  sizeY: number; // integer

  autoRefreshMilliseconds?: number; // integer
}

export interface ReportCard extends IDashboardItem {
  cardType: DashboardCardTypes.Report;
  reportId: string;
}

export interface HtmlCard extends IDashboardItem {
  cardType: DashboardCardTypes.Html;
  src: string;
}

export interface UsageStatisticCard extends IDashboardItem {
  cardType: DashboardCardTypes.UsageStatistic;
  measure: any;
  dateFilter: string;
  appsFilter: string[];
  colorScheme: string;
}

export type DashboardItem = ReportCard | HtmlCard | UsageStatisticCard;
