import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, Subject, takeUntil, tap } from 'rxjs';
import { ProfilerStore } from 'src/common/store/profiler.store';
@Component({
  selector: 'app-navigation',
  template: `
    <ngx-toolbar>
      <ngx-toolbar-title>
        <h1>{{ title$ | async }}</h1>
      </ngx-toolbar-title>
      <ngx-toolbar-content>
        <ngx-navbar [active]="activeIndex" *ngIf="!hideNavigation">
          <ngx-navbar-item
            *ngFor="let item of items"
            ngx-tooltip
            tooltipPlacement="bottom"
            tooltipType="popover"
            tooltipCssClass="app-nav-popover"
            [tooltipTitle]="item.title"
            [routerLink]="item.route"
          >
            <i class="ngx-icon" [ngClass]="item.icon"></i>
          </ngx-navbar-item>
        </ngx-navbar>
      </ngx-toolbar-content>
    </ngx-toolbar>
  `,
  styles: [
    `
      h1 {
        margin: 0;
        color: white;
      }
    `
  ]
})
export class NavigationComponent implements OnInit, OnDestroy {
  activeIndex = 0;
  items = [
    {
      icon: 'ngx-import-outline-large',
      route: 'import',
      title: 'Import SSP'
    },
    {
      icon: 'ngx-spaces-list',
      route: 'summary',
      title: 'Summary'
    },
    {
      icon: 'ngx-tree',
      route: 'visualize',
      title: 'Graph'
    }
  ];

  hideNavigation = false;
  destroy$ = new Subject();

  defaultTitle = 'Swimlane Profiler';
  title$ = this.store.selectSSPmeta$.pipe(
    map((SSPMeta: any) =>
      SSPMeta.swimlaneVersion ? `${SSPMeta.fileName} (${SSPMeta.swimlaneVersion})` : this.defaultTitle
    )
  );

  constructor(private readonly router: Router, private readonly store: ProfilerStore) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        tap(({ url }) => {
          this.hideNavigation = url.includes('import');
          this.activeIndex = this.items.findIndex(item => url.includes(item.route));
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next(undefined);
  }
}
