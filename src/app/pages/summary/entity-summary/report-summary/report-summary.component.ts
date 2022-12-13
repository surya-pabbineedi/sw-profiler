import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxUIModule, IconModule } from '@swimlane/ngx-ui';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'app-report-summary',
  imports: [CommonModule, NgxUIModule, NgxDatatableModule, HttpClientModule, IconModule],
  templateUrl: './report-summary.component.html',
  styleUrls: ['./report-summary.component.scss']
})
export class ReportSummaryComponent {
  @Input() context: any;

  getFilterNameFromValues(field: any, id: string) {
    return field.values?.find((value: any) => value.id === id)?.name;
  }
}
