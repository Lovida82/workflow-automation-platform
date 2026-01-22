// 파일 업로드 노드 컴포넌트
import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileUploadNodeProps {
  nodeId: string;
  nodeType: 'csv_upload' | 'excel_upload';
  config: {
    hasHeader?: boolean;
    delimiter?: string;
    sheetName?: string;
    startRow?: number;
  };
  onDataLoaded: (data: any[]) => void;
}

export function FileUploadNode({ nodeId, nodeType, config, onDataLoaded }: FileUploadNodeProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      let data: any[] = [];

      if (nodeType === 'csv_upload') {
        data = await parseCSV(file, config.hasHeader ?? true, config.delimiter ?? ',');
      } else {
        data = await parseExcel(file, config.hasHeader ?? true, config.sheetName, config.startRow ?? 1);
      }

      setFileName(file.name);
      setRowCount(data.length);
      onDataLoaded(data);
    } catch (err: any) {
      setError(err.message || '파일 처리 중 오류가 발생했습니다.');
      console.error('File parse error:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (file: File, hasHeader: boolean, delimiter: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());

          if (lines.length === 0) {
            resolve([]);
            return;
          }

          const headers = hasHeader
            ? lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''))
            : lines[0].split(delimiter).map((_, i) => `column${i + 1}`);

          const startIndex = hasHeader ? 1 : 0;
          const data = lines.slice(startIndex).map(line => {
            const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
            const row: Record<string, any> = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            return row;
          });

          resolve(data);
        } catch (err) {
          reject(new Error('CSV 파일 파싱 오류'));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기 오류'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const parseExcel = (file: File, hasHeader: boolean, sheetName?: string, startRow: number = 1): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });

          // 시트 선택
          const sheet = sheetName
            ? workbook.Sheets[sheetName]
            : workbook.Sheets[workbook.SheetNames[0]];

          if (!sheet) {
            reject(new Error('시트를 찾을 수 없습니다.'));
            return;
          }

          // JSON으로 변환
          const jsonData = XLSX.utils.sheet_to_json(sheet, {
            header: hasHeader ? undefined : 1,
            range: startRow - 1,
            defval: '',
          });

          resolve(jsonData as any[]);
        } catch (err) {
          reject(new Error('Excel 파일 파싱 오류'));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기 오류'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleClear = () => {
    setFileName(null);
    setRowCount(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mt-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={nodeType === 'csv_upload' ? '.csv,.txt' : '.xlsx,.xls'}
        onChange={handleFileSelect}
        className="hidden"
        id={`file-upload-${nodeId}`}
      />

      {!fileName ? (
        <label
          htmlFor={`file-upload-${nodeId}`}
          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-blue-500">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">파일 처리 중...</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-600">
                {nodeType === 'csv_upload' ? 'CSV 파일 선택' : 'Excel 파일 선택'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {nodeType === 'csv_upload' ? '.csv, .txt' : '.xlsx, .xls'}
              </span>
            </>
          )}
        </label>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800 truncate max-w-[150px]">
                {fileName}
              </p>
              <p className="text-xs text-green-600">{rowCount}개 행</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <button
              onClick={handleClear}
              className="p-1 hover:bg-green-100 rounded transition-colors"
              title="파일 제거"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
