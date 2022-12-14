import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, HostListener, Input, TemplateRef, ViewChild } from '@angular/core';

import { Node, Edge, DagreSettings, Orientation, NgxGraphModule, ClusterNode } from '@swimlane/ngx-graph';
import { IconModule, id, NgxUIModule } from '@swimlane/ngx-ui';
import { Subject } from 'rxjs';

import { App } from 'src/common/models/application.model';
import { Dashboard } from 'src/common/models/dashboard.model';
import { Report } from 'src/common/models/report.model';
import { Workspace } from 'src/common/models/workspace.model';
import { DagreLayout } from './helpers/dagre-layout';
import { NodeType } from 'src/common/enums/node-type.enum';

import * as d3Shape from 'd3-shape';

import { ProfilerStore } from 'src/common/store/profiler.store';

import { DashboardCardTypes } from 'src/common/enums/dashboard-card-type.enum';
import { Workflow } from 'src/common/models/workflow.model';
import { GraphActionsComponent } from './graph-actions/graph-actions.component';
import { GraphHelper, NODE_DIMENSION, Connection, COMPACT_NODE_DIMENSION, NodeMap } from './helpers/graph-helper';
import { ReportSummaryComponent } from '../../summary/entity-summary/report-summary/report-summary.component';
import { TaskSummaryComponent } from '../../summary/entity-summary/task-summary/task-summary.component';
import { LayoutSummaryComponent } from '../../summary/entity-summary/layout-summary/layout-summary.component';
import { ApplicationSummaryComponent } from '../../summary/entity-summary/application-summary/application-summary.component';
import { WorkspaceSummaryComponent } from '../../summary/entity-summary/workspace-summary/workspace-summary.component';
import { NavigationStore } from 'src/common/store/navigation.store';
import { Task } from 'src/common/models/task.model';
import groupBy from 'lodash-es/groupBy';
import { uniq } from 'lodash-es';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-visualize-graph',
  templateUrl: './visualize-graph.component.html',
  styleUrls: ['./visualize-graph.component.scss'],
  imports: [
    NgxUIModule,
    HttpClientModule,
    IconModule,
    NgxGraphModule,
    GraphActionsComponent,
    ReportSummaryComponent,
    TaskSummaryComponent,
    LayoutSummaryComponent,
    ApplicationSummaryComponent,
    WorkspaceSummaryComponent
  ]
})
export class VisualizeGraphComponent {
  @Input()
  workspaces!: Workspace[];
  @Input()
  dashboards!: Dashboard[];
  @Input()
  apps!: App[];
  @Input() tasks!: any;
  @Input()
  reports!: Report[];
  @Input() workflows!: Workflow[];
  @Input() appsEntities!: { [key: string]: any };

  currentZoomLevel = 1;
  layout: any;
  layoutSettings: DagreSettings = {
    orientation: Orientation.TOP_TO_BOTTOM
  };
  clusters: ClusterNode[] = [];

  Orientation = Orientation;

  NodeType = NodeType;

  nodesMap: Record<string, Node> = {};
  nodes: Node[] = [];
  edges: Edge[] = [];
  selectedNode!: Node;
  selectedEdge!: Edge;
  mouseOverNode: Node | undefined;

  centerGraph$: Subject<boolean> = new Subject<boolean>();
  fitGraph$: Subject<boolean> = new Subject<boolean>();
  update$: Subject<boolean> = new Subject<boolean>();
  panToNode$: Subject<string> = new Subject<string>();
  curve = d3Shape.curveBundle.beta(1);

  @ViewChild('tmplReportSummary', { static: false }) tmplReportSummary!: TemplateRef<any>;
  @ViewChild('tmplTaskSummary', { static: false }) tmplTaskSummary!: TemplateRef<any>;
  @ViewChild('tmplLayoutSummary', { static: false }) tmplLayoutSummary!: TemplateRef<any>;
  @ViewChild('tmplAppSummary', { static: false }) tmplAppSummary!: TemplateRef<any>;
  @ViewChild('tmplWorkspaceSummary', { static: false }) tmplWorkspaceSummary!: TemplateRef<any>;

