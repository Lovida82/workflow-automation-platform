// 워크플로우 액션 훅 (저장, 실행 등)
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuth } from './useAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function useWorkflowActions() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const {
    workflowId,
    workflowName,
    workflowDescription,
    nodes,
    edges,
    isExecuting,
    setWorkflow,
    setExecuting,
    setExecutionId,
    updateNodeStatus,
    updateNodeResult,
    resetExecution,
    setShowExecutionPanel,
  } = useWorkflowStore();

  // 워크플로우 저장
  const saveWorkflow = useCallback(async () => {
    if (!user) throw new Error('로그인이 필요합니다.');

    setIsSaving(true);

    try {
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        category: 'general',
        status: 'draft',
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            nodeType: n.data.nodeType,
            label: n.data.label,
            config: n.data.config,
          },
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        })),
        config: {},
        isTemplate: false,
        isPublic: false,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (workflowId) {
        // 기존 워크플로우 업데이트
        await setDoc(doc(db, 'workflows', workflowId), workflowData, { merge: true });
        return workflowId;
      } else {
        // 새 워크플로우 생성
        const docRef = await addDoc(collection(db, 'workflows'), {
          ...workflowData,
          createdAt: serverTimestamp(),
        });

        setWorkflow(docRef.id, workflowName, workflowDescription, nodes, edges);
        return docRef.id;
      }
    } finally {
      setIsSaving(false);
    }
  }, [user, workflowId, workflowName, workflowDescription, nodes, edges, setWorkflow]);

  // 워크플로우 실행 (로컬 시뮬레이션)
  const executeWorkflow = useCallback(async () => {
    if (!user) throw new Error('로그인이 필요합니다.');
    if (nodes.length === 0) throw new Error('실행할 노드가 없습니다.');

    resetExecution();
    setExecuting(true);
    setShowExecutionPanel(true); // 실행 패널 표시
    const executionId = uuidv4();
    setExecutionId(executionId);

    try {
      // 실행 레코드 생성
      await addDoc(collection(db, 'executions'), {
        workflowId: workflowId || 'unsaved',
        status: 'running',
        startedAt: serverTimestamp(),
        nodeResults: {},
        logs: [],
        triggerType: 'manual',
        triggeredBy: user.uid,
      });

      // 토폴로지 정렬로 실행 순서 결정
      const sortedNodes = topologicalSort(nodes, edges);
      const results: Record<string, any> = {};

      // 노드 순차 실행 (시뮬레이션)
      for (const node of sortedNodes) {
        updateNodeStatus(node.id, 'running');

        try {
          // 시뮬레이션 딜레이
          await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

          // 노드 실행 결과 시뮬레이션 (연결된 노드의 결과만 전달)
          const connectedResults = getConnectedInputs(node.id, edges, results);
          const result = await simulateNodeExecution(node, connectedResults);
          results[node.id] = result;

          updateNodeResult(node.id, result);
          updateNodeStatus(node.id, 'success');
        } catch (error: any) {
          updateNodeStatus(node.id, 'error');
          throw error;
        }
      }

      return { executionId, results };
    } catch (error) {
      console.error('Workflow execution error:', error);
      throw error;
    } finally {
      setExecuting(false);
    }
  }, [
    user,
    workflowId,
    nodes,
    edges,
    resetExecution,
    setExecuting,
    setExecutionId,
    updateNodeStatus,
    updateNodeResult,
    setShowExecutionPanel,
  ]);

  // 단일 노드 실행
  const executeSingleNode = useCallback(async (nodeId: string) => {
    if (!user) throw new Error('로그인이 필요합니다.');

    const node = nodes.find(n => n.id === nodeId);
    if (!node) throw new Error('노드를 찾을 수 없습니다.');

    // 현재 노드만 실행 상태로 변경
    updateNodeStatus(nodeId, 'running');

    try {
      // 연결된 입력 노드들의 기존 결과 수집
      const { nodeResults } = useWorkflowStore.getState();
      const connectedResults = getConnectedInputs(nodeId, edges, nodeResults);

      // 연결된 입력 노드 중 결과가 없는 노드 확인
      const incomingEdges = edges.filter(edge => edge.target === nodeId);
      const missingInputs: string[] = [];

      for (const edge of incomingEdges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (!sourceNode) continue;

        // 입력 노드(csv_upload, excel_upload)는 uploadedData 확인
        if (sourceNode.data.nodeType === 'csv_upload' || sourceNode.data.nodeType === 'excel_upload') {
          if (!sourceNode.data.uploadedData) {
            missingInputs.push(sourceNode.data.label || sourceNode.data.nodeType);
          } else if (!(edge.source in connectedResults)) {
            // uploadedData가 있으면 결과로 추가
            connectedResults[edge.source] = sourceNode.data.uploadedData;
          }
        } else if (!(edge.source in connectedResults)) {
          missingInputs.push(sourceNode.data.label || sourceNode.data.nodeType);
        }
      }

      if (missingInputs.length > 0) {
        throw new Error(`이전 노드를 먼저 실행해주세요: ${missingInputs.join(', ')}`);
      }

      // 노드 실행
      const result = await simulateNodeExecution(node, connectedResults);

      // 결과 업데이트
      updateNodeResult(nodeId, result);
      updateNodeStatus(nodeId, 'success');

      return result;
    } catch (error: any) {
      updateNodeStatus(nodeId, 'error');
      throw error;
    }
  }, [user, nodes, edges, updateNodeStatus, updateNodeResult]);

  return {
    saveWorkflow,
    executeWorkflow,
    executeSingleNode,
    isSaving,
    isExecuting,
  };
}

