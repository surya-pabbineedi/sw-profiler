import { NodeType } from 'src/common/enums/node-type.enum';
import { ClusterNode, Edge, Node } from '@swimlane/ngx-graph';
import { OutputType } from 'src/common/enums/task-output-type.enum';
import { id } from '@swimlane/ngx-ui';
import { Task } from 'src/common/models/task.model';
import { WorkflowStage, WorkflowAction, Workflow } from 'src/common/models/workflow.model';
import { Report } from 'src/common/models/report.model';
import { App } from 'src/common/models/application.model';
import { Dashboard, ReportCard } from 'src/common/models/dashboard.model';
import { DashboardCardTypes } from 'src/common/enums/dashboard-card-type.enum';
import { uniq } from 'lodash-es';
import { Workspace } from 'src/common/models/workspace.model';
export interface NodeMap {
  [key: string]: Node;
}

export const NODE_DIMENSION = {
  width: 150,
  height: 80
};

export const COMPACT_NODE_DIMENSION = {
  width: 100,
  height: 25
};

export const EXTRA_CMPACT_NODE_DIMENSION = {
  width: 25,
  height: 25
};

export interface Connection {
  id: string;
  direction?: 'outward' | 'inward';
  type: 'application' | 'task';
}

export class GraphHelper {
  static addIntegrationConnections(integration: Task, nodes: NodeMap) {
    let connections: Connection[] = [];
    if (integration?.outputs?.length > 0) {
      integration.outputs.forEach((output: any) => {
        switch (output.type) {
          case OutputType.insertUpdateRecord:
            connections.push({
              id: output.applicationId,
              direction: 'outward',
              type: 'application'
            });

            break;

          case OutputType.setFieldValue:
            connections.push({
              id: integration.applicationId,
              direction: 'outward',
              type: 'application'
            });

            break;

          case OutputType.referentialTask:
            connections.push({
              id: output.taskId,
              direction: 'outward',
              type: 'task'
            });
            break;

          case OutputType.email:
            connections.push({
              id: this.addSendEmailNode(integration, nodes),
              direction: 'outward',
              type: 'task'
            });

            break;

          case OutputType.saveToFile:
            connections.push({
              id: this.addSaveFileNode(integration, nodes),
              direction: 'outward',
              type: 'task'
            });
            break;

          default:
            break;
        }
      });
    }

    return connections;
  }

  static addIntegrationNodes(nodes: NodeMap, integrations: Task[]) {
    this.addCommonIntegrationNodes(nodes, integrations);

    const tasksWithConnections = integrations.filter(
      integration => integration.applicationId && integration.outputs?.length > 0
    );

    const taskWithMappings = tasksWithConnections.reduce((acc: any, task) => {
      acc[task.applicationId] = [...(acc[task.applicationId] || []), task];
      return acc;
    }, {});

    const executeAnotherTaskMappingIds = tasksWithConnections.flatMap(entry =>
      entry.outputs.filter(o => o.taskId).map(o => o.taskId)
    );

    const workflowIntegrationActions = Object.keys(nodes)
      .filter((nodeId: string) => nodes[nodeId].meta?.nodeType === NodeType.Workflow)
      .flatMap((nodeId: string) => nodes[nodeId].meta.connectionNodeIds);

    const doNotGroupTheseTaskIDs = [...workflowIntegrationActions, ...executeAnotherTaskMappingIds];

    Object.keys(taskWithMappings).forEach(appId => {
      const tasks: Task[] = taskWithMappings[appId];

      // if the task is related only it's parent and has no other connections then group them all
      const taskIdsOnlyHasMappingsToCurrentApp = tasks
        .filter((task: Task) => {
          return (
            task.outputs?.length === 1 &&
            !doNotGroupTheseTaskIDs.includes(task.id) &&
            ([OutputType.setFieldValue].includes(task.outputs[0].type) ||
              ([OutputType.insertUpdateRecord].includes(task.outputs[0].type) &&
                task.applicationId === task.outputs[0].applicationId))
          );
        })
        .map((task: Task) => task.id);

      const taskGroupId = `${appId}-task-g`;
      if (taskIdsOnlyHasMappingsToCurrentApp.length > 1) {
        nodes[taskGroupId] = {
          id: taskGroupId,
          dimension: COMPACT_NODE_DIMENSION,
          meta: {
            nodeType: NodeType.IntegrationGroup,
            allowExpandCollpase: true,
            expanded: false,
            connectionNodeIds: [appId]
          },
          label: `${taskIdsOnlyHasMappingsToCurrentApp.length} Tasks`
        };
      }

      tasks.map((integration: Task) => {
        const integrationNode: Node = this.getIntegrationNode(integration);
        nodes[integrationNode.id] = integrationNode;

        const connections = this.addIntegrationConnections(integration, nodes);
        integrationNode.meta.connectionNodeIds = taskIdsOnlyHasMappingsToCurrentApp.includes(integration.id)
          ? [taskGroupId]
          : [...connections.map(c => c.id)];
        integrationNode.meta.connections = connections;
      });
    });
  }

