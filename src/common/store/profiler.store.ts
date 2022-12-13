import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { pipe, switchMap, tap, catchError, EMPTY, forkJoin, withLatestFrom, filter, Observable } from 'rxjs';
import { App } from '../models/application.model';
import { Dashboard } from '../models/dashboard.model';
import { Report } from '../models/report.model';
import { Workspace } from '../models/workspace.model';
import { ProfilerService } from '../services/profiler.service';
import { LoadingService } from '@swimlane/ngx-ui';
import { LayoutType } from '../enums/layout-type.enum';
import { uniq, uniqBy } from 'lodash-es';
import { DashboardCardTypes } from '../enums/dashboard-card-type.enum';
import { Workflow } from '../models/workflow.model';

const STORAGE_IDENTIFIER = 'swimlane_profiler_ssp_entities';
const LAYOUT_TYPES = [LayoutType.HTML_OBJECT, LayoutType.INTEGRATION, LayoutType.WIDGET];
export interface ProfilerState {
  workspaces: Workspace[];
  applications: App[];
  dashboards: Dashboard[];
  reports: Report[];
  tasks: any[];
  workflows: Workflow[];
  plugins: any[];
  assets: any[];
  credentials: any[];
  assetDescriptor: any[];
  packageDescriptor: any[];
  availableActionDescriptor: any[];

  loadingEntities: boolean;
  totalApplications?: number;
  totalDashboards?: number;
  selectedWorkspace?: Workspace;
  appLayoutsFlattenedByAppId?: { [key: string]: any[] };
  sspMeta?: {
    swimlaneVersion: string;
    fileName: string;
  };
  allowStorage: boolean;
  initialized: boolean;
}

const initialState: ProfilerState = {
  workspaces: [],
  applications: [],
  dashboards: [],
  reports: [],
  tasks: [],
  workflows: [],
  plugins: [],
  assets: [],
  credentials: [],
  assetDescriptor: [],
  packageDescriptor: [],
  availableActionDescriptor: [],

  loadingEntities: false,
  sspMeta: {
    swimlaneVersion: '',
    fileName: ''
  },
  allowStorage: true,
  initialized: false
};

@Injectable()
export class ProfilerStore extends ComponentStore<ProfilerState> {
  readonly selectSSPmeta$ = this.select(({ sspMeta }) => sspMeta);
  readonly selectApplicationsMap$ = this.select(({ applications }) =>
    Object.fromEntries(applications.map(app => [app.id, app]))
  );

  readonly selectAppsEntities$ = this.select(
    ({
      applications,
      reports,
      workflows,
      appLayoutsFlattenedByAppId
    }): Observable<{
      [key: string]: {
        app: App;
        layout: any[];
        reports: Report[];
        workflow: Workflow[];
        fieldsMap: { [key: string]: any };
        flattenedLayouts: { [key: string]: any };
      };
    }> => {
      return applications.reduce((acc: any, app: App) => {
        acc[app.id] = {
          app,
          layout: app.layout?.filter((entry: any) =>
            [LayoutType.WIDGET, LayoutType.INTEGRATION, LayoutType.HTML_OBJECT].includes(entry.layoutType)
          ),
          reports: reports?.filter(report => report.applicationIds?.includes(app.id)),
          workflow: workflows?.filter(workflow => workflow.applicationId === app.id),
          fieldsMap: app.fields.reduce((acc, field) => {
            acc[field.id] = field;
            return acc;
          }, {}),
          flattenedLayouts: appLayoutsFlattenedByAppId?.[app.id]
        };

        return acc;
      }, {});
    }
  );

  readonly selectReportsMap$ = this.select(({ reports }) =>
    Object.fromEntries(reports.map(report => [report.id, report]))
  );

  readonly selectAssetsMap$ = this.select(({ assets }) => Object.fromEntries(assets.map(asset => [asset.id, asset])));

