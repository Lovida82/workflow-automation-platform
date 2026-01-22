// 실행 결과 모달 (큰 테이블 형태로 표시)
import { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Maximize2, Table, Code, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ChartRenderer } from './ChartRenderer';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
}

export function ResultsModal({ isOpen, onClose, title, data }: ResultsModalProps) {
  const [viewMode, setViewMode] = useState<'table' | 'json' | 'chart'>('table');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // 차트 데이터인지 확인
  const isChartData = data && typeof data === 'object' && !Array.isArray(data) &&
    ('type' in data) && ['line-chart', 'bar-chart', 'wordcloud'].includes(data.type);

  // 데이터가 변경되면 적절한 뷰 모드로 자동 전환
  useEffect(() => {
    if (isChartData) {
      setViewMode('chart');
    } else {
      setViewMode('table');
    }
    setCurrentPage(0);
  }, [data, isChartData]);

  if (!isOpen) return null;

  // 데이터가 없는 경우 처리
  if (data === null || data === undefined) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">결과 없음</h2>
          <p className="text-slate-600 mb-4">실행 결과가 없습니다.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  // 데이터를 배열로 변환 (null/undefined 필터링)
  const rawArray = Array.isArray(data) ? data : [data];
  const dataArray = rawArray.filter(item => item !== null && item !== undefined);
  const totalPages = Math.max(1, Math.ceil(dataArray.length / pageSize));
  const paginatedData = dataArray.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // 컬럼 추출 (첫 번째 아이템 기준) - null 체크 추가
  const firstItem = dataArray[0];
  const columns = dataArray.length > 0 && firstItem && typeof firstItem === 'object'
    ? Object.keys(firstItem).filter(key => key !== 'items')
    : [];

  // CSV 다운로드
  const handleDownloadCSV = () => {
    if (dataArray.length === 0) return;

    const headers = columns.join(',');
    const rows = dataArray.map(item =>
      columns.map(col => {
        const value = item[col];
        const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
        return `"${strValue.replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // HTML 태그 제거
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // 셀 값 렌더링 (에러 방지)
  const renderCellValue = (value: any) => {
    try {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? '✓' : '✗';
      if (typeof value === 'object') {
        const jsonStr = JSON.stringify(value);
        return jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
      }

      const strValue = String(value);
      const cleanValue = strValue.includes('<') ? stripHtml(strValue) : strValue;
      return cleanValue.length > 100 ? cleanValue.substring(0, 100) + '...' : cleanValue;
    } catch (error) {
      return '-';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Maximize2 className="w-5 h-5 text-slate-500" />
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{title} - 실행 결과</h2>
              <p className="text-sm text-slate-500">총 {dataArray.length}개 항목</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 뷰 모드 토글 */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  viewMode === 'table' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Table className="w-4 h-4" />
                테이블
              </button>
              {isChartData && (
                <button
                  onClick={() => setViewMode('chart')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                    viewMode === 'chart' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                  차트
                </button>
              )}
              <button
                onClick={() => setViewMode('json')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  viewMode === 'json' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Code className="w-4 h-4" />
                JSON
              </button>
            </div>

            {/* 다운로드 버튼 */}
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV 다운로드
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'chart' && isChartData ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-full max-w-4xl">
                <ChartRenderer
                  type={data.type}
                  data={data.data || []}
                  config={data.config || {}}
                />
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      #
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr
                      key={index}
                      className={cn(
                        'hover:bg-slate-50 transition-colors',
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                      )}
                    >
                      <td className="px-4 py-3 text-sm text-slate-500 border-b border-slate-100">
                        {currentPage * pageSize + index + 1}
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 max-w-md"
                        >
                          <div className="truncate" title={String(item[col] || '')}>
                            {renderCellValue(item[col])}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {dataArray.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  데이터가 없습니다.
                </div>
              )}
            </div>
          ) : (
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto text-sm font-mono h-full">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>

        {/* 페이지네이션 */}
        {viewMode === 'table' && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-600">
              {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, dataArray.length)} / {dataArray.length}개
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-600">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