// 연결된 입력 노드의 결과만 가져오기
function getConnectedInputs(nodeId: string, edges: any[], allResults: Record<string, any>): Record<string, any> {
  const connectedResults: Record<string, any> = {};

  // 현재 노드로 들어오는 엣지 찾기
  const incomingEdges = edges.filter(edge => edge.target === nodeId);

  // 연결된 소스 노드의 결과만 가져오기
  for (const edge of incomingEdges) {
    const sourceId = edge.source;
    if (sourceId in allResults) {
      connectedResults[sourceId] = allResults[sourceId];
    }
  }

  return connectedResults;
}

// 토폴로지 정렬
function topologicalSort(nodes: any[], edges: any[]): any[] {
  const inDegree: Record<string, number> = {};
  const graph: Record<string, string[]> = {};
  const nodeIds = new Set(nodes.map(n => n.id));

  // 초기화
  nodes.forEach((node) => {
    inDegree[node.id] = 0;
    graph[node.id] = [];
  });

  // 그래프 구축 (유효한 엣지만 처리)
  edges.forEach((edge) => {
    // 소스와 타겟 노드가 모두 존재하는 경우에만 처리
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      graph[edge.source].push(edge.target);
      inDegree[edge.target]++;
    }
  });

  // 진입 차수가 0인 노드부터 시작
  const queue = nodes.filter((node) => inDegree[node.id] === 0);
  const sorted: any[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);

    graph[node.id].forEach((neighborId) => {
      inDegree[neighborId]--;
      if (inDegree[neighborId] === 0) {
        const neighbor = nodes.find((n) => n.id === neighborId);
        if (neighbor) {
          queue.push(neighbor);
        }
      }
    });
  }

  return sorted;
}

// 이전 결과에서 배열 데이터 추출 (안전하게)
function getPreviousData(previousResults: Record<string, any>): any[] {
  try {
    const values = Object.values(previousResults);
    if (values.length === 0) return [];

    // 배열이면 flat, 아니면 그대로 배열에 넣기
    return values.flatMap(v => {
      if (Array.isArray(v)) return v;
      if (v && typeof v === 'object' && 'data' in v && Array.isArray(v.data)) return v.data;
      if (v !== null && v !== undefined) return [v];
      return [];
    });
  } catch {
    return [];
  }
}

