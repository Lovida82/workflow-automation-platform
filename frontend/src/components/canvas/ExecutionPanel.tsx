// 실행 상태 패널
import { useState } from 'react';
import { ChevronUp, ChevronDown, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { NODE_REGISTRY } from '../../lib/nodes/registry';
import { cn } from '../../lib/utils';

export function ExecutionPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { nodes, nodeStatuses, nodeResults, isExecuting } = useWorkflowStore();

  // 완료된 노드 수
  const completedCount = Object.values(nodeStatuses).filter(
    (s) => s === 'success' || s === 'error'
  ).length;

  // 현재 실행 중인 노드
  const runningNode = nodes.find((n) => nodeStatuses[n.id] === 'running');

  return (
    <div
      className={cn(
        'absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 transition-all',
        isExpanded ? 'w-[600px]' : 'w-80'
      )}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-slate-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isExecuting ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : completedCount === nodes.length ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Clock className="w-5 h-5 text-slate-400" />
          )}
          <div>
            <span className="font-medium text-slate-800">
              {isExecuting ? '워크플로우 실행 중' : '실행 완료'}
            </span>
            <span className="ml-2 text-sm text-slate-500">
              {completedCount} / {nodes.length} 노드
            </span>
          </div>
        </div>
        <button className="p-1 hover:bg-slate-100 rounded">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* 상세 내용 */}
      {isExpanded && (
        <div className="p-4 max-h-80 overflow-y-auto">
          {/* 현재 실행 중인 노드 */}
          {runningNode && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="font-medium text-blue-700">
                  {NODE_REGISTRY[runningNode.data.nodeType]?.displayName || runningNode.data.label}
                </span>
                <span className="text-sm text-blue-500">실행 중...</span>
              </div>
            </div>
          )}

          {/* 노드별 상태 목록 */}
          <div className="space-y-2">
            {nodes.map((node) => {
              const status = nodeStatuses[node.id];
              const result = nodeResults[node.id];
              const nodeDef = NODE_REGISTRY[node.data.nodeType];

              return (
                <div
                  key={node.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    status === 'success' && 'bg-green-50 border-green-200',
                    status === 'error' && 'bg-red-50 border-red-200',
                    status === 'running' && 'bg-blue-50 border-blue-200',
                    (!status || status === 'idle') && 'bg-slate-50 border-slate-200'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    {status === 'running' && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    {(!status || status === 'idle') && (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-medium text-sm">
                      {nodeDef?.displayName || node.data.label}
                    </span>
                  </div>

                  {/* 결과 미리보기 */}
                  {result && status === 'success' && (
                    <div className="mt-2 p-2 bg-white rounded text-xs text-slate-600 overflow-hidden">
                      {Array.isArray(result) ? (
                        <span>{result.length}개 항목</span>
                      ) : typeof result === 'object' ? (
                        <span>{Object.keys(result).length}개 필드</span>
                      ) : (
                        <span className="truncate block">{String(result).substring(0, 100)}</span>
                      )}
                    </div>
                  )}

                  {/* 에러 메시지 */}
                  {status === 'error' && node.data.error && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                      {node.data.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
