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
import { db } from '../lib/firebase';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuth } from './useAuth';

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
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
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

          // 노드 실행 결과 시뮬레이션
          const result = await simulateNodeExecution(node, results);
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
  ]);

  return {
    saveWorkflow,
    executeWorkflow,
    isSaving,
    isExecuting,
  };
}

// 토폴로지 정렬
function topologicalSort(nodes: any[], edges: any[]): any[] {
  const inDegree: Record<string, number> = {};
  const graph: Record<string, string[]> = {};

  // 초기화
  nodes.forEach((node) => {
    inDegree[node.id] = 0;
    graph[node.id] = [];
  });

  // 그래프 구축
  edges.forEach((edge) => {
    graph[edge.source].push(edge.target);
    inDegree[edge.target]++;
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
        const neighbor = nodes.find((n) => n.id === neighborId)!;
        queue.push(neighbor);
      }
    });
  }

  return sorted;
}

// 노드 실행 시뮬레이션
async function simulateNodeExecution(node: any, previousResults: Record<string, any>): Promise<any> {
  const nodeType = node.data.nodeType;
  const config = node.data.config;

  switch (nodeType) {
    case 'naver_news_search':
      return [
        {
          title: `${config.query} 관련 뉴스 1`,
          description: '이것은 샘플 뉴스 기사입니다.',
          pubDate: new Date().toISOString(),
          link: 'https://example.com/news/1',
        },
        {
          title: `${config.query} 관련 뉴스 2`,
          description: '또 다른 샘플 뉴스 기사입니다.',
          pubDate: new Date().toISOString(),
          link: 'https://example.com/news/2',
        },
        {
          title: `${config.query} 관련 뉴스 3`,
          description: '세 번째 샘플 뉴스 기사입니다.',
          pubDate: new Date().toISOString(),
          link: 'https://example.com/news/3',
        },
      ];

    case 'gpt_sentiment':
      const inputData = Object.values(previousResults).flat();
      return inputData.map((item: any) => ({
        ...item,
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
        confidence: Math.random() * 0.5 + 0.5,
      }));

    case 'filter':
      const data = Object.values(previousResults).flat();
      return data.filter((item: any) => {
        const fieldValue = String(item[config.field] || '');
        const filterValue = String(config.value);

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
      const items = Object.values(previousResults).flat();
      const grouped: Record<string, any[]> = {};
      items.forEach((item: any) => {
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
      return [
        { word: config.textField, count: 15 },
        { word: '키워드1', count: 12 },
        { word: '키워드2', count: 10 },
        { word: '키워드3', count: 8 },
        { word: '키워드4', count: 5 },
      ];

    case 'line_chart':
    case 'bar_chart':
    case 'wordcloud':
      const chartData = Object.values(previousResults).flat();
      return {
        type: nodeType.replace('_', '-'),
        data: chartData,
        config: config,
      };

    case 'data_table':
      return {
        type: 'table',
        data: Object.values(previousResults).flat(),
        columns: config.columns || [],
      };

    default:
      return { message: `${nodeType} 노드 실행 완료`, data: previousResults };
  }
}
