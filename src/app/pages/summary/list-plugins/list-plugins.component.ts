import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxUIModule, IconModule } from '@swimlane/ngx-ui';
import { ProfilerStore } from 'src/common/store/profiler.store';
import { tap } from 'rxjs';
import { TaskSummaryComponent } from '../entity-summary/task-summary/task-summary.component';
import { NavigationStore } from 'src/common/store/navigation.store';

@Component({
  selector: 'app-list-plugins',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgxUIModule, NgxDatatableModule, HttpClientModule, IconModule, TaskSummaryComponent],
  templateUrl: './list-plugins.component.html',
  styleUrls: ['./list-plugins.component.scss']
})
export class ListPluginsComponent {
  @ViewChild('tmplTaskSummary', { static: false }) tmplTaskSummary!: TemplateRef<any>;

  packageDescriptorMap: { [key: string]: any } = {};

  packagedTasksMap: any = {};
  packages: string[] = [];

  packageAssetsMap: any = {};

  selectAsset = this.store.selectAsset;

  keys = Object.keys;

  vm$ = this.store.vm$.pipe(
    tap(({ assets, tasks, packageDescriptor }) => {
      this.packageDescriptorMap = Object.fromEntries(packageDescriptor?.map(item => [item.Id, item]) || []);

      this.packagedTasksMap = tasks
        .filter(task => task.action?.type === 'packaged')
        .reduce((acc, task) => {
          acc[task.action?.descriptor?.packageDescriptor?.id] = [
            ...(acc?.[task.action?.descriptor?.packageDescriptor?.id] || []),
            task
          ];

          return acc;
        }, {});

      this.packageAssetsMap = assets
        .filter(asset => asset.descriptor)
        .reduce((acc, asset) => {
          acc[asset?.descriptor?.packageDescriptor?.id] = [
            ...(acc?.[asset.descriptor?.packageDescriptor?.id] || []),
            asset
          ];

          return acc;
        }, {});

      this.packages = Object.keys(this.packagedTasksMap);
    })
  );

  constructor(private readonly store: ProfilerStore, private readonly navStore: NavigationStore) {}

  handleTaskClick(incomingTask: any) {
    this.navStore.showTaskSummary$({
      taskId: incomingTask.id,
      template: this.tmplTaskSummary
    });
  }
}