  constructor(private readonly store: ProfilerStore, private readonly navStore: NavigationStore) {}

  async ngOnInit() {
    this.store.loadEntities$();
    await this.initialize();

    setTimeout(() => {
      this.centerGraph();
    }, 100);
  }

  async initialize() {
    this.layout = new DagreLayout();
    this.layout.settings = this.layoutSettings;

    this.nodesMap = this.getGraphNodes(
      {
        workspaces: this.workspaces,
        apps: this.apps,
        dashboards: this.dashboards,
        reports: this.reports,
        integrations: this.tasks,
        workflows: this.workflows,
        appsEntities: this.appsEntities
      },
      this.nodesMap
    );

    this.drawGraph();
  }

  drawGraph() {
    const { nodes, edges } = this.createGraph(this.nodesMap);

    this.clusters = GraphHelper.getClustres(nodes, edges);

    this.nodes = nodes;
    this.edges = edges;
  }

  isAllParentsCollapsed(nodeId: string, parentIds: string[] = []): boolean {
    const node = this.nodesMap[nodeId];

    // same node should be a parent to itself
    if (node.meta?.connectionNodeIds?.includes(nodeId)) {
      console.error(`Node ${nodeId} cannot refrence itself as parent`, this.nodesMap[nodeId]?.meta?.connectionNodeIds);
      return false;
    }

    return node.meta?.connectionNodeIds?.every(
      (parentId: string) => !this.nodesMap[parentId]?.meta?.expanded || this.isAllParentsCollapsed(parentId, parentIds)
    );
  }

  toggleNodeExpand(incomingEvent: Event, incomingNode: Node) {
    incomingNode.meta.expanded = !incomingNode.meta.expanded;

    if (incomingNode.meta.nodeType === NodeType.ReportGroup) {
      const reports: Report[] = incomingNode.meta?.data?.reports;
      reports.forEach(report => {
        const groupIds = (report.applicationIds || []).map(appId => `${appId}-application-rg`);
        this.nodesMap[report.id].meta.connectionNodeIds = uniq([
          ...this.nodesMap[report.id]?.meta.connectionNodeIds,
          ...[incomingNode.meta.expanded ? groupIds : []]
        ]);
      });
    }

    this.drawGraph();
    this.update$.next(true);

    setTimeout(() => {
      this.panToNode$.next(this.selectedNode?.id);
    }, 100);
  }

  showNodeInfo(incomingEvent: Event, incomingNode: Node) {
    incomingEvent.stopPropagation();

    switch (incomingNode.meta?.nodeType) {
      case NodeType.Application:
        this.navStore.showAppSummary$({
          appId: incomingNode.meta.data.id,
          template: this.tmplAppSummary
        });
        break;

      case NodeType.Workspace:
        this.navStore.showWorkspaceSummary$({
          workspaceId: incomingNode.meta.data.id,
          template: this.tmplWorkspaceSummary
        });
        break;

      case NodeType.ReportGroup:
        this.navStore.showAppSummary$({
          appId: incomingNode.meta.data.parent.id,
          template: this.tmplAppSummary
        });
        break;

      case NodeType.Report:
        this.navStore.showReportSummary$({
          reportId: incomingNode.meta.data.report.id,
          tmplReportSummary: this.tmplReportSummary
        });
        break;

      case NodeType.Integration:
        this.navStore.showTaskSummary$({
          taskId: incomingNode.meta.data.id,
          template: this.tmplTaskSummary
        });
        break;

      case NodeType.HTMLCard:
      case NodeType.UsageStatisticCard:
        this.navStore.showDashboardItemSummary$({
          item: incomingNode.meta.data,
          template: this.tmplLayoutSummary
        });
        break;

      default:
        break;
    }
  }

  selectNode(incomingNode: Node) {
    this.selectedNode = incomingNode;
  }

  onNodeMouseOver(incmoingEvent: Event, node: Node) {
    this.mouseOverNode = node;
  }

  onNodeMouseOut(incmoingEvent: Event, node: Node) {
    this.mouseOverNode = undefined;
  }