// 노드 실행
async function simulateNodeExecution(node: any, previousResults: Record<string, any>): Promise<any> {
  const nodeType = node.data.nodeType;
  const config = node.data.config || {};

  switch (nodeType) {
    case 'csv_upload':
    case 'excel_upload':
      // 업로드된 데이터 반환
      const uploadedData = node.data.uploadedData;
      if (!uploadedData || uploadedData.length === 0) {
        throw new Error('파일을 먼저 업로드해주세요.');
      }
      return uploadedData;

    case 'naver_news_search':
      // 실제 네이버 뉴스 API 호출
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('인증 토큰을 가져올 수 없습니다.');

        const response = await fetch(`${API_BASE_URL}/naver/news`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: config.query,
            display: config.display || 10,
            sort: config.sort || 'sim',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '네이버 뉴스 검색 실패');
        }

        const data = await response.json();
        // 네이버 API 응답 형식에서 items 추출
        return data.items || [];
      } catch (error: any) {
        console.error('Naver News API error:', error);
        throw new Error(`네이버 뉴스 검색 오류: ${error.message}`);
      }

    case 'gpt_sentiment':
      // 실제 OpenAI API 호출
      try {
        const sentimentToken = await auth.currentUser?.getIdToken();
        if (!sentimentToken) throw new Error('인증 토큰을 가져올 수 없습니다.');

        const sentimentData = getPreviousData(previousResults);
        if (sentimentData.length === 0) {
          throw new Error('분석할 데이터가 없습니다.');
        }

        const sentimentResponse = await fetch(`${API_BASE_URL}/openai/sentiment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sentimentToken}`,
          },
          body: JSON.stringify({
            items: sentimentData,
            textField: config.textField || 'description',
            model: config.model || 'gpt-3.5-turbo',
          }),
        });

        if (!sentimentResponse.ok) {
          const errorData = await sentimentResponse.json();
          throw new Error(errorData.error || 'GPT 감성 분석 실패');
        }

        const sentimentResult = await sentimentResponse.json();
        return sentimentResult.results || [];
      } catch (error: any) {
        console.error('GPT Sentiment API error:', error);
        throw new Error(`GPT 감성 분석 오류: ${error.message}`);
      }

    case 'gpt_text':
      // 실제 OpenAI API 호출 - 텍스트 생성
      try {
        const gptToken = await auth.currentUser?.getIdToken();
        if (!gptToken) throw new Error('인증 토큰을 가져올 수 없습니다.');

        const contextData = getPreviousData(previousResults);

        const gptResponse = await fetch(`${API_BASE_URL}/openai/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gptToken}`,
          },
          body: JSON.stringify({
            prompt: config.prompt || '데이터를 분석해주세요.',
            context: contextData,
            model: config.model || 'gpt-3.5-turbo',
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 1000,
          }),
        });

        if (!gptResponse.ok) {
          const errorData = await gptResponse.json();
          throw new Error(errorData.error || 'GPT 텍스트 생성 실패');
        }

        const gptResult = await gptResponse.json();
        return {
          text: gptResult.text,
          model: gptResult.model,
          usage: gptResult.usage,
        };
      } catch (error: any) {
        console.error('GPT Text API error:', error);
        throw new Error(`GPT 텍스트 생성 오류: ${error.message}`);
      }

    case 'filter':
      const filterData = getPreviousData(previousResults);
      return filterData.filter((item: any) => {
        if (!item || typeof item !== 'object') return false;
        const fieldValue = String(item[config.field] || '');
        const filterValue = String(config.value || '');

        switch (config.operator) {
          case 'contains':
            return fieldValue.toLowerCase().includes(filterValue.toLowerCase());
          case 'equals':
            return fieldValue === filterValue;
          default:
            return true;
        }
      });

    case 'group_by':
      const groupItems = getPreviousData(previousResults);
      const grouped: Record<string, any[]> = {};
      groupItems.forEach((item: any) => {
        if (!item || typeof item !== 'object') return;
        const key = item[config.groupField] || 'unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });
      return Object.entries(grouped).map(([key, values]) => ({
        [config.groupField]: key,
        count: values.length,
        items: values,
      }));

    case 'keyword_extract':
      const textData = getPreviousData(previousResults);
      const textField = config.textField || 'description';
      const topK = config.topK || 10;
      return extractKeywords(textData, textField, topK);

    case 'line_chart':
    case 'bar_chart':
    case 'wordcloud':
      const chartData = getPreviousData(previousResults);
      return {
        type: nodeType.replace('_', '-'),
        data: chartData,
        config: config,
      };

    case 'data_table':
      return {
        type: 'table',
        data: getPreviousData(previousResults),
        columns: config.columns || [],
      };

    case 'csv_save':
      const csvData = getPreviousData(previousResults);
      if (csvData.length === 0) {
        throw new Error('저장할 데이터가 없습니다.');
      }
      downloadCSV(csvData, config.fileName || 'output.csv', config.delimiter || ',');
      return { message: 'CSV 파일이 다운로드되었습니다.', rowCount: csvData.length };

    case 'excel_save':
      const excelData = getPreviousData(previousResults);
      if (excelData.length === 0) {
        throw new Error('저장할 데이터가 없습니다.');
      }
      downloadExcel(excelData, config.fileName || 'output.xlsx', config.sheetName || 'Sheet1');
      return { message: 'Excel 파일이 다운로드되었습니다.', rowCount: excelData.length };

    case 'txt_save':
      const txtContent = getTextContent(previousResults);
      if (!txtContent) {
        throw new Error('저장할 텍스트가 없습니다.');
      }
      downloadText(txtContent, config.fileName || 'report.txt', 'text/plain');
      return { message: 'TXT 파일이 다운로드되었습니다.', charCount: txtContent.length };

    case 'markdown_save':
      let mdContent = getTextContent(previousResults);
      if (!mdContent) {
        throw new Error('저장할 텍스트가 없습니다.');
      }
      // 제목 추가 옵션
      if (config.addTitle && config.title) {
        mdContent = `# ${config.title}\n\n${mdContent}`;
      }
      downloadText(mdContent, config.fileName || 'report.md', 'text/markdown');
      return { message: 'Markdown 파일이 다운로드되었습니다.', charCount: mdContent.length };

    case 'docx_save':
      const docxContent = getTextContent(previousResults);
      if (!docxContent) {
        throw new Error('저장할 텍스트가 없습니다.');
      }
      await downloadDocx(docxContent, config.fileName || 'report.docx', config.title || '분석 보고서', config.author || '');
      return { message: 'DOCX 파일이 다운로드되었습니다.', charCount: docxContent.length };

    default:
      return { message: `${nodeType} 노드 실행 완료`, data: previousResults };
  }
}

