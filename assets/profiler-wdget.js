import { SwimlaneElement, css, html, svg } from '@swimlane/swimlane-element@2';

export default class extends SwimlaneElement {
  static get styles() {
    return [
      super.styles,
      css`
        .help-text {
          color: #647493;
          font-size: 1rem;
        }

        .secondary-text {
          color: #5a6884;
          font-size: 0.8rem;
        }

        .error-text {
          color: #ad2400;
          font-size: 1rem;
        }

        .profiler {
          border: none;
          height: 100vh;
          width: 100%;
        }

        .actions-wrapper {
          margin: 1rem;
          text-align: center;
        }

        button {
          background-color: #4caf50;
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
          width: 50%;
          box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
        }

        button:disabled {
          background-color: grey;
          cursor: not-allowed;
        }

        ul {
          list-style-type: none;
        }

        ul.app-selection {
          text-align: left;
        }

        ul li label {
          cursor: pointer;
        }
      `
    ];
  }

  static properties = {
    apps: { type: Array },
    profilerApp: { type: Object },
    actionLabel: { type: String },
    actionDisabled: { type: Boolean },
    hasExportErrors: { type: Boolean }
  };

  constructor() {
    super();
    this.actionLabel = 'Get apps for the Profiler';
    this.apps = [];
    this.selectedApps = [];
    this.actionDisabled = false;
    this.hasExportErrors = false;
  }

  get headers() {
    return {
      authorization: 'Bearer ' + this.contextData.token,
      'content-type': 'application/json'
    };
  }

  getAppsRequest() {
    return fetch(`${this.contextData.origin}/api/app`, {
      headers: this.headers
    }).then(appResponse => appResponse.json());
  }

