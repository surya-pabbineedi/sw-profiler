import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxUIModule, IconModule } from '@swimlane/ngx-ui';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'app-layout-summary',
  templateUrl: './layout-summary.component.html',
  styleUrls: ['./layout-summary.component.scss'],
  imports: [CommonModule, NgxUIModule, NgxDatatableModule, HttpClientModule, IconModule]
})
export class LayoutSummaryComponent {
  private _context: any;
  public get context(): any {
    return this._context;
  }
  @Input()
  public set context(v: any) {
    this._context = v;
    this.codeOptions.mode.name = v.isHTML ? 'htmlmixed' : 'javascript';
  }

  codeOptions = {
    mode: {
      name: 'htmlmixed',
      version: 3,
      singleLineStringErrors: false
    },
    readOnly: true,
    lineNumbers: true,
    theme: 'dracula'
  };
}
