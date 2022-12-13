import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxUIModule } from '@swimlane/ngx-ui';
import { Orientation } from '@swimlane/ngx-graph';
import { NodeType } from 'src/common/enums/node-type.enum';

@Component({
  selector: 'app-graph-actions',
  standalone: true,
  imports: [CommonModule, NgxUIModule],
  styleUrls: ['./graph-actions.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="graph-actions-container">
      <div class="menu-item" (click)="centerGraph.next()" ngx-tooltip tooltipTitle="Center graph">
        <ngx-icon fontIcon="target"></ngx-icon>
      </div>
      <div class="menu-item" (click)="fitGraph.next()" ngx-tooltip tooltipTitle="Fit to view">
        <ngx-icon fontIcon="resize"></ngx-icon>
      </div>
      <div
        class="menu-item"
        [class.active]="layoutSettings.orientation === Orientation.LEFT_TO_RIGHT"
        (click)="toggleOrientation.next(Orientation.LEFT_TO_RIGHT)"
        ngx-tooltip
        tooltipTitle="Left-to-right layout"
        tooltipPlacement="right"
      >
        <ngx-icon fontIcon="branch-node"></ngx-icon>
      </div>
      <div
        class="menu-item"
        [class.active]="layoutSettings.orientation === Orientation.TOP_TO_BOTTOM"
        (click)="toggleOrientation.next(Orientation.TOP_TO_BOTTOM)"
        ngx-tooltip
        tooltipTitle="Top-to-bottom layout"
        tooltipPlacement="right"
      >
        <ngx-icon fontIcon="branch-node-vert"></ngx-icon>
      </div>

      <div
        class="menu-item help"
        (click)="showHelp()"
        ngx-tooltip
        [tooltipContext]="{ foo: 'YAZ' }"
        [tooltipType]="'popover'"
        [tooltipPlacement]="'bottom'"
        [tooltipTemplate]="tmplHelp"
        [tooltipCssClass]="'help-tooltip'"
        [tooltipCloseOnMouseLeave]="false"
        [tooltipShowCaret]="false"
      >
        <ngx-icon fontIcon="question-filled-sm"></ngx-icon>
      </div>

      <ng-template #tmplHelp let-model="model">
        <div class="node-types">
          <div class="node-type applications" *ngFor="let nodeType of nodeTypes">
            <div class="line-holder">
              <!-- not an empty tag - they have purpose -->
              <p class="line {{ nodeType.toLowerCase() }}"></p>
            </div>
            <div>{{ nodeType }}</div>
          </div>
        </div>
      </ng-template>
    </div>
  `
})
export class GraphActionsComponent {
  @Input() layoutSettings: any;
  @Output() toggleOrientation = new EventEmitter<Orientation>();
  @Output() fitGraph = new EventEmitter<void>();
  @Output() centerGraph = new EventEmitter<void>();

  Orientation = Orientation;

  nodeTypes = [
    ...Object.keys(NodeType).filter(
      (key: string) =>
        [NodeType.Workspace, NodeType.Application, NodeType.Dashboard, NodeType.Report, NodeType.Integration]
          .map(item => item.toString().toLowerCase())
          .includes(key.toLowerCase()) && !key.endsWith('Group')
    ),
    'app-to-app',
    'task-output-mapping'
  ];

  showHelp() {}
}
