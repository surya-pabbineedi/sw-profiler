import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgxUIModule, IconModule } from '@swimlane/ngx-ui';
import { Workspace } from 'src/common/models/workspace.model';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';

import { Report } from 'src/common/models/report.model';
import { App } from 'src/common/models/application.model';
import { firstValueFrom, take, tap } from 'rxjs';
import { LayoutType } from 'src/common/enums/layout-type.enum';
import { ProfilerStore } from 'src/common/store/profiler.store';
import { ReportSummaryComponent } from '../entity-summary/report-summary/report-summary.component';
import { TaskSummaryComponent } from '../entity-summary/task-summary/task-summary.component';
import { LayoutSummaryComponent } from '../entity-summary/layout-summary/layout-summary.component';
import { ApplicationSummaryComponent } from '../entity-summary/application-summary/application-summary.component';

@Component({
  selector: 'app-list-applications',
  templateUrl: './list-applications.component.html',
  styleUrls: ['./list-applications.component.scss'],
  standalone: true,
  imports: [
    NgxUIModule,
    NgxDatatableModule,
    HttpClientModule,
    IconModule,
    ReportSummaryComponent,
    TaskSummaryComponent,
    LayoutSummaryComponent,
    ApplicationSummaryComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ListApplicationsComponent {
  @Input() apps!: App[];
  @Input() workflows!: any[];
  @Input() reports!: Report[];

  @Input()
  public set workspace(v: Workspace) {
    this.activeWorkspaceApps = this.apps.filter(app => (v.applications as string[]).includes(app.id));
  }

  @ViewChild('listApplications', { static: false })
  listApplications!: DatatableComponent;

  activeWorkspaceApps: App[] = [];
  ColumnMode = ColumnMode;

  vm$ = this.store.vm$;
  appsMap$ = this.store.selectApplicationsMap$;
  appsEntities$ = this.store.selectAppsEntities$;

  constructor(private readonly store: ProfilerStore) {}

  toggleExpandRow(row: any) {
    this.listApplications.rowDetail.toggleExpandRow(row);
  }

  async getTask(id: string) {
    return await firstValueFrom(this.store.selectTask(id).pipe(take(1)));
  }

  async handleReportClick(incomingEvent: Event) {
    incomingEvent.preventDefault();
    incomingEvent.stopPropagation();
  }
}
