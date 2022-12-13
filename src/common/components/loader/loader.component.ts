import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preloader">
      <div class="ngx-preloader">
        <div *ngFor="let arc of arcs" class="arc arc-{{ arc }}"></div>
      </div>
      <div class="center">{{ label }}</div>
    </div>
  `,
  styles: [
    `
      .center {
        text-align: center;
      }
    `
  ]
})
export class LoaderComponent {
  @Input() label = 'LOADING...';

  arcs = Array.from(Array(24).keys());
}