  static addCommonIntegrationNodes(nodes: NodeMap, integrations: Task[]) {
    const commonTasks = integrations.filter(task => !task.applicationId);
    if (commonTasks.length === 0) {
      return;
    }

    const commonTaskNodeId = id();
    const rootNode: any = Object.values(nodes).find((entry: any) => entry.meta.nodeType === NodeType.Root);
    nodes[commonTaskNodeId] = {
      id: commonTaskNodeId,
      dimension: COMPACT_NODE_DIMENSION,
      meta: {
        nodeType: NodeType.Common,
        allowExpandCollpase: true,
        expanded: true,
        connectionNodeIds: [rootNode!.id]
      },
      label: 'Common'
    };

    commonTasks.forEach(integration => {
      const integrationNode: Node = this.getIntegrationNode(integration);
      nodes[integrationNode.id] = integrationNode;

      const connections = this.addIntegrationConnections(integration, nodes);
      integrationNode.meta.connectionNodeIds = [commonTaskNodeId, ...connections.map(c => c.id)];
      integrationNode.meta.connections = connections;
    });

    return nodes;
  }

  static addDashboards(nodes: any, dashboards: Dashboard[], apps: App[], existingNodeMap: NodeMap) {
    let dashboardsGrouped = false;
    if (dashboards.length > 1) {
      dashboardsGrouped = true;
      const workspaceIds = dashboards.flatMap(dashboard => dashboard.workspaces || []);
      workspaceIds.forEach(parentId => {
        const pId = `${parentId}-dashboard-g`;
        nodes[pId] = {
          id: pId,
          dimension: COMPACT_NODE_DIMENSION,
          meta: {
            nodeType: NodeType.DashboardGroup,
            data: {},
            allowExpandCollpase: true,
            expanded: false,
            connectionNodeIds: [parentId]
          },
          label: `${dashboards.filter(d => d.workspaces.includes(parentId))?.length} Dashboards`
        };
      });
    }

    dashboards.forEach(dashboard => {
      const node: Node = {
        id: dashboard.id,
        dimension: NODE_DIMENSION,
        meta: {
          nodeType: NodeType.Dashboard,
          data: {
            ...dashboard,
            reportsCount: dashboard.items?.filter(
              item => item.cardType.toLowerCase() === DashboardCardTypes.Report.toLowerCase()
            )?.length,
            htmlsCount: dashboard.items?.filter(
              item => item.cardType.toLowerCase() === DashboardCardTypes.Html.toLowerCase()
            )?.length,
            usageStatisticCount: dashboard.items?.filter(
              item => item.cardType.toLowerCase() === DashboardCardTypes.UsageStatistic.toLowerCase()
            )?.length
          },
          allowExpandCollpase: dashboard.items.length > 0,
          expanded: existingNodeMap[dashboard.id]?.meta?.expanded ?? false,
          connectionNodeIds: dashboardsGrouped
            ? (dashboard.workspaces || []).map(wId => `${wId}-dashboard-g`)
            : dashboard.workspaces || []
        },
        label: dashboard.name
      };

      nodes[dashboard.id] = node;

      const dashboardHtmlCards = dashboard.items.filter(
        (entry: { cardType: string }) => entry.cardType.toLowerCase() === DashboardCardTypes.Html.toLowerCase()
      );

      if (dashboardHtmlCards?.length > 0) {
        this.addDashboardItemsGroupNode(nodes, dashboardHtmlCards, dashboard, NodeType.HTMLCard);
      }

      const dashboardUsageStatisticCards = dashboard.items.filter(
        (entry: { cardType: string }) =>
          entry.cardType.toLowerCase() === DashboardCardTypes.UsageStatistic.toLowerCase()
      );

      if (dashboardUsageStatisticCards?.length > 0) {
        this.addDashboardItemsGroupNode(
          nodes,
          dashboardUsageStatisticCards,
          dashboard,
          NodeType.UsageStatisticCard,
          apps
        );
      }
    });
  }

