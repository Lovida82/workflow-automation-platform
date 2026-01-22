// 메인 캔버스 에디터 컴포넌트
import { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../../store/workflowStore';
import CustomNode from './CustomNode';
import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';
import { ExecutionPanel } from './ExecutionPanel';
import { CanvasToolbar } from './CanvasToolbar';
import { CATEGORY_COLORS } from '../../lib/nodes/registry';

// 커스텀 노드 타입 등록
const nodeTypes = {
  customNode: CustomNode,
};

// 미니맵 노드 색상
const nodeColor = (node: any) => {
  const nodeType = node.data?.nodeType;
  if (!nodeType) return '#888';

  // 노드 카테고리에 따른 색상
  const category = node.data?.category || 'process';
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#888';
};

function CanvasEditorInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const {
    nodes,
    edges,
    selectedNodeId,
    isExecuting,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
  } = useWorkflowStore();

  // 드래그 오버 핸들러
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 드롭 핸들러
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType || !reactFlowWrapper.current || !reactFlowInstance.current) {
        return;
      }

      // 드롭 위치 계산
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addNode(nodeType, position);
    },
    [addNode]
  );

  // 노드 클릭 핸들러
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // 캔버스 클릭 (선택 해제)
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // ReactFlow 초기화
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* 상단 툴바 */}
      <CanvasToolbar />

      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 노드 팔레트 */}
        <NodePalette />

        {/* 중앙: 캔버스 */}
        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              animated: true,
              style: { strokeWidth: 2, stroke: '#94a3b8' },
            }}
          >
            <Background color="#cbd5e1" gap={15} />
            <Controls position="bottom-left" />
            <MiniMap
              nodeColor={nodeColor}
              maskColor="rgba(0, 0, 0, 0.1)"
              position="bottom-right"
              pannable
              zoomable
            />
          </ReactFlow>

          {/* 실행 패널 */}
          {isExecuting && <ExecutionPanel />}

          {/* 빈 캔버스 안내 */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  워크플로우를 만들어 보세요
                </h3>
                <p className="text-slate-500">
                  좌측에서 노드를 드래그하여 캔버스에 추가하세요
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 우측: 노드 설정 패널 */}
        {selectedNodeId && <NodeConfigPanel />}
      </div>
    </div>
  );
}

// ReactFlowProvider로 감싸기
export function CanvasEditor() {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner />
    </ReactFlowProvider>
  );
}