  private getRootNode() {
    const defaultNode = Object.values(this.nodesMap).find(entry => entry.meta.nodeType === NodeType.Root);

    if (defaultNode) {
      return defaultNode;
    }

    const defaultNodeId = id();
    return {
      id: defaultNodeId,
      dimension: NODE_DIMENSION,
      meta: {
        nodeType: NodeType.Root,
        name: 'Swimlane',
        expanded: true,
        connectionNodeIds: undefined
      },
      label: 'Swimlane'
    };
  }

  private getGraphNodes(
    entities: {
      workspaces: Workspace[];
      apps: App[];
      dashboards: Dashboard[];
      reports: Report[];
      integrations: Task[];
      workflows: Workflow[];
      appsEntities: { [key: string]: any };
    },
    existingNodeMap: Record<string, Node> = {}
  ) {
    const { workspaces, apps, dashboards, reports, integrations, workflows, appsEntities } = entities;

    const nodes = this.addWorkspaces(workspaces, existingNodeMap);

    GraphHelper.addApps(nodes, workspaces, apps, workflows, reports, appsEntities);
    GraphHelper.addDashboards(nodes, dashboards, apps, existingNodeMap);
    GraphHelper.addReports(nodes, reports, apps, dashboards);
    GraphHelper.addIntegrationNodes(nodes, integrations);

    return nodes;
  }

  private createGraph(nodeMap: Record<string, Node>): {
    nodes: Node[];
    edges: Edge[];
  } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    for (const id in nodeMap) {
      const node = nodeMap[id];
      const isAllParentsCollapsed = this.isAllParentsCollapsed(id);
      const connectionNodeIds: string[] = node.meta?.connectionNodeIds || [];

      if (isAllParentsCollapsed) {
        continue;
      }

      nodes.push(node);

      connectionNodeIds.forEach(connectionId => {
        const sourceNode = nodeMap[connectionId];
        if (sourceNode?.meta.expanded && !this.isAllParentsCollapsed(sourceNode.id)) {
          edges.push(this.getEdge(sourceNode, node));
        }
      });
    }

    return { nodes, edges };
  }

  private getEdge(sourceNode: Node, targetNode: Node) {
    const isIntegration =
      sourceNode.meta?.nodeType === NodeType.Integration || targetNode.meta?.nodeType === NodeType.Integration;

    const edge: Edge = {
      id: id(),
      source: sourceNode.id,
      target: targetNode.id,
      label: `${sourceNode.label} - ${targetNode.label}`,
      data: {
        source: sourceNode,
        target: targetNode,
        isIntegration
      }
    };

    if (isIntegration) {
      const connections: Connection[] = targetNode.meta?.connections || [];
      const connection = connections.find(c => c.id === sourceNode.id);

      edge.data.isOutputMapping = connection ? true : false;
    }

    return edge;
  }

  private addWorkspaces(workspaces: Workspace[], existingNodeMap: any) {
    const rootNode = this.getRootNode();

    const nodes: NodeMap = {
      [rootNode.id]: rootNode
    };

    workspaces.forEach((workspace: Workspace) => {
      const node: Node = {
        id: workspace.id,
        dimension: NODE_DIMENSION,
        meta: {
          nodeType: NodeType.Workspace,
          name: workspace.name,
          data: { ...workspace },
          allowExpandCollpase: false, //(workspace.applications?.length || 0) + (workspace.dashboards?.length || 0) > 0,
          allowViewInfo: true,
          expanded: existingNodeMap[workspace.id]?.meta?.expanded ?? true,
          connectionNodeIds: [rootNode.id]
        },
        label: workspace.name
      };

      nodes[workspace.id] = node;
    });

    return nodes;
  }

  centerGraph(): void {
    this.centerGraph$.next(true);
    this.update$.next(true);
  }

  fitGraph(): void {
    this.fitGraph$.next(true);
    this.centerGraph();
  }

  selectEdge(edge: Edge) {
    this.selectedEdge = edge;
  }

  toggleOrientation(orientation = Orientation.LEFT_TO_RIGHT) {
    this.layoutSettings = {
      orientation
    };
  }
}