  static addApps(
    nodes: any,
    workspaces: Workspace[],
    apps: App[],
    workflows: Workflow[],
    reports: Report[],
    appsEntities: { [key: string]: any }
  ) {
    apps.forEach(app => {
      const refFields = app.fields
        .filter(field => field.fieldType.toLowerCase() === 'reference' && field.targetId !== app.id)
        .map(field => field.targetId);

      const workspaceParents =
        workspaces.filter(workspace => workspace.applications?.includes(app.id)).map(workspace => workspace.id) || [];

      const appReports = reports.filter(report => report.applicationIds?.includes(app.id));
      const node: Node = {
        id: app.id,
        dimension: NODE_DIMENSION,
        meta: {
          nodeType: NodeType.Application,
          name: app.name,
          data: {
            ...app,
            flattenedLayoutCount: appsEntities[app.id].flattenedLayouts?.length,
            reportCount: appReports.length
          },
          allowExpandCollpase: false,
          allowViewInfo: true,
          expanded: true,
          connectionNodeIds: [...workspaceParents, ...(refFields || [])]
        },
        label: app.name
      };

      nodes[app.id] = node;

      const workflow = workflows?.find(workflow => workflow.applicationId === app.id);
      if (workflow && workflow.stages?.length > 0) {
        GraphHelper.addWorkflowNode(workflow, nodes);
      }
    });
  }

  private static addDashboardItemsGroupNode(
    nodes: any,
    itemsToAdd: any[],
    parent: any,
    nodeType: NodeType,
    apps: App[] = []
  ) {
    let htmlCardsGroupId = itemsToAdd?.length > 1 ? `${parent.id}-dashboard-${nodeType}g` : parent.id;
    // create a group node if there are more than 1 child node
    if (itemsToAdd?.length > 1) {
      const label = `${itemsToAdd.length} ${nodeType === NodeType.HTMLCard ? 'HTML' : 'STATISTICS'}`;
      nodes[htmlCardsGroupId] = {
        id: htmlCardsGroupId,
        dimension: COMPACT_NODE_DIMENSION,
        meta: {
          nodeType: nodeType === NodeType.HTMLCard ? NodeType.HTMLCardGroup : NodeType.UsageStatisticCardGroup,
          name: label,
          data: { count: itemsToAdd.length },
          expanded: false,
          connectionNodeIds: [parent.id] || []
        },
        label
      };
    }

    itemsToAdd.forEach((entry: any) => {
      const hasAppFilters = nodeType === NodeType.UsageStatisticCard && entry.appsFilter?.length > 0;
      const childNode: Node = {
        id: `${entry.id}-${nodeType}`,
        dimension: NODE_DIMENSION,
        meta: {
          nodeType,
          nodeTypeLabel: nodeType === NodeType.UsageStatisticCard ? 'STATISTICS CARD' : 'HTML CARD',
          name: entry.name,
          data: { ...entry },
          expanded: true,
          allowExpandCollpase: hasAppFilters,
          allowViewInfo: nodeType === NodeType.HTMLCard,
          connectionNodeIds: [htmlCardsGroupId]
        },
        label: entry.name
      };

      nodes[childNode.id] = childNode;

      if (hasAppFilters) {
        entry.appsFilter
          .map((appId: string) => apps.find(app => app.id === appId))
          .filter((app: App) => !!app)
          .forEach((app: App) => {
            // app nodes should already be available
            if (nodes[app.id]?.meta?.connectionNodeIds?.length > 0) {
              nodes[app.id].meta.connectionNodeIds = [...nodes[app.id].meta.connectionNodeIds, childNode.id];
            } else {
              const appCardNode: Node = {
                id: `${entry.id}-appFilter`,
                dimension: NODE_DIMENSION,
                meta: {
                  nodeType: NodeType.Application,
                  name: app.name,
                  data: { ...app },
                  expanded: true,
                  connectionNodeIds: [childNode.id] || []
                },
                label: app.name
              };
              nodes[appCardNode.id] = appCardNode;
            }
          });
      }
    });
  }

  private static getFlattenedActionsFromStages(stages: WorkflowStage[]) {
    const workflowActions: WorkflowAction[] = [];
    stages.forEach(({ stages, actions }) => {
      if (actions?.length > 0) {
        workflowActions.push(...actions);
      }

      if (stages?.length > 0) {
        workflowActions.push(...this.getFlattenedActionsFromStages(stages));
      }
    });

    return workflowActions;
  }

