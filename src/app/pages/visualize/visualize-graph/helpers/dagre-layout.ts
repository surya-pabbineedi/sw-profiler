import { Layout, Graph, Edge, Node, ClusterNode } from '@swimlane/ngx-graph';
import { id } from '@swimlane/ngx-ui';
// @ts-ignore
import * as dagre from 'dagre';

export enum Orientation {
  LEFT_TO_RIGHT = 'LR',
  RIGHT_TO_LEFT = 'RL',
  TOP_TO_BOTTOM = 'TB',
  BOTTOM_TO_TOM = 'BT'
}
export enum Alignment {
  CENTER = 'C',
  UP_LEFT = 'UL',
  UP_RIGHT = 'UR',
  DOWN_LEFT = 'DL',
  DOWN_RIGHT = 'DR'
}

export interface DagreSettings {
  orientation?: Orientation;
  marginX?: number;
  marginY?: number;
  edgePadding?: number;
  rankPadding?: number;
  nodePadding?: number;
  align?: Alignment;
  acyclicer?: 'greedy' | undefined;
  ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
  multigraph?: boolean;
  compound?: boolean;
}

export class DagreLayout implements Layout {
  defaultSettings: DagreSettings = {
    orientation: Orientation.LEFT_TO_RIGHT,
    marginX: 0,
    marginY: 0,
    edgePadding: 50,
    rankPadding: 50,
    nodePadding: 50,
    multigraph: true,
    compound: true,
    ranker: 'longest-path'
  };
  settings: DagreSettings = {};

  dagreGraph: any;
  dagreNodes: any;
  dagreEdges: any;

  run(graph: Graph): Graph {
    this.createDagreGraph(graph);
    dagre.layout(this.dagreGraph);

    graph.edgeLabels = this.dagreGraph._edgeLabels;

    for (const dagreNodeId in this.dagreGraph._nodes) {
      const dagreNode = this.dagreGraph._nodes[dagreNodeId];
      const node: any = graph.nodes.find(n => n.id === dagreNode.id);

      node.position = {
        x: dagreNode.x,
        y: dagreNode.y
      };
      node.dimension = {
        width: dagreNode.width,
        height: dagreNode.height
      };
    }

    // Change the edges to start from the right edge of the source node
    for (const id in graph.edgeLabels) {
      const edge = graph.edgeLabels[id];
      const dagreNode = this.dagreGraph._nodes[edge.source];
      if (edge.points) {
        edge.points[0].x = dagreNode.x + dagreNode.width / 2;
        edge.points[0].y = dagreNode.y;
      }
    }

    return graph;
  }

  updateEdge(graph: Graph, edge: Edge): Graph {
    const sourceNode: any = graph.nodes.find(n => n.id === edge.source);
    const targetNode: any = graph.nodes.find(n => n.id === edge.target);

    // determine new arrow position
    const dir = sourceNode.position.y <= targetNode.position.y ? -1 : 1;

    const startingPoint = {
      x: sourceNode.position.x + sourceNode.dimension.width / 2,
      y: sourceNode.position.y - dir * (sourceNode.dimension.height / 2)
    };
    const endingPoint = {
      x: targetNode.position.x,
      y: targetNode.position.y + dir * (targetNode.dimension.height / 2)
    };

    // generate new points
    edge.points = [startingPoint, endingPoint];
    return graph;
  }

  createDagreGraph(graph: Graph): any {
    const settings = Object.assign({}, this.defaultSettings, this.settings);
    this.dagreGraph = new dagre.graphlib.Graph({
      compound: settings.compound,
      multigraph: settings.multigraph
    });

    this.dagreGraph.setGraph({
      rankdir: settings.orientation,
      marginx: settings.marginX,
      marginy: settings.marginY,
      edgesep: settings.edgePadding,
      ranksep: settings.rankPadding,
      nodesep: settings.nodePadding,
      align: settings.align,
      acyclicer: settings.acyclicer,
      ranker: settings.ranker,
      multigraph: settings.multigraph,
      compound: settings.compound
    });

    // Default to assigning a new object as a label for each new edge.
    this.dagreGraph.setDefaultEdgeLabel(() => {
      return {
        /* empty */
      };
    });

    this.dagreNodes = graph.nodes.map((n: any) => {
      const node: any = Object.assign({}, n);
      node.width = n.dimension.width;
      node.height = n.dimension.height;
      node.x = n.position.x;
      node.y = n.position.y;
      return node;
    });

    this.dagreEdges = graph.edges.map(l => {
      const newLink: any = Object.assign({}, l);
      if (!newLink.id) {
        newLink.id = id();
      }

      return newLink;
    });

    for (const node of this.dagreNodes) {
      if (!node.width) {
        node.width = 20;
      }
      if (!node.height) {
        node.height = 30;
      }

      // update dagre
      this.dagreGraph.setNode(node.id, node);
    }

    // update dagre
    for (const edge of this.dagreEdges) {
      if (settings.multigraph) {
        this.dagreGraph.setEdge(edge.source, edge.target, edge, edge.id);
      } else {
        this.dagreGraph.setEdge(edge.source, edge.target);
      }
    }

    return this.dagreGraph;
  }
}
