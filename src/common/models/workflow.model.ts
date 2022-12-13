export interface WorkflowCondition {
  conditionType: string;
  fieldId: string;
  referenceFieldConjunction: number;
  value: string;
  isCaseSensitive: boolean;
}

export interface WorkflowAction {
  fieldStates: { [key: string]: string }[];
  actionType: string;
  parentId: string;
  id: string;
  name: string;
  disabled: boolean;
  layoutActions: any;
  taskId: string;
  autoRun?: boolean;
}

export interface WorkflowStage {
  id: string;
  name: string;
  disabled: boolean;
  parentId: string;
  conditionType: string;
  evalType: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  repeats: any[];
  stages: WorkflowStage[];
}

export interface Workflow {
  applicationId: string;
  stages: WorkflowStage[];
  uid: string;
  version: number;
  id: string;
  disabled: boolean;
}