  putAppRequest(app) {
    return fetch(`${this.contextData.origin}/api/app/${app.id}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(app)
    }).then(appResponse => appResponse.json());
  }

  tryExport(app) {
    return fetch(`${this.contextData.origin}/api/content/export/try`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        entryPointIds: [app.id],
        entryPointType: 'application'
      })
    }).then(appResponse => appResponse.json());
  }

  exportAppRequest(app) {
    const fileName = app.name.replace(/[|&;$%@"<>()+,]/g, '');
    const exportDownloadRequest = {
      entryPointIds: [app.id],
      entryPointType: 'application',
      exportName: fileName
    };

    return fetch(`${this.contextData.origin}/api/content/export/download`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(exportDownloadRequest)
    })
      .then(appResponse => appResponse.blob())
      .then(sspResponse => {
        const blobUrl = URL.createObjectURL(sspResponse);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${window.location.host}-${fileName}.ssp`;
        link.innerHTML = 'Click here to download the SSP';
        link.style.display = 'none';

        document.body.appendChild(link);

        this.shadowRoot.getElementById('download-link-container').appendChild(link);
        this.shadowRoot.querySelector('#download-link-container a').click();

        this.actionLabel = 'Done!';
      });
  }

  download(profilerApp) {
    this.actionLabel = 'Validating...';
    this.putAppRequest(profilerApp).then(() => {
      this.tryExport(profilerApp).then(tryResponse => {
        const errors = Object.keys(tryResponse.errors || {}).filter(k => !k.startsWith('$type'));
        if (errors.length > 0) {
          this.hasExportErrors = true;
          this.actionLabel = 'Failed!';
          return;
        }

        this.actionLabel = 'Downloading SSP...';
        this.exportAppRequest(profilerApp);
      });
    });
  }

  handleAddRefsClick() {
    if (this.apps.length > 0) {
      this.handleAppsSelected();
      return;
    }

    this.actionDisabled = true;
    this.getAppsRequest().then(appJsonResponse => {
      const apps = appJsonResponse;

      const profilerApp = apps.find(app => app.id === this.contextData.application.id);
      if (!profilerApp) {
        this.actionLabel = 'Cant find profiler app!';
        return;
      }

      this.profilerApp = profilerApp;

      this.apps = apps
        .filter(app => app.id !== profilerApp.id)
        .map(app => {
          if (app.id !== profilerApp.id) {
            app.selectedForExport = true;
          }

          app.alreadyReferenced = profilerApp.fields.some(field => field.targetId === app.id);

          return app;
        });
      this.actionLabel = `Give me SSP for the selected(${this.apps.filter(a => a.selectedForExport).length}) apps`;
      this.actionDisabled = false;
    });
  }

  handleAppsSelected() {
    this.actionDisabled = true;

    const profilerApp = this.profilerApp;

    // might be there are no references to add
    if (this.apps.length === 0) {
      this.download(profilerApp);
      return;
    }

    const appsToAdd = this.apps.filter(
      app => app.selectedForExport && profilerApp.fields.every(field => field.targetId !== app.id)
    );

    this.actionLabel = 'Adding References...';
    const refFields = appsToAdd.map(app => {
      return {
        $type: 'Core.Models.Fields.Reference.ReferenceField, Core',
        targetId: app.id,
        columns: [app.trackingFieldId],
        controlType: 'grid',
        selectionType: 'multi',
        canAdd: false,
        createBackreference: false,
        id: (Math.random() + 1).toString(36).substring(7),
        name: `${app.name} - Reference`,
        key: `${app.id.toLowerCase()}-reference`,
        fieldType: 'reference',
        required: false,
        readOnly: false,
        supportsMultipleOutputMappings: false
      };
    });

    const layouts = refFields.map((refField, index) => {
      return {
        $type: 'Core.Models.Layouts.FieldLayout, Core',
        fieldId: refField.id,
        helpTextType: 'none',
        helpText: ' ',
        layoutType: 'field',
        id: (Math.random() + 1).toString(36).substring(7),
        row: 2,
        col: 1,
        sizex: 2,
        sizey: 0
      };
    });

    profilerApp.fields = [...(profilerApp.fields || []), ...refFields];
    profilerApp.layout = [...(profilerApp.layout || []), ...layouts];

    this.download(profilerApp);
  }

  handleAppSelection(incomingEvent) {
    this.apps.forEach(app => {
      if (app.id === incomingEvent.target.value) {
        app.selectedForExport = incomingEvent.target.checked;
      }
    });

    const length = this.apps.filter(a => a.selectedForExport).length;
    this.actionLabel = `Give me SSP for the selected(${length}) apps`;

    this.actionDisabled = length === 0;
  }

  render() {
    return html`
      <div class="actions-wrapper">
        <p class="help-text">
          Creates references to all the applications in the current environment and gives an SSP. If the download
          doesn't work, check the reference fields of the "Profiler" app and use the "Export" option to export it
          manually.
        </p>
        <p>
          <em class="secondary-text"
            >Note: Some applications may still be included in the SSP since they may be referenced by the chosen
            applications.</em
          >
        </p>

        ${this.hasExportErrors
          ? html`<p class="error-text">
              Unable to export the SSP! Please attempt a manual export of the 'profiler' application in order to view
              the problems.
            </p>`
          : html` <button
                type="button"
                class="btn btn-primary"
                .disabled=${this.actionDisabled}
                @click="${this.handleAddRefsClick}"
              >
                ${this.actionLabel}
              </button>

              <ul class="app-selection">
                ${this.apps.map(
                  app => html`
                    <li>
                      <input
                        type="checkbox"
                        id="${app.id}"
                        name="${app.name}"
                        value=${app.id}
                        .checked=${app.selectedForExport}
                        .disabled=${app.alreadyReferenced}
                        @click=${this.handleAppSelection}
                      />
                      <label for="${app.id}">${app.name}</label>
                    </li>
                  `
                )}
              </ul>`}

        <!-- this is required -->
        <div id="download-link-container"></div>
      </div>
    `;
  }
}
