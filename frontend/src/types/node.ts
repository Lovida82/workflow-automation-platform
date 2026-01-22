// 노드 관련 타입 정의

export type NodeCategory =
  | 'input'
  | 'service'
  | 'process'
  | 'ai'
  | 'visualization'
  | 'output'
  | 'automation';

export type DataType =
  | 'any'
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'dataframe'
  | 'file';

export interface NodePort {
  id: string;
  label: string;
  type: DataType;
  required: boolean;
}

export interface NodeDefinition {
  type: string;
  category: NodeCategory;
  displayName: string;
  icon: string;
  description: string;
  inputs: NodePort[];
  outputs: NodePort[];
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
  isPremium: boolean;
  estimatedCost?: number;
  averageRuntime?: number;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
    status?: 'idle' | 'running' | 'success' | 'error';
    result?: any;
    error?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  config: Record<string, any>;
  isTemplate: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface Execution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  startedAt: any;
  completedAt?: any;
  durationMs?: number;
  result?: any;
  error?: string;
  logs: any[];
  nodeResults: Record<string, any>;
  triggerType: 'manual' | 'schedule' | 'api';
  triggeredBy?: string;
}
