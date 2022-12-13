import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from 'src/common/models/application.model';
import { Report } from 'src/common/models/report.model';
import { LayoutType } from 'src/common/enums/layout-type.enum';
import { ReportSummaryComponent } from '../report-summary/report-summary.component';
import { TaskSummaryComponent } from '../task-summary/task-summary.component';
import { LayoutSummaryComponent } from '../layout-summary/layout-summary.component';
import { NgxUIModule } from '@swimlane/ngx-ui';
import { NavigationStore } from 'src/common/store/navigation.store';

@Component({
  selector: 'app-application-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    NgxUIModule,
    ReportSummaryComponent,
    TaskSummaryComponent,
    LayoutSummaryComponent,
    ApplicationSummaryComponent
  ],
  template: `
    <ngx-toolbar *ngIf="showToolbar" [mainTitle]="app.name">
      <ngx-toolbar-content>
        <ngx-button class="btn btn-link dialog-close" (click)="close.next()">
          <ngx-icon fontIcon="x"></ngx-icon>
        </ngx-button>
      </ngx-toolbar-content>
    </ngx-toolbar>

    <section class="application-summary">
      <div class="application-summary__content">
        <div class="application-summary__content__fields__container" *ngIf="app.fields?.length > 0">
          <h3>Fields ({{ app.fields.length }}):</h3>
          <div class="scrollable">
            <table class="table striped">
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Field Type</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let field of app.fields">
                  <td>
                    {{ field.name }}

                    <ng-container
                      *ngIf="field.fieldType.toLowerCase() === 'reference' && appsEntities[field.targetId]?.app"
                    >
                      (<a
                        href="javascript:void(0)"
                        (click)="handleAppClick($event, appsEntities[field.targetId].app)"
                        >{{ appsEntities[field.targetId]?.app.name }}</a
                      >)
                    </ng-container>
                  </td>
                  <td>{{ field.fieldType | titlecase }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="application-summary__content__layouts__container"
          *ngIf="appsEntities[app.id]?.flattenedLayouts as flattenedLayouts"
        >
          <h3>Layouts ({{ flattenedLayouts.length }}):</h3>
          <div class="scrollable">
            <table class="table striped">
              <thead>
                <tr>
                  <th>Layout Name</th>
                  <th>Layout Type</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let layoutItem of flattenedLayouts">
                  <td>
                    <a href="javascript:void(0)" (click)="handleLayoutClick($event, layoutItem)">{{
                      layoutItem.name
                    }}</a>
                  </td>
                  <td>{{ layoutItem.layoutType | titlecase }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="application-summary__content__workflow__container"
          *ngIf="appsEntities[app.id].workflow as workflow"
        >
          <h3>Workflow:</h3>
          <ul>
            <li>Stages: {{ workflow.stages?.length || 0 }}</li>
          </ul>
        </div>

        <div class="application-summary__content__reports__container" *ngIf="appsEntities[app.id].reports?.length > 0">
          <h3>Reports ({{ appsEntities[app.id].reports.length }}):</h3>
          <ul>
            <li *ngFor="let report of appsEntities[app.id].reports">
              <a href="javascript:void(0)" (click)="handleReportClick($event, report)">
                {{ report.name }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <ng-template #tmplReportSummary let-context="context">
      <app-report-summary [context]="context"></app-report-summary>
    </ng-template>

    <ng-template #tmplTaskSummary let-context="context">
      <app-task-summary [context]="context"></app-task-summary>
    </ng-template>

    <ng-template #tmplLayoutSummary let-context="context">
      <app-layout-summary [context]="context"></app-layout-summary>
    </ng-template>

    <ng-template #tmplAppSummary let-context="context">
      <app-application-summary
        [app]="context.app"
        [appsEntities]="context.appsEntities"
        [showToolbar]="context.showToolbar"
        (close)="context.close()"
      ></app-application-summary>
    </ng-template>
  `,
  styleUrls: ['./application-summary.component.scss']
})
export class ApplicationSummaryComponent {
  @Input() app!: App;
  @Input() appsEntities!: { [key: string]: any };
  @Input() showToolbar: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() reportClick = new EventEmitter<Report>();
  @Output() layoutClick = new EventEmitter<any>();

  @ViewChild('tmplReportSummary', { static: false }) tmplReportSummary!: TemplateRef<any>;
  @ViewChild('tmplTaskSummary', { static: false }) tmplTaskSummary!: TemplateRef<any>;
  @ViewChild('tmplLayoutSummary', { static: false }) tmplLayoutSummary!: TemplateRef<any>;
  @ViewChild('tmplAppSummary', { static: false }) tmplAppSummary!: TemplateRef<any>;

  constructor(private readonly navStore: NavigationStore) {}

  preventDefault(incomingEvent: Event) {
    incomingEvent.preventDefault();
    incomingEvent.stopPropagation();
  }

  handleReportClick(incomingEvent: Event, report: Report) {
    this.preventDefault(incomingEvent);

    this.navStore.showReportSummary$({
      reportId: report.id,
      tmplReportSummary: this.tmplReportSummary
    });
  }

  handleLayoutClick(incomingEvent: Event, item: any) {
    this.preventDefault(incomingEvent);

    let isTask = item.layoutType.toLowerCase() === LayoutType.INTEGRATION.toLowerCase();

    if (isTask) {
      this.navStore.showTaskSummary$({
        taskId: item.taskId,
        template: this.tmplTaskSummary
      });

      return;
    }

    this.navStore.showLayoutSummary$({
      item,
      template: this.tmplLayoutSummary
    });
  }

  handleAppClick(incomingEvent: Event, app: App) {
    this.preventDefault(incomingEvent);

    this.navStore.showAppSummary$({
      appId: app.id,
      template: this.tmplAppSummary
    });
  }
}
