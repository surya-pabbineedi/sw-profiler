import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxUIModule, IconModule } from '@swimlane/ngx-ui';
import { Subject } from 'rxjs';
import { DashboardCardTypes } from 'src/common/enums/dashboard-card-type.enum';
import { ProfilerStore } from 'src/common/store/profiler.store';

export enum DateFilterLabels {
  allTime = 'All Time',
  today = 'Today',
  yesterday = 'Yesterday',
  thisWeek = 'This Week',
  lastWeek = 'Last Week',
  thisMonth = 'This Month',
  lastMonth = 'Last Month',
  thisQuarter = 'This Quarter',
  lastQuarter = 'Last Quarter',
  thisYear = 'This Year',
  lastYear = 'Last Year'
}

export const StatMeasures = {
  SummaryStatistics: 'Summary Statistics',
  ExecutionsOverTime: 'Executions Over Time',
  TotalTimeSavings: 'Total Time Saved',
  TotalCostSavings: 'Total Cost Saved',
  TotalExecutionDuration: 'Total Execution Duration'
};

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'app-dashboard-card-summary',
  templateUrl: './dashboard-card-summary.component.html',
  styleUrls: ['./dashboard-card-summary.component.scss'],
  imports: [CommonModule, NgxUIModule, NgxDatatableModule, HttpClientModule, IconModule]
})
export class DashboardCardSummaryComponent {
  @Input() context: any;

  destroy$ = new Subject();
  codeOptions = {
    mode: {
      name: 'htmlmixed',
      version: 3,
      singleLineStringErrors: false
    },
    readOnly: true,
    lineNumbers: true,
    theme: 'dracula'
  };

  DateFilterLabels = DateFilterLabels;
  StatMeasures = StatMeasures;

  applicationsMap$ = this.store.selectApplicationsMap$;

  get isHtml() {
    return this.context?.item?.cardType?.toLowerCase() === DashboardCardTypes.Html.toLowerCase();
  }

  get isUsageStatistic() {
    return this.context?.item?.cardType?.toLowerCase() === DashboardCardTypes.UsageStatistic.toLowerCase();
  }

  constructor(private readonly store: ProfilerStore) {}
}
