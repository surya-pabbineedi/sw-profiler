import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgxUIModule, IconModule } from '@swimlane/ngx-ui';
import { Workspace } from 'src/common/models/workspace.model';

import { ListApplicationsComponent } from './list-applications/list-applications.component';
import { ListDashboardsComponent } from './list-dashboards/list-dashboards.component';

import { ProfilerStore } from 'src/common/store/profiler.store';
import { LoaderComponent } from 'src/common/components/loader/loader.component';
import { tap } from 'rxjs';
import { ListPluginsComponent } from './list-plugins/list-plugins.component';
import { WorkspaceSummaryComponent } from './entity-summary/workspace-summary/workspace-summary.component';

@Component({
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgxUIModule,
    HttpClientModule,
    IconModule,
    LoaderComponent,
    ListDashboardsComponent,
    ListApplicationsComponent,
    ListPluginsComponent,
    WorkspaceSummaryComponent
  ]
})
export class SummaryComponent implements OnInit {
  selectedWorkspace!: Workspace;
  vm$ = this.store.vm$.pipe(
    tap(({ totals }) => {
      if (!this.activeCard) {
        this.activeCard = totals[totals?.findIndex((item: any) => item.label === 'Workspaces') || 0];
      }
    })
  );
  activeCard!: {
    label: string;
  };

  get isWorkspaces() {
    return !this.isPlugins;
  }

  get isPlugins() {
    return ['Plugins', 'Assets'].includes(this.activeCard?.label);
  }

  constructor(private readonly store: ProfilerStore) {}

  ngOnInit(): void {
    this.store.loadEntities$();
  }

  handleSelectWorkspace(selectedWorkspace: Workspace) {
    this.store.patchState({ selectedWorkspace });
  }

  handleMetricClick(item: { label: string; selectable: boolean }) {
    if (item.selectable) {
      this.activeCard = item;
    }
  }
}
