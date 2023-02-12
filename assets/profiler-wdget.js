import { SwimlaneElement, css, html, svg, unsafeCSS } from '@swimlane/swimlane-element@1';
import { repeat } from 'lit-html@1/directives/repeat.js';

const backgroundColor = 'rgba(59, 68, 87, 0.75);';
const backgroundColorOnHover = '#1483FF';

const loaderCss = css`
  .container {
    width: 100%;
    height: 50px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .swimlane-loader {
    width: 100%;
    align-self: center;
    height: 64px;
    backface-visibility: hidden;
  }
  .swimlane-loader svg {
    width: 100%;
  }

  .swimlane-loader.animate .loaderLineLeft {
    animation: lineLeft 4s linear infinite;
    animation-delay: 0.25s;
    stroke-dasharray: 560;
    stroke-dashoffset: 560;
  }
  .swimlane-loader.animate .loaderLineRight {
    animation: lineRight 4s linear infinite;
    animation-delay: 2s;
    stroke-dasharray: 560;
    stroke-dashoffset: -560;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0.4;
    }
  }
  @keyframes lineLeft {
    0% {
      stroke-dashoffset: 560;
    }
    50% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: -560;
    }
  }
  @keyframes lineRight {
    0% {
      stroke-dashoffset: -560;
    }
    50% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: 560;
    }
  }
`;

const widgetEleCss = css`
  /* width */
  ::-webkit-scrollbar {
    width: 5px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: #232323;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: #2b3240;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #505c75;
  }

  .help-text {
    color: #818fa9;
    font-size: 1rem;
    text-align: center;
    width: 825px;
  }

  .secondary-text {
    color: #818fa9;
    font-size: 0.8rem;
    margin-top: 0;
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

  .widget-wrapper {
    margin-top: 0.5rem;
    margin-bottom: 1.5rem;

    display: grid;
    place-content: center;
    place-items: center;
  }

  button.ssp-action {
    background-color: #4caf50;
    border: none;
    color: white;
    padding: 15px 32px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 0 0 1rem 0;
    cursor: pointer;
    width: 50%;
    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
    border-radius: 3px;
  }

  button:disabled {
    background-color: #1d1d1d;
    color: #5a6884;
    cursor: not-allowed;
  }

  a.navigate-to-app {
    color: #1483ff;
  }

  .action-buttons--container {
    overflow-y: auto;
    max-height: 50vh;
  }

  .action-button--container {
    width: 100%;
    margin-bottom: 0.5em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .action-button {
    width: 800px;
    min-height: 51px;
    display: flex;
    align-items: center;
    border: none;
    background-color: ${unsafeCSS(backgroundColor)};
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.5);
    border-radius: 2px;
    justify-content: left;
    align-content: left;
    cursor: pointer;
    transition: all 0.5s ease;
    padding-left: 30px;
  }
  .action-button:last-child {
    margin-bottom: 0;
  }

  .action-button:hover {
    background-color: ${unsafeCSS(backgroundColorOnHover)};
    transition: background-color 1.2s ease;
  }
  .action-button.active {
    background-color: ${unsafeCSS(backgroundColorOnHover)};
    height: calc(100% - 4px);
  }

  /* Default icon container */
  .action-button .icon--container {
    width: 100px;
    height: auto;
    position: relative;
  }

  .action-button .icon--container svg {
    position: absolute;
    top: 0%;
    left: 0%;
    transform: translate(-50%, -50%);
  }

  /* Default icon color */
  .action-button .icon--container svg,
  .action-button .icon--container svg > path {
    fill: ${unsafeCSS(backgroundColorOnHover)};
  }

  /* Active icon color */
  .action-button.active .icon--container svg > path,
  .action-button:hover .icon--container svg > path {
    fill: white;
  }

  .action-button .action--label {
    color: white;
    font-size: 14px;
    padding: 10px 0px 10px 0;
    width: 70%;
    margin-bottom: 3px;
  }
`;

