// 캔버스 상단 툴바
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Play,
  Loader2,
  ArrowLeft,
  Settings,
  Download,
  Upload,
  MoreHorizontal,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useWorkflowActions } from '../../hooks/useWorkflowActions';
import { cn } from '../../lib/utils';

export function CanvasToolbar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const {
    workflowName,
    workflowDescription,
    nodes,
    edges,
    isExecuting,
  } = useWorkflowStore();

  const { saveWorkflow, executeWorkflow, isSaving } = useWorkflowActions();

  // 저장 핸들러
  const handleSave = async () => {
    try {
      await saveWorkflow();
      alert('워크플로우가 저장되었습니다.');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  // 실행 핸들러
  const handleExecute = async () => {
    if (nodes.length === 0) {
      alert('실행할 노드가 없습니다.');
      return;
    }

    try {
      await executeWorkflow();
    } catch (error) {
      console.error('Execution error:', error);
    }
  };

  // JSON 내보내기
  const handleExport = () => {
    const data = {
      name: workflowName,
      description: workflowDescription,
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
      {/* 좌측: 뒤로가기 & 워크플로우 이름 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/workflows')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>

        <div>
          <h1 className="font-semibold text-slate-800">{workflowName}</h1>
          <p className="text-xs text-slate-500">
            {nodes.length}개 노드 · {edges.length}개 연결
          </p>
        </div>
      </div>

      {/* 우측: 액션 버튼들 */}
      <div className="flex items-center gap-2">
        {/* 저장 */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            'border border-slate-300 text-slate-700 hover:bg-slate-50',
            isSaving && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          저장
        </button>

        {/* 실행 */}
        <button
          onClick={handleExecute}
          disabled={isExecuting || nodes.length === 0}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            'bg-blue-500 text-white hover:bg-blue-600',
            (isExecuting || nodes.length === 0) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              실행 중...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              실행
            </>
          )}
        </button>

        {/* 더보기 메뉴 */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-slate-600" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                <button
                  onClick={() => {
                    handleExport();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Download className="w-4 h-4" />
                  JSON 내보내기
                </button>
                <button
                  onClick={() => {
                    // TODO: Import 기능
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Upload className="w-4 h-4" />
                  JSON 가져오기
                </button>
                <hr className="my-1 border-slate-200" />
                <button
                  onClick={() => {
                    // TODO: Settings 기능
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="w-4 h-4" />
                  워크플로우 설정
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
