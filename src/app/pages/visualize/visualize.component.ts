import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizeGraphComponent } from './visualize-graph/visualize-graph.component';
import { ProfilerStore } from 'src/common/store/profiler.store';
import { map, mergeMap, take, tap } from 'rxjs';
import { LoaderComponent } from 'src/common/components/loader/loader.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoaderComponent, VisualizeGraphComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <ng-container *ngIf="!vm.loadingEntities && vm.workspaces?.length > 0; else loading">
        <app-visualize-graph
          [workspaces]="vm.workspaces"
          [apps]="vm.applications"
          [dashboards]="vm.dashboards"
          [reports]="vm.reports"
          [tasks]="vm.tasks"
          [workflows]="vm.workflows"
          [appsEntities]="appsEntities$ | async"
        ></app-visualize-graph>
      </ng-container>
    </ng-container>

    <ng-template #loading>
      <div class="loader-container">
        <app-loader></app-loader>
      </div>
    </ng-template>
  `
})
export class VisualizeComponent implements OnInit {
  vm$ = this.store.vm$;
  appsEntities$ = this.store.selectAppsEntities$;

  constructor(private readonly store: ProfilerStore) {}

  ngOnInit(): void {
    this.store.loadEntities$();
  }
}