export default class extends SwimlaneElement {
  static get styles() {
    return [super.styles, loaderCss, widgetEleCss];
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

  get swimlaneLoader() {
    return this.renderRoot.querySelector('#swimlane-loader');
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
      .catch(() => {
        this.actionFailed();
      })
      .then(appResponse => appResponse.blob())
      .then(sspResponse => {
        console.log(`Success!`);

        const profilerApp = this.profilerApp;

        profilerApp.fields = [];
        profilerApp.layout = [];

        this.putAppRequest(profilerApp)
          .catch(() => {
            this.actionFailed();
          })
          .then(() => {
            const blobUrl = URL.createObjectURL(sspResponse);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${window.location.host}-${fileName}.ssp`;
            link.innerHTML = 'Click here to download the SSP';
            link.style.display = 'none';

            document.body.appendChild(link);

            this.shadowRoot.getElementById('download-link-container').appendChild(link);
            this.shadowRoot.querySelector('#download-link-container a').click();

            this.actionLabel = 'Done! - Refresh Card to start over.';
            this.swimlaneLoader.classList.remove('animate');

            this.apps = [];
          });
      });
  }

  actionFailed() {
    this.hasExportErrors = true;
    this.actionLabel = 'Failed!';
    this.swimlaneLoader.classList.remove('animate');
  }

  download(profilerApp) {
    this.actionLabel = 'Validating...';
    this.putAppRequest(profilerApp).then(() => {
      this.tryExport(profilerApp)
        .catch(error => {
          this.actionFailed();
          console.log({ error });
        })
        .then(tryResponse => {
          const errors = Object.keys(tryResponse.errors || {}).filter(k => !k.startsWith('$type'));
          if (errors.length > 0 || tryResponse.ErrorCode) {
            this.actionFailed();
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
            app.selectedForExport = false;
          }

          app.alreadyReferenced = profilerApp.fields.some(field => field.targetId === app.id);

          return app;
        });

      const selectedAppsCount = this.apps.filter(a => a.selectedForExport).length;
      this.actionLabel =
        selectedAppsCount > 0 ? `Give me SSP for the selected(${this.selectedApps}) apps` : `Select Apps`;
      this.actionDisabled = selectedAppsCount === 0;
    });
  }

  handleAppsSelected() {
    if (this.apps.length === 0) {
      return;
    }

    this.actionDisabled = true;
    const profilerApp = this.profilerApp;
    this.swimlaneLoader.classList.add('animate');

    const appsToAdd = this.apps.filter(app => app.selectedForExport);

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

    const layouts = refFields.map(refField => {
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

    profilerApp.fields = [...refFields];
    profilerApp.layout = [...layouts];

    this.download(profilerApp);
  }

  handleAppSelection(incomingApp) {
    this.apps.forEach(app => {
      if (app.id === incomingApp.id) {
        app.selectedForExport = !incomingApp.selectedForExport;
      }
    });

    const length = this.apps.filter(a => a.selectedForExport).length;
    this.actionLabel = `Download SSP for the selected(${length}) apps`;

    this.actionDisabled = length === 0;
  }

  render() {
    return html`
      <div class="widget-wrapper">
        ${this.loader()} ${this.headerTemplate()}
        ${this.hasExportErrors
          ? this.errorExportingTemplate()
          : html`
              <button
                type="button"
                class="btn btn-primary ssp-action"
                .disabled=${this.actionDisabled}
                @click="${this.handleAddRefsClick}"
              >
                ${this.actionLabel}
              </button>

              <div class="action-buttons--container">
                ${repeat(
                  this.apps,
                  app => app.id,
                  app => this.appButtonTemplate(app)
                )}
              </div>
            `}
        ${this.placeholderForDownloadLinkTemplate()}
      </div>
    `;
  }

  appButtonTemplate(app) {
    if (!app) return html``;

    return html`
      <div class="action-button--container">
        <div
          class="${app.selectedForExport ? 'action-button active' : 'action-button'}"
          @click="${() => this.handleAppSelection(app)}"
        >
          <div class="icon--container">
            <span>${app.acronym}</span>
          </div>

          <div class="action--label">${app.name}</div>
        </div>
      </div>
    `;
  }

  headerTemplate() {
    return html`<p class="help-text">
        This widget makes it easier to choose different applications and put them together into a single SSP for
        profiling. If the download doesn't work, check the "Profiler" app's list of referenced apps and use the "Export"
        option to fix the problem.
      </p>
      <p>
        <em class="secondary-text"
          >Note: Some applications may still be included in the SSP since they may be referenced by the chosen
          applications.</em
        >
      </p>`;
  }

  placeholderForDownloadLinkTemplate() {
    return html` <!-- this is required -->
      <div id="download-link-container"></div>`;
  }

  errorExportingTemplate() {
    return html`<p class="error-text">
        Unable to export the SSP! Please attempt a manual export of the 'profiler' application in order to view the
        problems.
      </p>

      <a class="navigate-to-app" href="/app-builder/${this.profilerApp.id}" type="button" class="btn btn-primary">Go to profiler app</button> `;
  }

  loader() {
    return html`
      <div class="container">
        <div class="swimlane-loader" id="swimlane-loader">
          <svg width="905" height="66" viewBox="0 0 905 66" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter
                id="filter0_d"
                x="0.287978"
                y="11.288"
                width="43.424"
                height="43.424"
                filterUnits="userSpaceOnUse"
                color-interpolation-filters="sRGB"
              >
                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset />
                <feGaussianBlur stdDeviation="6.85601" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.0784314 0 0 0 0 0.513726 0 0 0 0 1 0 0 0 0.8 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
              </filter>
              <filter
                id="filter1_d"
                x="861.288"
                y="11.288"
                width="43.424"
                height="43.424"
                filterUnits="userSpaceOnUse"
                color-interpolation-filters="sRGB"
              >
                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset />
                <feGaussianBlur stdDeviation="6.85601" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.0784314 0 0 0 0 0.513726 0 0 0 0 1 0 0 0 0.8 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
              </filter>
              <linearGradient id="paint0_linear" x1="22" y1="25" x2="22" y2="41" gradientUnits="userSpaceOnUse">
                <stop stop-color="#262C38" />
                <stop offset="1" stop-color="#12141A" />
              </linearGradient>
              <linearGradient id="paint1_linear" x1="883" y1="25" x2="883" y2="41" gradientUnits="userSpaceOnUse">
                <stop stop-color="#262C38" />
                <stop offset="1" stop-color="#12141A" />
              </linearGradient>
              <linearGradient
                id="paint2_linear"
                x1="173.597"
                y1="28.6764"
                x2="762"
                y2="28.6764"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="#02AAFF" />
                <stop offset="1" stop-color="#00FFF4" />
              </linearGradient>
            </defs>
            <path
              d="M30 32.9994H208.992C220.955 32.9994 222.257 24.2294 228.519 24.2294C237.886 24.2294 235.812 37.22 251.924 37.22C264.686 37.22 266.44 20.22 280 20.22C293.56 20.22 295.314 37.22 308.076 37.22C324.188 37.22 322.114 24.2294 331.481 24.2294C337.743 24.2294 339.045 32.9994 351.008 32.9994H417L428 33H432V19.8296C432 19.4498 432.172 19.0902 432.467 18.8523L453.024 2.2784C453.84 1.61968 455.052 2.20396 455.052 3.25573V19.2308C455.052 19.6109 454.88 19.9702 454.585 20.2084L443.907 28.8178L432 38.4177L441.879 46.372C442.562 46.9225 443.533 46.9225 444.216 46.372L453.133 39.183C454.065 38.4316 454.065 37.0073 453.133 36.2566L444.5 29.5M875 33.0525H696.009C684.045 33.0525 682.743 41.8225 676.481 41.8225C667.115 41.8225 669.188 28.8319 653.076 28.8319C640.314 28.8319 638.56 45.8319 625 45.8319C611.441 45.8319 609.686 28.8319 596.924 28.8319C580.812 28.8319 582.886 41.8225 573.52 41.8225C567.257 41.8225 565.955 33.0525 553.992 33.0525H488L477 33.0519H473V46.542C473 46.9222 472.828 47.2818 472.533 47.5197L451.976 64.0936C451.16 64.752 449.948 64.168 449.948 63.1159V47.1409C449.948 46.7611 450.12 46.4014 450.415 46.1635L461.093 37.5542L473 27.9539L463.121 20C462.439 19.4495 461.467 19.4495 460.784 20L451.867 27.189C450.935 27.94 450.935 29.3643 451.867 30.1154L460.413 37.0371"
              stroke="#1C2029"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <g filter="url(#filter0_d)">
              <circle cx="22" cy="33" r="8" fill="url(#paint0_linear)" />
              <circle cx="22" cy="33" r="7.08587" stroke="#02AAFF" stroke-width="1.82827" />
            </g>
            <g filter="url(#filter1_d)">
              <circle cx="883" cy="33" r="8" fill="url(#paint1_linear)" />
              <circle cx="883" cy="33" r="7.08587" stroke="#01FEF5" stroke-width="1.82827" />
            </g>
            <path
              class="loaderLine loaderLineLeft"
              d="M30 32.9994H208.992C220.955 32.9994 222.257 24.2294 228.519 24.2294C237.886 24.2294 235.812 37.22 251.924 37.22C264.686 37.22 266.44 20.22 280 20.22C293.56 20.22 295.314 37.22 308.076 37.22C324.188 37.22 322.114 24.2294 331.481 24.2294C337.743 24.2294 339.045 32.9994 351.008 32.9994H417L428 33H432V19.8296C432 19.4498 432.172 19.0902 432.467 18.8523L453.024 2.2784C453.84 1.61968 455.052 2.20396 455.052 3.25573V19.2308C455.052 19.6109 454.88 19.9702 454.585 20.2084L443.907 28.8178L432 38.4177L441.879 46.372C442.562 46.9225 443.533 46.9225 444.216 46.372L453.133 39.183C454.065 38.4316 454.065 37.0073 453.133 36.2566L444.5 29.5"
              stroke="url(#paint2_linear)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              class="loaderLine loaderLineRight"
              d="M875 33.0154H696.009C684.045 33.0154 682.743 41.7854 676.481 41.7854C667.115 41.7854 669.188 28.7948 653.076 28.7948C640.314 28.7948 638.56 45.7948 625 45.7948C611.441 45.7948 609.686 28.7948 596.924 28.7948C580.812 28.7948 582.886 41.7854 573.52 41.7854C567.257 41.7854 565.955 33.0154 553.992 33.0154H488L477 33.0148H473V46.5049C473 46.8851 472.828 47.2447 472.533 47.4826L451.976 64.0565C451.16 64.7148 449.948 64.1309 449.948 63.0788V47.1038C449.948 46.7239 450.12 46.3643 450.415 46.1264L461.093 37.5171L473 27.9168L463.121 19.9629C462.438 19.4124 461.467 19.4124 460.784 19.9629L451.867 27.1519C450.935 27.9029 450.935 29.3272 451.867 30.0783L460.413 37"
              stroke="url(#paint2_linear)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    `;
  }
}
