import { Injectable, TemplateRef } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { DrawerService } from '@swimlane/ngx-ui';
import { pipe, withLatestFrom, tap, mergeMap, map } from 'rxjs';
import { DashboardCardTypes } from '../enums/dashboard-card-type.enum';
import { LayoutType } from '../enums/layout-type.enum';
import { ReportCard, DashboardItem, HtmlCard } from '../models/dashboard.model';
import { ProfilerStore } from './profiler.store';

export interface NavigationState {}

@Injectable()
export class NavigationStore extends ComponentStore<NavigationState> {
  readonly showWorkspaceSummary$ = this.effect<{
    workspaceId: string;
    template: TemplateRef<any>;
  }>(
    pipe(
      withLatestFrom(
        this.profilerStore.select(state => ({
          applications: state.applications,
          reports: state.reports,
          workflows: state.workflows,
          workspaces: state.workspaces,
          dashboards: state.dashboards
        }))
      ),
      tap(([value, { applications, reports, workspaces, workflows, dashboards }]) => {
        const { template, workspaceId } = value;
        const workspace = workspaces.find(a => a.id === workspaceId);

        const drawer = this.drawerService.create({
          template,
          size: 80,
          context: {
            title: workspace?.name,
            showToolbar: true,
            workspace,
            applications,
            reports,
            workflows,
            dashboards,
            close: () => {
              drawer.destroy();
            }
          },
          closeOnOutsideClick: true,
          isRoot: true
        });
      })
    )
  );

  readonly showAppSummary$ = this.effect<{
    appId: string;
    template: TemplateRef<any>;
  }>(
    pipe(
      withLatestFrom(
        this.profilerStore.select(state => ({
          applications: state.applications,
          appLayoutsFlattenedByAppId: state.appLayoutsFlattenedByAppId
        })),
        this.profilerStore.selectAppsEntities$
      ),
      tap(([value, { applications, appLayoutsFlattenedByAppId }, appsEntities]) => {
        const { template, appId } = value;
        const app = applications.find(a => a.id === appId);

        const drawer = this.drawerService.create({
          template,
          size: 80,
          context: {
            title: app?.name,
            showToolbar: true,
            app,
            appLayoutsFlattenedByAppId,
            appsEntities,
            close: () => {
              drawer.destroy();
            }
          },
          closeOnOutsideClick: true,
          isRoot: true
        });
      })
    )
  );

  readonly showReportSummary$ = this.effect<{
    reportId: string;
    tmplReportSummary: TemplateRef<any>;
  }>(
    pipe(
      withLatestFrom(
        this.profilerStore.select(state => ({
          applications: state.applications,
          dashboards: state.dashboards,
          reports: state.reports
        }))
      ),
      tap(([value, { applications, dashboards, reports }]) => {
        const { tmplReportSummary, reportId } = value;

        const report = reports.find(r => r.id === reportId);
        const reportApps = applications.filter(appItem => report?.applicationIds.includes(appItem.id));
        const reportDashboards = dashboards.filter(
          d =>
            d.items.filter(
              dItem =>
                dItem.cardType.toLowerCase() === DashboardCardTypes.Report &&
                (dItem as ReportCard).reportId === report?.id
            ).length > 0
        );

        const drawer = this.drawerService.create({
          template: tmplReportSummary,
          size: 80,
          context: {
            title: report?.name,
            fieldsMap: reportApps?.[0]?.fields.reduce((acc, field) => {
              acc[field.id] = field;
              return acc;
            }, {}),
            item: report,
            isTask: false,
            isWidget: false,
            isReport: true,
            reportApps,
            reportDashboards,
            close: () => {
              drawer.destroy();
            }
          },
          closeOnOutsideClick: true,
          isRoot: true
        });
      })
    )
  );

  readonly showDashboardItemSummary$ = this.effect<{
    item: DashboardItem;
    template: TemplateRef<any>;
  }>(
    pipe(
      tap(value => {
        const { template, item } = value;

        const drawer = this.drawerService.create({
          template,
          size: 80,
          context: {
            title: item.name,
            item,
            close: () => {
              drawer.destroy();
            }
          },
          closeOnOutsideClick: true,
          isRoot: true
        });
      })
    )
  );

  readonly showLayoutSummary$ = this.effect<{
    item: any;
    template: TemplateRef<any>;
  }>(
    pipe(
      tap(value => {
        const { template, item } = value;

        const drawer = this.drawerService.create({
          template,
          size: 80,
          context: {
            title: item.name,
            item,
            close: () => {
              drawer.destroy();
            }
          },
          closeOnOutsideClick: true,
          isRoot: true
        });
      })
    )
  );

  readonly showTaskSummary$ = this.effect<{
    taskId: string;
    template: TemplateRef<any>;
  }>(
    pipe(
      withLatestFrom(
        this.profilerStore.select(state => ({
          tasks: state.tasks
        }))
      ),
      tap(([value, { tasks }]) => {
        const { template, taskId } = value;
        const task = tasks.find(entry => entry.id === taskId);

        let isScriptTask = task?.action?.type?.startsWith('python') || task?.action?.type?.startsWith('powershell');
        const script = task?.action?.script;

        const drawer = this.drawerService.create({
          template,
          size: 80,
          context: {
            title: task.name,
            task,
            supportsScript: isScriptTask,
            script,
            close: () => {
              drawer.destroy();
            }
          },
          closeOnOutsideClick: true,
          isRoot: true
        });
      })
    )
  );

  constructor(private readonly profilerStore: ProfilerStore, private readonly drawerService: DrawerService) {
    super();
  }
}
