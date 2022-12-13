import { OutputType } from "../enums/task-output-type.enum";

export interface OutputVariable {
  name: string;
  description: string;
  outputType: string;
  disableEdit: boolean;
  isSystem: boolean;
}

export interface Descriptor {
  description: string;
  actionType: string;
  family: string;
  base64Image: string;
  readonly: boolean;
  pythonVersion: string;
  availableOutputVariables: { [key: string]: OutputVariable };
  availableOutputTypes: string[];
  inputParameters: any;
  meta: any;
  isSchemaDriven: boolean;
  createdDate: Date;
  modifiedDate: Date;
  id: string;
  name: string;
  disabled: boolean;
}

export interface Action {
  type: string;
  descriptor: Descriptor;
  readonly: boolean;
  script: string;
}

export interface InputMapping {
  type: string;
  key: string;
  value: string;
  example: string;
  addMissing: boolean;
  unixEpochUnit: string;
  enableDeletionOnNull: boolean;
  dataFormat: string;
  userFormat: string;
  listModificationType: string;
}

export interface Mapping {
  type: string;
  key: string;
  value: string;
  addMissing: boolean;
  unixEpochUnit: string;
  enableDeletionOnNull: boolean;
  dataFormat: string;
  userFormat: string;
  listModificationType: string;
}

export interface TaskOutput {
  type: OutputType;
  mappings: Mapping[];
  applicationId?: string;
  taskId?: string;
}

export interface Task {
  applicationId: string;
  action: Action;
  inputMapping: InputMapping[];
  isSystemTask: boolean;
  outputs: TaskOutput[];
  triggers: any[];
  createdDate: Date;
  modifiedDate: Date;
  imported: boolean;
  valid: boolean;
  uid: string;
  version: number;
  id: string;
  name: string;
  disabled: boolean;
}
