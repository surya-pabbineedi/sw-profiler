import { HttpClientModule } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { NgxUIModule, IconModule } from '@swimlane/ngx-ui';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { Workspace } from 'src/common/models/workspace.model';
import { Dashboard, DashboardItem, ReportCard } from 'src/common/models/dashboard.model';
import { Report } from 'src/common/models/report.model';
import { App } from 'src/common/models/application.model';
import { DashboardCardTypes } from 'src/common/enums/dashboard-card-type.enum';
import { ProfilerStore } from 'src/common/store/profiler.store';
import { ReportSummaryComponent } from '../entity-summary/report-summary/report-summary.component';
import { DashboardCardSummaryComponent } from '../entity-summary/dashboard-card-summary/dashboard-card-summary.component';
import { Subject, takeUntil } from 'rxjs';
import { NavigationStore } from 'src/common/store/navigation.store';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgxUIModule,
    NgxDatatableModule,
    HttpClientModule,
    IconModule,
    ReportSummaryComponent,
    DashboardCardSummaryComponent
  ],
  selector: 'app-list-dashboards',
  templateUrl: './list-dashboards.component.html',
  styleUrls: ['./list-dashboards.component.scss']
})
export class ListDashboardsComponent implements OnDestroy {
  @Input() dashboards!: Dashboard[];
  @Input() apps!: App[];
  @Input() reports!: Report[];

  @Input()
  public set workspace(v: Workspace) {
    this.activeWorkspaceDashboards = this.dashboards.filter(dashboard =>
      (v.dashboards as string[]).includes(dashboard.id)
    );

    this.dashboardDetail = this.activeWorkspaceDashboards.reduce((acc, dashboard: Dashboard) => {
      acc[dashboard.id] = {
        [DashboardCardTypes.Report]: dashboard.items.filter(
          item => item.cardType.toLowerCase() === DashboardCardTypes.Report.toLowerCase()
        ),
        [DashboardCardTypes.Html]: dashboard.items.filter(
          item => item.cardType.toLowerCase() === DashboardCardTypes.Html.toLowerCase()
        ),
        [DashboardCardTypes.UsageStatistic]: dashboard.items.filter(
          item => item.cardType.toLowerCase() === DashboardCardTypes.UsageStatistic.toLowerCase()
        )
      };

      return acc;
    }, {});
  }

  @ViewChild('listDashboards', { static: false })
  listDashboards!: DatatableComponent;
  @ViewChild('tmplReportSummary', { static: false }) tmplReportSummary!: TemplateRef<any>;
  @ViewChild('tmplDashboardIemSummary', { static: false }) tmplDashboardIemSummary!: TemplateRef<any>;

  destroy$ = new Subject();

  ColumnMode = ColumnMode;
  DashboardCardTypes = DashboardCardTypes;

  activeWorkspaceDashboards: any[] = [];
  dashboardDetail!: { [key: string]: any[] };
  reportsMap: { [key: string]: Report } = {};

  constructor(private readonly store: ProfilerStore, private readonly navStore: NavigationStore) {}

  ngOnInit() {
    this.store.selectReportsMap$.pipe(takeUntil(this.destroy$)).subscribe(reportsMap => {
      this.reportsMap = reportsMap;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(undefined);
  }

  toggleExpandRow(row: any) {
    this.listDashboards.rowDetail.toggleExpandRow(row);
  }

  async handleDashboardItemClick(incomingEvent: Event, item: DashboardItem) {
    incomingEvent.preventDefault();
    incomingEvent.stopPropagation();

    if (item.cardType.toLowerCase() === DashboardCardTypes.Report) {
      this.navStore.showReportSummary$({
        tmplReportSummary: this.tmplReportSummary,
        reportId: (item as ReportCard).reportId
      });

      return;
    }

    this.navStore.showDashboardItemSummary$({
      template: this.tmplDashboardIemSummary,
      item
    });
  }
}
