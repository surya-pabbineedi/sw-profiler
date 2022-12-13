import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxUIModule, IconModule } from '@swimlane/ngx-ui';
import { ProfilerStore } from 'src/common/store/profiler.store';

const LINK_TYPES = {
  newRecord: 'Create new record',
  record: 'Record',
  report: 'Report'
};

const INPUT_PARAM_TYPES = {
  trigger: 'Trigger',
  record: 'Record',
  credentials: 'Key Store',
  asset: 'Asset Library',
  literal: 'Literal Value',
  stdOutput: 'Standard Output',
  inputParameter: 'Input Parameter',
  outputParameter: 'Output Parameter',
  template: 'Templates',
  link: 'Link'
};

const OUTPUT_TYPES = {
  setFieldValue: 'Update Current Record',
  email: 'Send an Email',
  insertUpdateRecord: 'Create/Update Records',
  saveToFile: 'Save to File',
  referentialTask: 'Execute Another Task'
};

const TRIGGER_TYPES = {
  scheduled: 'Scheduled',
  email: 'Email',
  recordSave: 'Record Save'
};
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'app-task-summary',
  templateUrl: './task-summary.component.html',
  styleUrls: ['./task-summary.component.scss'],
  imports: [CommonModule, NgxUIModule, NgxDatatableModule, HttpClientModule, IconModule]
})
export class TaskSummaryComponent {
  private _context: any;
  public get context(): any {
    return this._context;
  }
  @Input()
  public set context(v: any) {
    this._context = v;

    const { task } = v;

    const isPowerShell = !task?.action?.type?.startsWith('python');
    this.codeOptions.mode.name = isPowerShell ? 'powershell' : 'python';
    this.codeOptions.mode.version = isPowerShell ? 2 : 3;
  }

  LINK_TYPES = LINK_TYPES;
  INPUT_PARAM_TYPES = INPUT_PARAM_TYPES;
  OUTPUT_TYPES = OUTPUT_TYPES;
  TRIGGER_TYPES = TRIGGER_TYPES;

  defaultCollapseState = true;

  entitiesMap$ = this.store.selectEntityMaps$;
  selectField = this.store.selectField;
  selectTask = this.store.selectTask;
  selectFieldsMapByAppId = this.store.selectFieldsMapByAppId;

  codeOptions = {
    mode: {
      name: 'python',
      version: 3,
      singleLineStringErrors: false
    },
    readOnly: true,
    lineNumbers: true,
    theme: 'dracula'
  };

  constructor(private readonly store: ProfilerStore) {}
}
