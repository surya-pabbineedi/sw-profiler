import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxUIModule } from '@swimlane/ngx-ui';
import { Workspace } from 'src/common/models/workspace.model';
import { ListApplicationsComponent } from '../../list-applications/list-applications.component';
import { ListDashboardsComponent } from '../../list-dashboards/list-dashboards.component';
import { Workflow } from 'src/common/models/workflow.model';
import { App } from 'src/common/models/application.model';
import { Report } from 'src/common/models/report.model';
import { Dashboard } from 'src/common/models/dashboard.model';

@Component({
  selector: 'app-workspace-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgxUIModule, ListApplicationsComponent, ListDashboardsComponent],
  template: `
    <ngx-toolbar *ngIf="showToolbar" [mainTitle]="workspace.name">
      <ngx-toolbar-content>
        <ngx-button class="btn btn-link dialog-close" (click)="close.next()">
          <ngx-icon fontIcon="x"></ngx-icon>
        </ngx-button>
      </ngx-toolbar-content>
    </ngx-toolbar>

    <ngx-tabs>
      <ngx-tab [label]="'Applications (' + workspace.applications?.length + ')'">
        <app-list-applications
          [apps]="apps"
          [workflows]="workflows"
          [reports]="reports"
          [workspace]="workspace"
        ></app-list-applications>
      </ngx-tab>
      <ngx-tab [label]="'Dashboards (' + workspace.dashboards?.length + ')'">
        <app-list-dashboards
          [dashboards]="dashboards"
          [apps]="apps"
          [reports]="reports"
          [workspace]="workspace"
        ></app-list-dashboards>
      </ngx-tab>
    </ngx-tabs>
  `
})
export class WorkspaceSummaryComponent {
  @Input() workspace!: Workspace;
  @Input() apps!: App[];
  @Input() dashboards!: Dashboard[];
  @Input() workflows!: Workflow[];
  @Input() reports!: Report[];

  @Input() showToolbar: boolean = false;

  @Output() close = new EventEmitter<void>();
}