// 키워드 추출 함수 (단어 빈도 분석)
function extractKeywords(data: any[], textField: string, topK: number): { word: string; count: number }[] {
  // 불용어 (제거할 단어들)
  const stopWords = new Set([
    '의', '가', '이', '은', '는', '을', '를', '에', '에서', '와', '과', '도', '로', '으로',
    '에게', '한', '하다', '있다', '되다', '이다', '그', '저', '것', '수', '등', '및',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
    'about', 'also', 'back', 'been', 'being', 'even', 'first', 'get',
    'got', 'go', 'going', 'gone', 'good', 'great', 'here', 'how',
    'if', 'into', 'its', 'just', 'know', 'last', 'like', 'look',
    'make', 'many', 'more', 'most', 'much', 'new', 'no', 'now',
    'old', 'one', 'only', 'other', 'our', 'out', 'over', 'own',
    'said', 'say', 'see', 'she', 'some', 'such', 'take', 'tell',
    'that', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
    'those', 'time', 'two', 'up', 'use', 'very', 'want', 'way',
    'we', 'well', 'what', 'when', 'where', 'which', 'while', 'who',
    'why', 'will', 'with', 'work', 'would', 'year', 'you', 'your',
  ]);

  const wordCounts: Record<string, number> = {};

  // HTML 태그 제거 함수
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ');
  };

  // 모든 텍스트 수집 및 단어 카운트
  data.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const text = item[textField];
    if (!text || typeof text !== 'string') return;

    // HTML 태그 제거 및 정규화
    const cleanText = stripHtml(text)
      .toLowerCase()
      .replace(/[^\w\sㄱ-ㅎ가-힣]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 단어 분리 및 카운트
    const words = cleanText.split(' ').filter(word =>
      word.length >= 2 &&
      !stopWords.has(word) &&
      !/^\d+$/.test(word)
    );

    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });

  // 상위 K개 단어 추출
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([word, count]) => ({ word, count }));

  return sortedWords;
}