  static addWorkflowNode(workflow: Workflow, nodes: NodeMap) {
    const workflowActions = this.getFlattenedActionsFromStages(workflow.stages);
    const integrationActions = workflowActions
      .filter(action => action.actionType?.toLowerCase() === 'integration')
      .map(action => action.taskId);

    const workflowNode: Node = {
      id: workflow.id,
      dimension: EXTRA_CMPACT_NODE_DIMENSION,
      meta: {
        nodeType: NodeType.Workflow,
        data: {},
        allowExpandCollpase: false,
        expanded: true,
        connectionNodeIds: [workflow.applicationId, ...integrationActions]
      },
      label: `Workflow`
    };

    nodes[workflowNode.id] = workflowNode;
  }

  static addReports(nodes: NodeMap, reports: Report[], apps: App[], dashboards: Dashboard[]) {
    // separate dashboard reports
    // const dashboardReportIds = dashboards
    //   .flatMap(d => d.items)
    //   .filter((entry: { cardType: string }) => entry.cardType.toLowerCase() === DashboardCardTypes.Report.toLowerCase())
    //   .map(entry => (entry as ReportCard).reportId);

    apps.forEach(app => {
      const appReports = reports.filter(report => report.applicationIds?.includes(app.id)); // && !dashboardReportIds.includes(report.id)

      if (appReports?.length > 0) {
        this.addReportGroupNode(nodes, appReports, reports, app, NodeType.Application);
      }
    });

    dashboards.forEach(dashboard => {
      const dashboardReports = dashboard.items.filter(
        (entry: { cardType: string }) => entry.cardType.toLowerCase() === DashboardCardTypes.Report.toLowerCase()
      );

      if (dashboardReports?.length > 0) {
        this.addReportGroupNode(nodes, dashboardReports, reports, dashboard, NodeType.Dashboard);
      }
    });
  }

  static getClustres(nodes: Node[], edges: Edge[]): ClusterNode[] {
    const clusters: ClusterNode[] = [];
    // const applicationNodes = nodes.filter(n => n.meta.nodeType === NodeType.Application);
    // applicationNodes.forEach(applicationNode => {
    //   clusters.push({
    //     id: `${applicationNode.id}-cluster`,
    //     childNodeIds: nodes
    //       .filter(
    //         node =>
    //           node.meta.nodeType === NodeType.Integration ||
    //           node.meta.nodeType === NodeType.Workspace ||
    //           node.meta.nodeType === NodeType.ReportGroup
    //       )
    //       .filter(node => node.meta.connectionNodeIds?.includes(applicationNode.id))
    //       .map(node => node.id),
    //     label: applicationNode.label
    //   });
    // });

    // clusters.push(
    //   {
    //     id: 'Workspace-cluster',
    //     childNodeIds: nodes
    //       .filter(node => node.meta.nodeType === NodeType.Workspace || node.meta.nodeType === NodeType.DashboardGroup)
    //       .map(node => node.id),
    //     label: `Workspaces`
    //   },
    //   {
    //     id: 'application-cluster',
    //     childNodeIds: nodes
    //       .filter(node => node.meta.nodeType === NodeType.Application || node.meta.nodeType === NodeType.Workflow)
    //       .map(node => node.id),
    //     label: `Applications`
    //   },
    //   {
    //     id: 'group-cluster',
    //     childNodeIds: nodes
    //       .filter(
    //         node => node.meta.nodeType === NodeType.IntegrationGroup || node.meta.nodeType === NodeType.ReportGroup
    //       )
    //       .map(node => node.id),
    //     label: `Groups`
    //   },
    //   {
    //     id: 'dashboard-cluster',
    //     childNodeIds: nodes.filter(node => node.meta.nodeType === NodeType.Dashboard).map(node => node.id),
    //     label: `Dashboards`
    //   },
    //   {
    //     id: 'integration-cluster',
    //     childNodeIds: nodes.filter(node => node.meta.nodeType === NodeType.Integration).map(node => node.id),
    //     label: `Integrations`
    //   }
    //   // {
    //   //   id: 'others',
    //   //   childNodeIds: nodes
    //   //     .filter(
    //   //       node =>
    //   //         ![
    //   //           NodeType.Workspace,
    //   //           NodeType.Application,
    //   //           NodeType.Dashboard,
    //   //           NodeType.DashboardGroup,
    //   //           NodeType.Report,
    //   //           NodeType.ReportGroup,
    //   //           NodeType.Integration,
    //   //           NodeType.IntegrationGroup,
    //   //           NodeType.Workflow
    //   //         ].includes(node.meta.nodeType)
    //   //     )
    //   //     .map(node => node.id),
    //   //   label: `Others`
    //   // }
    // );

    return clusters;
  }