  readonly selectFieldsMapByAppId = (appId: string) =>
    this.select(({ applications }) => {
      return Object.fromEntries(
        applications.find(app => app.id === appId)?.fields.map(field => [field.id, field]) || []
      );
    });

  readonly selectField = (fieldId: string) =>
    this.select(({ applications }) => {
      return applications.flatMap(app => app.fields).find(field => field.id === fieldId);
    });

  readonly selectAsset = (assetId: string) =>
    this.select(({ assets }) => {
      return assets.find(asset => asset.id === assetId);
    });

  readonly selectEntityMaps$ = this.select(
    this.selectApplicationsMap$,
    this.selectAssetsMap$,
    this.selectReportsMap$,
    (appsMap, assetsMap, reportsMap) => ({ appsMap, assetsMap, reportsMap })
  );

  readonly selectTask = (taskId: string): Observable<any> =>
    this.select(({ tasks }) => tasks?.find(entry => entry.id === taskId));

  readonly selectEntitiesByAppId = (appId: string) =>
    this.select(
      ({
        workspaces,
        applications,
        dashboards,
        reports,
        tasks,
        plugins,
        workflows,
        credentials,
        assets,
        assetDescriptor,
        packageDescriptor,

        appLayoutsFlattenedByAppId,
        loadingEntities,
        selectedWorkspace,
        sspMeta
      }) => {
        const app = applications.find(app => app.id === appId);
        const appIds = [
          appId,
          ...(app?.fields
            .filter(field => field.fieldType.toLowerCase() === 'reference' && field.targetId !== app.id)
            .map(field => field.targetId) || [])
        ];

        return {
          workspaces: workspaces.filter(workspace => workspace.applications?.includes(appId)),
          applications: applications.filter(app => appIds.includes(app.id)),
          dashboards: dashboards.filter(dashboard =>
            dashboard.items.some(
              item => item.cardType === DashboardCardTypes.UsageStatistic && item.appsFilter.includes(appId)
            )
          ),
          reports: reports.filter(report => report.applicationId === appId || report.applicationIds?.includes(appId)),
          tasks: tasks.filter(task => task.applicationId === appId),
          workflows: workflows.filter(workflow => workflow.applicationId === appId),
          plugins,
          credentials,
          assets,
          assetDescriptor,
          packageDescriptor,

          appLayoutsFlattenedByAppId,
          loadingEntities,
          selectedWorkspace,
          sspMeta
        };
      }
    );

  readonly vm$ = this.select(
    ({
      workspaces,
      applications,
      dashboards,
      reports,
      tasks,
      workflows,
      plugins,
      assets,
      credentials,
      assetDescriptor,
      packageDescriptor,

      appLayoutsFlattenedByAppId,
      loadingEntities,
      selectedWorkspace,
      sspMeta
    }) => {
      const totals = [
        { label: 'Applications', count: applications?.length || 0, selectable: false },
        { label: 'Dashboards', count: dashboards?.length || 0, selectable: false },
        { label: 'Reports', count: reports?.length || 0, selectable: false },
        { label: 'Integrations', count: tasks?.length || 0, selectable: false },
        { label: 'Workspaces', count: workspaces?.length || 0, selectable: true },
        { label: 'Plugins', count: plugins?.length || 0, selectable: true },
        { label: 'Assets', count: assets?.length || 0, selectable: true },
        { label: 'Key Stores', count: credentials?.length || 0, selectable: false }
      ];

      return {
        workspaces,
        applications,
        dashboards,
        reports,
        tasks,
        plugins,
        workflows,
        credentials,
        assets,
        assetDescriptor,
        packageDescriptor,

        appLayoutsFlattenedByAppId,
        loadingEntities,
        selectedWorkspace,
        totals,
        sspMeta
      };
    }
  );

