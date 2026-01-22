// 커스텀 노드 컴포넌트
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  FileSpreadsheet,
  Search,
  Globe,
  Filter,
  Layers,
  MessageSquare,
  Brain,
  Hash,
  TrendingUp,
  BarChart3,
  Cloud,
  Table,
  FileText,
  Mail,
  Download,
  HelpCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { NODE_REGISTRY, CATEGORY_COLORS } from '../../lib/nodes/registry';
import { cn } from '../../lib/utils';

// 아이콘 매핑
const ICON_MAP: Record<string, any> = {
  FileSpreadsheet,
  Search,
  Globe,
  Filter,
  Layers,
  MessageSquare,
  Brain,
  Hash,
  TrendingUp,
  BarChart3,
  Cloud,
  Table,
  FileText,
  Mail,
  Download,
};

interface CustomNodeData {
  nodeType: string;
  label: string;
  config: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'error';
  result?: any;
}

function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const nodeDef = NODE_REGISTRY[data.nodeType];
  const IconComponent = nodeDef ? ICON_MAP[nodeDef.icon] || HelpCircle : HelpCircle;
  const categoryColor = nodeDef ? CATEGORY_COLORS[nodeDef.category] : '#888';

  // 상태에 따른 아이콘
  const StatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-md border-2 min-w-[180px] transition-all',
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-200',
        data.status === 'running' && 'border-blue-400',
        data.status === 'success' && 'border-green-400',
        data.status === 'error' && 'border-red-400'
      )}
    >
      {/* 입력 핸들 */}
      {nodeDef?.inputs.length > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-gray-400 border-2 border-white"
        />
      )}

      {/* 헤더 */}
      <div
        className="px-3 py-2 rounded-t-md flex items-center gap-2"
        style={{ backgroundColor: `${categoryColor}15` }}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center"
          style={{ backgroundColor: categoryColor }}
        >
          <IconComponent className="w-4 h-4 text-white" />
        </div>
        <span className="font-medium text-sm text-gray-800 flex-1">{data.label}</span>
        <StatusIcon />
      </div>

      {/* 바디 */}
      <div className="px-3 py-2 text-xs text-gray-500">
        {nodeDef?.description}
        {/* 주요 설정값 표시 */}
        {data.config?.query && (
          <div className="mt-1 px-2 py-1 bg-gray-100 rounded text-gray-700 truncate">
            "{data.config.query}"
          </div>
        )}
        {data.config?.prompt && (
          <div className="mt-1 px-2 py-1 bg-gray-100 rounded text-gray-700 truncate">
            "{data.config.prompt.substring(0, 30)}..."
          </div>
        )}
      </div>

      {/* 프리미엄 뱃지 */}
      {nodeDef?.isPremium && (
        <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-amber-400 text-white text-xs rounded-full font-medium">
          Pro
        </div>
      )}

      {/* 출력 핸들 */}
      {nodeDef?.outputs.length > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-gray-400 border-2 border-white"
        />
      )}
    </div>
  );
}

export default memo(CustomNode);