  private static addReportGroupNode(
    nodes: NodeMap,
    itemsToAdd: any[],
    reports: Report[],
    parent: App | Dashboard,
    parentType: NodeType
  ) {
    const reportGroupId = `${parent.id}-${parentType}-rg`;
    const label = `${itemsToAdd.length} Reports`;
    nodes[reportGroupId] = {
      id: reportGroupId,
      dimension: COMPACT_NODE_DIMENSION,
      meta: {
        nodeType: NodeType.ReportGroup,
        name: label,
        data: {
          parent,
          reports: itemsToAdd.map(entry =>
            reports.find(report => report.id === (parentType === NodeType.Dashboard ? entry.reportId : entry.id))
          ),
          count: itemsToAdd.length
        },
        allowViewInfo: parentType === NodeType.Application,
        allowExpandCollpase: parentType === NodeType.Dashboard,
        expanded: parentType === NodeType.Application,
        connectionNodeIds: [parent.id]
      },
      label
    };

    // allow adding report nodes for only dashboards
    if (parentType === NodeType.Dashboard) {
      itemsToAdd.forEach((entry: any) => {
        const reportId = parentType === NodeType.Dashboard ? entry.reportId : entry.id;
        const report = reports.find(report => report.id === reportId);
        if (report) {
          // if there is already a report added as part of app then link the nodes
          const nodeReportId = reportId;
          if (nodes[nodeReportId]?.meta?.connectionNodeIds?.length > 0) {
            nodes[nodeReportId].meta.connectionNodeIds = [...nodes[nodeReportId].meta.connectionNodeIds, reportGroupId];
          } else {
            const reportNode: Node = {
              id: nodeReportId,
              dimension: NODE_DIMENSION,
              meta: {
                nodeType: NodeType.Report,
                name: entry.name,
                data: { parent: entry, report },
                expanded: true,
                allowViewInfo: true,
                connectionNodeIds: [reportGroupId]
              },
              label: parentType === NodeType.Dashboard ? `${entry.name} - ${report.name}` : report.name
            };

            nodes[reportNode.id] = reportNode;
          }
        }
      });
    }
  }

  private static getIntegrationAtttributes(integration: any) {
    return {
      isScriptBased: integration.action?.type?.startsWith('python') || integration.action?.type === 'powershell',
      isPackaged: integration.action?.type === 'packaged',
      isApi: integration.action?.type === 'api'
    };
  }

  private static addSendEmailNode(integration: Task, nodes: NodeMap) {
    const emailNode: Node = {
      id: id(),
      dimension: EXTRA_CMPACT_NODE_DIMENSION,
      meta: {
        nodeType: NodeType.SendEmail,
        data: { integration },
        allowExpandCollpase: false,
        expanded: false,
        connectionNodeIds: [integration.id]
      },
      label: `Send Email`
    };

    nodes[emailNode.id] = emailNode;

    return emailNode.id;
  }

  private static addSaveFileNode(integration: Task, nodes: NodeMap) {
    const saveFileNode: Node = {
      id: id(),
      dimension: EXTRA_CMPACT_NODE_DIMENSION,
      meta: {
        nodeType: NodeType.SaveToFile,
        data: { integration },
        allowExpandCollpase: false,
        expanded: false,
        connectionNodeIds: [integration.id]
      },
      label: `Save To File`
    };

    nodes[saveFileNode.id] = saveFileNode;

    return saveFileNode.id;
  }

  private static getIntegrationNode(integration: Task) {
    const integrationNode: Node = {
      id: integration.id,
      dimension: COMPACT_NODE_DIMENSION,
      meta: {
        nodeType: NodeType.Integration,
        data: {
          ...integration,
          ...this.getIntegrationAtttributes(integration)
        },
        allowExpandCollpase: false,
        allowViewInfo: true,
        expanded: true,
        connectionNodeIds: []
      },
      label: integration.name
    };

    return integrationNode;
  }
}
