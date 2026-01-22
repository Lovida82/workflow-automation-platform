// 노드 팔레트 (좌측 사이드바)
import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  NODE_REGISTRY,
  CATEGORY_COLORS,
  CATEGORY_NAMES,
  getAllCategories,
} from '../../lib/nodes/registry';
import { NodeCategory } from '../../types/node';
import { cn } from '../../lib/utils';

// 아이콘 매핑
const getIcon = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || Icons.HelpCircle;
};

export function NodePalette() {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(getAllCategories())
  );

  // 카테고리 토글
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // 검색 필터
  const filteredNodes = Object.values(NODE_REGISTRY).filter(
    (node) =>
      node.displayName.toLowerCase().includes(search.toLowerCase()) ||
      node.description.toLowerCase().includes(search.toLowerCase())
  );

  // 카테고리별 그룹화
  const groupedNodes = getAllCategories().reduce(
    (acc, category) => {
      acc[category] = filteredNodes.filter((node) => node.category === category);
      return acc;
    },
    {} as Record<NodeCategory, typeof filteredNodes>
  );

  // 드래그 시작
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">노드 라이브러리</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="노드 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 노드 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {getAllCategories().map((category) => {
          const nodes = groupedNodes[category];
          if (nodes.length === 0) return null;

          const isExpanded = expandedCategories.has(category);
          const color = CATEGORY_COLORS[category];

          return (
            <div key={category} className="mb-2">
              {/* 카테고리 헤더 */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-slate-200 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-sm text-slate-700">
                  {CATEGORY_NAMES[category]}
                </span>
                <span className="ml-auto text-xs text-slate-400">{nodes.length}</span>
              </button>

              {/* 노드 목록 */}
              {isExpanded && (
                <div className="ml-4 space-y-1 mt-1">
                  {nodes.map((node) => {
                    const IconComponent = getIcon(node.icon);

                    return (
                      <div
                        key={node.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing',
                          'bg-white border border-slate-200 hover:shadow-md hover:border-slate-300',
                          'transition-all group'
                        )}
                      >
                        <GripVertical className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <IconComponent className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700 truncate flex items-center gap-1">
                            {node.displayName}
                            {node.isPremium && (
                              <span className="px-1 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded">
                                Pro
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {node.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 안내 문구 */}
      <div className="p-3 border-t border-slate-200 bg-slate-100">
        <p className="text-xs text-slate-500 text-center">
          노드를 드래그하여 캔버스에 추가하세요
        </p>
      </div>
    </div>
  );
}
