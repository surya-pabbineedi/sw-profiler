import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfilerStore } from 'src/common/store/profiler.store';
import { LoaderComponent } from 'src/common/components/loader/loader.component';
import { NgxUIModule } from '@swimlane/ngx-ui';
import { FileItem, FileUploader } from '@swimlane/ng2-file-upload';
import JSZip from 'jszip';
import type { SSPEntity } from 'src/common/models/ssp-meta.model';
import { SSPEntityFolderType } from 'src/common/enums/ssp-entity-folder.enum';
import { forkJoin, from, map, Observable, Subject, take } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, NgxUIModule, LoaderComponent],
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      @import '@swimlane/ngx-ui/lib/styles/colors';
      .entries-container {
        display: flex;
        flex-direction: column;
        place-content: center;

        div.text {
          display: flex;
          flex-direction: column;
          place-content: center;
          align-items: center;

          p {
            font-size: 1.5rem;
            color: $color-blue-grey-300;
            font-style: normal;
            font-weight: 300;

            width: 50%;
            text-align: center;
          }
        }

        .btn {
          width: 200px;
        }
      }

      .ngx-dropzone .ngx-dropzone--label:hover .ngx-dropzone--rings path {
        stroke: $color-blue-400 !important;
      }
    `
  ],
  template: `
    <div class="entries-container ">
      <ng-container *ngIf="!loading; else tmplLoading">
        <ng-container *ngIf="!sspEntities; else tmplEntries">
          <ngx-dropzone
            [multiple]="false"
            [uploader]="uploaderInstance"
            [acceptedFileFormats]="['.SSP']"
            (afterAddingFile)="onFileDrop($event)"
          >
          </ngx-dropzone>

          <div class="text">
            <p>
              Import an SSP to comprehend the state of the entities in a Swimlane 10 environment and how they operate
              through a created map and report.
            </p>
          </div>
        </ng-container>
      </ng-container>

      <ng-template #tmplLoading>
        <div class="loader-container">
          <app-loader [label]="loadingEntity$ | async"></app-loader>
        </div>
      </ng-template>

      <ng-template #tmplEntries>
        <ul>
          <li *ngFor="let item of timeDiff | keyvalue">
            {{ item.key }} - <b>{{ item.value }}</b>
          </li>
        </ul>

        <ngx-button (click)="sspEntities = undefined" class="btn btn-primary">Profile one more SSP</ngx-button>
      </ng-template>
    </div>
  `
})
export class ImportSSPComponent implements OnInit {
  loading = false;
  uploaderInstance!: FileUploader;
  timeDiff!: any;
  totalPluginsRead = 0;
  loadingEntity$ = new Subject();
  activeSSPFileItem!: FileItem;
  sspEntities: any;

  constructor(private readonly store: ProfilerStore, private readonly router: Router) {}

  ngOnInit(): void {
    this.uploaderInstance = new FileUploader({
      autoUpload: false
    });

    this.uploaderInstance.onAfterAddingFile = this.onFileDrop.bind(this) as any;
  }

  onFileDrop(file: { fileItem: FileItem }) {
    const fileItem = file.fileItem;
    this.activeSSPFileItem = fileItem;

    this.loading = true;

    let dateBefore = new Date();
    JSZip()
      ?.loadAsync(fileItem.file.rawFile)
      .then(sspReponse => {
        const metaFile$ = sspReponse.file(`Meta/ContentActionResult.json`);

        if (!metaFile$) {
          console.error(`Meta file not found!`);

          this.loading = false;
          this.timeDiff = {
            ...this.timeDiff,
            [this.activeSSPFileItem.file.name]: 'Meta file not found!'
          };

          return;
        }

        let itemsMap: any = {
          sspMeta: undefined,
          [SSPEntityFolderType.Workspace]: [],
          [SSPEntityFolderType.Application]: [],
          [SSPEntityFolderType.Dashboard]: [],
          [SSPEntityFolderType.Report]: [],
          [SSPEntityFolderType.Task]: [],
          [SSPEntityFolderType.Workflow]: [],
          [SSPEntityFolderType.Asset]: []
        };

        metaFile$
          .async('text', m => {
            this.loadingEntity$.next(`loading SSP Meta... ${m.percent.toFixed(2)}%`);
          })
          .then(metaFileResponse => {
            const sspMeta = JSON.parse(metaFileResponse);
            itemsMap = {
              ...itemsMap,
              sspMeta
            };

            // Verify edge cases: for some SSP's the props has different casing
            let entities = sspMeta.entities;
            if (!entities && sspMeta.hasOwnProperty('Entities')) {
              entities = sspMeta.Entities;
            }

            const fileRequests$: Array<Observable<any>> = [];

            [
              SSPEntityFolderType.Workspace,
              SSPEntityFolderType.Application,
              SSPEntityFolderType.Dashboard,
              SSPEntityFolderType.Report,
              SSPEntityFolderType.Task,
              SSPEntityFolderType.Workflow,
              SSPEntityFolderType.Asset,
              SSPEntityFolderType.AssetDescriptor,
              SSPEntityFolderType.PackageDescriptor,
              SSPEntityFolderType.AvailableActionDescriptor
            ].forEach(folderItem => {
              entities[folderItem]?.forEach((entityItem: any) => {
                const file$ = sspReponse?.file(`${folderItem}/${entityItem.uid || entityItem.Uid}.json`);
                if (file$) {
                  fileRequests$.push(
                    from(
                      file$.async('text', m => {
                        this.loadingEntity$.next(
                          `loading ${folderItem}/${m.currentFile ? m.currentFile : ''}... ${m.percent.toFixed(2)}%`
                        );
                      })
                    ).pipe(map(entityItemResponse => ({ entityItemResponse, folderItem, entityItem })))
                  );
                }
              });
            });

            forkJoin(fileRequests$)
              .pipe(take(1))
              .subscribe(
                (
                  responses: Array<{
                    entityItemResponse: string;
                    folderItem: SSPEntityFolderType;
                    entityItem: SSPEntity;
                  }>
                ) => {
                  responses.forEach(entry => {
                    itemsMap[entry.folderItem].push(JSON.parse(entry.entityItemResponse));
                  });

                  this.sspEntities = itemsMap;

                  this.loadingEntity$.next('Profiling...');
                  const timeTaken = `${this.activeSSPFileItem.file.name} - Time take to read entities ${Object.entries(
                    responses.reduce((acc: any, entry) => {
                      acc[entry.folderItem] = acc[entry.folderItem] ? acc[entry.folderItem] + 1 : 1;

                      return acc;
                    }, {})
                  ).map(item => `${item[0]}(${item[1]})`)}`;
                  this.timeDiff = {
                    ...this.timeDiff,
                    [this.activeSSPFileItem.file.name]: `${this.activeSSPFileItem.file.size} bytes`,
                    [timeTaken]: `${new Date().getTime() - dateBefore.getTime()} ms`
                  };

                  let swimlaneVersion: string = sspMeta.swimlaneVersion || sspMeta.SwimlaneVersion;
                  if (swimlaneVersion?.includes('+')) {
                    swimlaneVersion = swimlaneVersion.split('+')[0];
                  }

                  this.store.patchState({
                    sspMeta: {
                      swimlaneVersion,
                      fileName: this.activeSSPFileItem.file.name
                    }
                  });

                  this.store.setEntites({
                    workspaces: itemsMap[SSPEntityFolderType.Workspace],
                    applications: itemsMap[SSPEntityFolderType.Application],
                    dashboards: itemsMap[SSPEntityFolderType.Dashboard],
                    reports: itemsMap[SSPEntityFolderType.Report],
                    tasks: itemsMap[SSPEntityFolderType.Task],
                    workflows: itemsMap[SSPEntityFolderType.Workflow],
                    assets: itemsMap[SSPEntityFolderType.Asset],
                    plugins: entities[SSPEntityFolderType.Plugin] || [],
                    assetDescriptor: entities[SSPEntityFolderType.AssetDescriptor],
                    packageDescriptor: entities[SSPEntityFolderType.PackageDescriptor],
                    availableActionDescriptor: entities[SSPEntityFolderType.AvailableActionDescriptor]
                  });

                  setTimeout(() => {
                    this.loading = false;
                    this.router.navigateByUrl('/visualize');
                  }, 500);
                }
              );
          });
      });
  }
}