  private getLayoutField(field: any): any[] {
    let flattenedFields: any[] = [];
    const loweredLayoutTypes = LAYOUT_TYPES.map(entry => entry.toLowerCase());

    if (loweredLayoutTypes.includes(field.layoutType?.toLowerCase())) {
      flattenedFields.push(field);
    }

    [...(field?.children || []), ...(field?.tabs || [])].forEach((child: any) => {
      if (loweredLayoutTypes.includes(child.layoutType?.toLowerCase())) {
        flattenedFields.push(child);
      }

      if (child.children?.length > 0 || child.tabs?.length > 0) {
        flattenedFields.push(...this.getLayoutField(child));
      }
    });

    return uniqBy(flattenedFields, (field: any) => field.id);
  }

  readonly setEntites = this.updater((state: ProfilerState, entities: any): ProfilerState => {
    const {
      workspaces,
      applications,
      dashboards,
      reports,
      tasks,
      workflows,
      plugins,
      assets,
      assetDescriptor,
      packageDescriptor,
      availableActionDescriptor
    } = entities;

    const appLayoutsFlattenedByAppId = applications.reduce((acc: any, app: App) => {
      const flattenedLayouts = app.layout?.reduce((acc, layout) => {
        acc.push(...this.getLayoutField(layout));
        return acc;
      }, []);

      acc[app.id] = flattenedLayouts;
      return acc;
    }, {});

    const credentials = uniq(
      tasks
        .filter((task: any) => task.inputMapping)
        .flatMap((task: any) => task.inputMapping)
        .filter((inputMapping: any) => inputMapping.type?.toLowerCase() === 'credentials')
        .map((inputMapping: any) => inputMapping.key)
    );

    if (state.allowStorage) {
      try {
        localStorage.setItem(STORAGE_IDENTIFIER, JSON.stringify(entities));
      } catch (error) {
        console.error({ error }, JSON.stringify(entities).length);
      }
    }

    return {
      ...state,
      workspaces,
      applications,
      dashboards,
      reports,
      tasks,
      workflows,
      plugins,
      assets,
      credentials,
      assetDescriptor,
      packageDescriptor,
      availableActionDescriptor,

      appLayoutsFlattenedByAppId,
      selectedWorkspace: workspaces[0],
      loadingEntities: false,
      initialized: true
    };
  });

  readonly loadEntities$ = this.effect<void>(
    pipe(
      withLatestFrom(
        this.select((state: ProfilerState) => ({ allowStorage: state.allowStorage, initialized: state.initialized }))
      ),
      filter(([, { allowStorage, initialized }]) => {
        let hasStoredData = initialized;
        if (allowStorage && !initialized) {
          try {
            const storedData = localStorage.getItem(STORAGE_IDENTIFIER);
            if (storedData) {
              this.setEntites(JSON.parse(storedData));

              hasStoredData = true;
            }
          } catch (error) {
            console.error(`Cannot read stored data`);
          }
        }

        return (!allowStorage && hasStoredData) || !hasStoredData;
      }),
      tap(() => {
        this.loadingService.start();
        this.patchState({ loadingEntities: true });
      }),
      switchMap(() =>
        forkJoin([
          this.profilerService.getWorkspaces().pipe(catchError(() => EMPTY)),
          this.profilerService.getApplications().pipe(catchError(() => EMPTY)),
          this.profilerService.getDashboards().pipe(catchError(() => EMPTY)),
          this.profilerService.getReports().pipe(catchError(() => EMPTY)),
          this.profilerService.getTasks().pipe(catchError(() => EMPTY)),
          this.profilerService.getWorkflows().pipe(catchError(() => EMPTY)),
          this.profilerService.getPackages().pipe(catchError(() => EMPTY))
        ])
      ),
      tap(([workspaces, applications, dashboards, reports, tasks, workflows, plugins]) => {
        this.setEntites({
          workspaces,
          applications,
          dashboards,
          reports,
          tasks,
          workflows,
          plugins,
          assets: []
        });

        this.loadingService.complete();
      }),
      catchError(() => {
        this.loadingService.complete();
        return EMPTY;
      })
    )
  );

  constructor(private readonly profilerService: ProfilerService, private loadingService: LoadingService) {
    super(initialState);
  }
}
