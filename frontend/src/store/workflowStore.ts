// Zustand 워크플로우 상태 관리
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { NODE_REGISTRY } from '../lib/nodes/registry';

interface WorkflowState {
  // 현재 워크플로우 정보
  workflowId: string | null;
  workflowName: string;
  workflowDescription: string;

  // 노드와 엣지
  nodes: Node[];
  edges: Edge[];

  // 선택된 노드
  selectedNodeId: string | null;

  // 실행 상태
  isExecuting: boolean;
  executionId: string | null;
  nodeStatuses: Record<string, 'idle' | 'running' | 'success' | 'error'>;
  nodeResults: Record<string, any>;
  showExecutionPanel: boolean; // 실행 패널 표시 여부

  // 액션
  setWorkflow: (id: string, name: string, description: string, nodes: Node[], edges: Edge[]) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, any>) => void;
  updateNodeData: (nodeId: string, data: Record<string, any>) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  selectNode: (nodeId: string | null) => void;

  // 실행 관련
  setExecuting: (isExecuting: boolean) => void;
  setExecutionId: (executionId: string | null) => void;
  updateNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;
  updateNodeResult: (nodeId: string, result: any) => void;
  resetExecution: () => void;
  setShowExecutionPanel: (show: boolean) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  // 초기 상태
  workflowId: null,
  workflowName: '새 워크플로우',
  workflowDescription: '',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isExecuting: false,
  executionId: null,
  nodeStatuses: {},
  nodeResults: {},
  showExecutionPanel: false,

  // 워크플로우 설정
  setWorkflow: (id, name, description, nodes, edges) =>
    set({
      workflowId: id,
      workflowName: name,
      workflowDescription: description,
      nodes,
      edges,
    }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // ReactFlow 변경 핸들러
  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: uuidv4(),
          animated: true,
          style: { strokeWidth: 2 },
        },
        state.edges
      ),
    })),

  // 노드 추가
  addNode: (type, position) => {
    const nodeDef = NODE_REGISTRY[type];
    if (!nodeDef) return;

    const newNode: Node = {
      id: uuidv4(),
      type: 'customNode',
      position,
      data: {
        nodeType: type,
        label: nodeDef.displayName,
        config: { ...nodeDef.defaultConfig },
        status: 'idle',
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newNode.id,
    }));
  },

  // 노드 설정 업데이트
  updateNodeConfig: (nodeId, config) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...config } } }
          : node
      ),
    })),

  // 노드 데이터 업데이트 (업로드된 파일 데이터 등)
  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    })),

  // 노드 삭제
  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    })),

  // 엣지(연결) 삭제
  deleteEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    })),

  // 노드 선택
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  // 실행 관련
  setExecuting: (isExecuting) => set({ isExecuting }),
  setExecutionId: (executionId) => set({ executionId }),

  updateNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodeStatuses: { ...state.nodeStatuses, [nodeId]: status },
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, status } } : node
      ),
    })),

  updateNodeResult: (nodeId, result) =>
    set((state) => ({
      nodeResults: { ...state.nodeResults, [nodeId]: result },
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, result } } : node
      ),
    })),

  resetExecution: () =>
    set((state) => ({
      isExecuting: false,
      executionId: null,
      nodeStatuses: {},
      nodeResults: {},
      showExecutionPanel: false,
      nodes: state.nodes.map((node) => ({
        ...node,
        data: { ...node.data, status: 'idle', result: undefined },
      })),
    })),

  setShowExecutionPanel: (show) => set({ showExecutionPanel: show }),
}));
