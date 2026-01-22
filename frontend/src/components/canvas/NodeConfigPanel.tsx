// 노드 설정 패널 (우측 사이드바)
import { useState } from 'react';
import { X, Trash2, Settings, Info, Maximize2 } from 'lucide-react';
import { NODE_REGISTRY, CATEGORY_COLORS } from '../../lib/nodes/registry';
import { useWorkflowStore } from '../../store/workflowStore';
import { ResultsModal } from './ResultsModal';

export function NodeConfigPanel() {
  const { nodes, selectedNodeId, selectNode, updateNodeConfig, deleteNode } = useWorkflowStore();
  const [showResultsModal, setShowResultsModal] = useState(false);

  // 선택된 노드 찾기
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  if (!selectedNode) return null;

  const nodeDef = NODE_REGISTRY[selectedNode.data.nodeType];
  if (!nodeDef) return null;

  const color = CATEGORY_COLORS[nodeDef.category];

  // 설정 값 변경 핸들러
  const handleConfigChange = (key: string, value: any) => {
    updateNodeConfig(selectedNode.id, { [key]: value });
  };

  // 노드 삭제
  const handleDelete = () => {
    if (confirm('이 노드를 삭제하시겠습니까?')) {
      deleteNode(selectedNode.id);
    }
  };

  // 설정 스키마에서 필드 렌더링
  const renderConfigField = (key: string, schema: any) => {
    const value = selectedNode.data.config[key] ?? schema.default ?? '';

    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return (
            <select
              value={value}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {schema.enum.map((opt: string, idx: number) => (
                <option key={opt} value={opt}>
                  {schema.enumNames ? schema.enumNames[idx] : opt}
                </option>
              ))}
            </select>
          );
        }
        if (key.toLowerCase().includes('prompt') || key.toLowerCase().includes('template')) {
          return (
            <textarea
              value={value}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              placeholder={schema.placeholder || schema.description}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          );
        }
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            placeholder={schema.placeholder || ''}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleConfigChange(key, Number(e.target.value))}
            min={schema.minimum}
            max={schema.maximum}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleConfigChange(key, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600">{schema.title}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Settings className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{nodeDef.displayName}</h3>
              <p className="text-xs text-slate-500">{nodeDef.category}</p>
            </div>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* 설정 폼 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 노드 설명 */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">{nodeDef.description}</p>
        </div>

        {/* 설정 필드들 */}
        {nodeDef.configSchema.properties &&
          Object.entries(nodeDef.configSchema.properties).map(([key, schema]: [string, any]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {schema.title || key}
                {nodeDef.configSchema.required?.includes(key) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {schema.description && schema.type !== 'boolean' && (
                <p className="text-xs text-slate-500 mb-1.5">{schema.description}</p>
              )}
              {renderConfigField(key, schema)}
            </div>
          ))}

        {/* 노드 결과 (있는 경우) */}
        {selectedNode.data.result && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-700">실행 결과</h4>
              <button
                onClick={() => setShowResultsModal(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Maximize2 className="w-3 h-3" />
                크게 보기
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg overflow-auto max-h-40">
              <pre className="text-xs text-slate-600">
                {(() => {
                  try {
                    return JSON.stringify(selectedNode.data.result, null, 2);
                  } catch {
                    return '결과를 표시할 수 없습니다.';
                  }
                })()}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* 결과 모달 */}
      <ResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        title={nodeDef.displayName}
        data={selectedNode.data.result}
      />

      {/* 하단 액션 */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        {nodeDef.isPremium && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg mb-2">
            <span className="text-xs text-amber-700">
              💎 프리미엄 노드 - API 비용이 발생할 수 있습니다
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