// CSV 다운로드 함수
function downloadCSV(data: any[], fileName: string, delimiter: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(delimiter),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        const strValue = value === null || value === undefined ? '' :
          typeof value === 'object' ? JSON.stringify(value) : String(value);
        // 구분자나 줄바꿈이 포함된 경우 따옴표로 감싸기
        if (strValue.includes(delimiter) || strValue.includes('\n') || strValue.includes('"')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(delimiter)
    )
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Excel 다운로드 함수
async function downloadExcel(data: any[], fileName: string, sheetName: string) {
  // 동적으로 xlsx 라이브러리 임포트
  const XLSX = await import('xlsx');

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 파일 다운로드
  XLSX.writeFile(workbook, fileName);
}

// 이전 결과에서 텍스트 추출
function getTextContent(previousResults: Record<string, any>): string {
  const values = Object.values(previousResults);
  if (values.length === 0) return '';

  // GPT 텍스트 생성 결과 형태: { text: "...", model: "...", usage: {...} }
  for (const value of values) {
    if (value && typeof value === 'object') {
      // text 필드가 있으면 반환
      if ('text' in value && typeof value.text === 'string') {
        return value.text;
      }
      // 배열인 경우 description 또는 content 필드 합치기
      if (Array.isArray(value)) {
        const texts = value
          .map((item: any) => item?.description || item?.content || item?.text || '')
          .filter(Boolean);
        if (texts.length > 0) {
          return texts.join('\n\n');
        }
      }
    }
    // 문자열이면 그대로 반환
    if (typeof value === 'string') {
      return value;
    }
  }

  // 못 찾으면 전체를 JSON 문자열로
  return JSON.stringify(values, null, 2);
}

// 텍스트 파일 다운로드
function downloadText(content: string, fileName: string, mimeType: string) {
  const blob = new Blob(['\uFEFF' + content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// DOCX 파일 다운로드
async function downloadDocx(content: string, fileName: string, title: string, author: string) {
  // 동적으로 docx 라이브러리 임포트
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

  // 문서 생성
  const doc = new Document({
    creator: author || 'Workflow Automation',
    title: title,
    description: 'Generated by Workflow Automation Platform',
    sections: [{
      properties: {},
      children: [
        // 제목
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        }),
        // 작성자 (있는 경우)
        ...(author ? [new Paragraph({
          children: [
            new TextRun({ text: '작성자: ', bold: true }),
            new TextRun({ text: author }),
          ],
          spacing: { after: 200 },
        })] : []),
        // 생성 날짜
        new Paragraph({
          children: [
            new TextRun({ text: '생성일: ', bold: true }),
            new TextRun({ text: new Date().toLocaleDateString('ko-KR') }),
          ],
          spacing: { after: 400 },
        }),
        // 본문 (줄바꿈 기준으로 단락 분리)
        ...content.split('\n').map(line =>
          new Paragraph({
            children: [new TextRun({ text: line })],
            spacing: { after: 120 },
          })
        ),
      ],
    }],
  });

  // Blob으로 변환 후 다운로드
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
