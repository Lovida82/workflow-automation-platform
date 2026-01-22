// 노드 레지스트리 - 모든 사용 가능한 노드 정의
import { NodeDefinition, NodeCategory } from '../../types/node';

// 카테고리별 색상
export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  input: '#22c55e',      // green
  service: '#3b82f6',    // blue
  process: '#f59e0b',    // amber
  ai: '#8b5cf6',         // violet
  visualization: '#ec4899', // pink
  output: '#ef4444',     // red
  automation: '#06b6d4', // cyan
};

// 카테고리별 이름
export const CATEGORY_NAMES: Record<NodeCategory, string> = {
  input: '데이터 입력',
  service: '서비스 연동',
  process: '전처리',
  ai: 'AI 처리',
  visualization: '시각화',
  output: '출력',
  automation: '자동화',
};

// MVP 노드 정의 (15개)
export const NODE_REGISTRY: Record<string, NodeDefinition> = {
  // ==================== INPUT 노드 (3개) ====================
  csv_upload: {
    type: 'csv_upload',
    category: 'input',
    displayName: 'CSV 업로드',
    icon: 'FileSpreadsheet',
    description: 'CSV 파일을 업로드하여 데이터 가져오기',
    inputs: [],
    outputs: [{ id: 'data', label: '데이터', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        hasHeader: { type: 'boolean', title: '헤더 포함', default: true },
        delimiter: { type: 'string', title: '구분자', default: ',' },
      },
    },
    defaultConfig: { hasHeader: true, delimiter: ',' },
    isPremium: false,
    averageRuntime: 500,
  },

  naver_news_search: {
    type: 'naver_news_search',
    category: 'input',
    displayName: '네이버 뉴스 검색',
    icon: 'Search',
    description: '네이버 뉴스 API로 기사 검색',
    inputs: [],
    outputs: [{ id: 'articles', label: '기사 목록', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', title: '검색어', required: true },
        display: { type: 'number', title: '결과 개수', minimum: 1, maximum: 100, default: 10 },
        sort: {
          type: 'string',
          title: '정렬',
          enum: ['sim', 'date'],
          enumNames: ['유사도순', '날짜순'],
          default: 'sim',
        },
      },
      required: ['query'],
    },
    defaultConfig: { query: '', display: 10, sort: 'sim' },
    isPremium: false,
    averageRuntime: 2000,
  },

  web_crawl: {
    type: 'web_crawl',
    category: 'input',
    displayName: '웹 크롤링',
    icon: 'Globe',
    description: '웹 페이지에서 데이터 수집',
    inputs: [],
    outputs: [{ id: 'data', label: '수집 데이터', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', title: 'URL', required: true },
        selector: { type: 'string', title: 'CSS 선택자', default: 'body' },
        extractText: { type: 'boolean', title: '텍스트만 추출', default: true },
      },
      required: ['url'],
    },
    defaultConfig: { url: '', selector: 'body', extractText: true },
    isPremium: false,
    averageRuntime: 3000,
  },

  // ==================== PROCESS 노드 (5개) ====================
  filter: {
    type: 'filter',
    category: 'process',
    displayName: '필터',
    icon: 'Filter',
    description: '조건에 맞는 데이터만 필터링',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'filtered', label: '필터된 데이터', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        field: { type: 'string', title: '필드명', required: true },
        operator: {
          type: 'string',
          title: '연산자',
          enum: ['equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'notEquals'],
          default: 'contains',
        },
        value: { type: 'string', title: '값', required: true },
      },
    },
    defaultConfig: { field: '', operator: 'contains', value: '' },
    isPremium: false,
    averageRuntime: 100,
  },

  group_by: {
    type: 'group_by',
    category: 'process',
    displayName: '그룹화',
    icon: 'Layers',
    description: '특정 필드 기준으로 데이터 그룹화',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'grouped', label: '그룹화된 데이터', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        groupField: { type: 'string', title: '그룹 필드', required: true },
        aggregation: {
          type: 'string',
          title: '집계 방식',
          enum: ['count', 'sum', 'avg', 'list'],
          default: 'count',
        },
        valueField: { type: 'string', title: '값 필드 (sum/avg용)' },
      },
    },
    defaultConfig: { groupField: '', aggregation: 'count', valueField: '' },
    isPremium: false,
    averageRuntime: 200,
  },

  gpt_text: {
    type: 'gpt_text',
    category: 'ai',
    displayName: 'GPT 텍스트 생성',
    icon: 'MessageSquare',
    description: 'GPT로 텍스트 생성',
    inputs: [{ id: 'context', label: '컨텍스트', type: 'any', required: false }],
    outputs: [{ id: 'text', label: '생성된 텍스트', type: 'string', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', title: '프롬프트', required: true },
        model: {
          type: 'string',
          title: '모델',
          enum: ['gpt-4', 'gpt-3.5-turbo'],
          default: 'gpt-3.5-turbo',
        },
        temperature: { type: 'number', title: '창의성', minimum: 0, maximum: 2, default: 0.7 },
        maxTokens: { type: 'number', title: '최대 토큰', default: 1000 },
      },
    },
    defaultConfig: { prompt: '', model: 'gpt-3.5-turbo', temperature: 0.7, maxTokens: 1000 },
    isPremium: true,
    estimatedCost: 0.01,
    averageRuntime: 3000,
  },

  gpt_sentiment: {
    type: 'gpt_sentiment',
    category: 'ai',
    displayName: 'GPT 감성 분석',
    icon: 'Brain',
    description: 'GPT로 텍스트의 감성(긍정/부정/중립) 분석',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'analyzed', label: '분석 결과', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        textField: { type: 'string', title: '분석할 필드', default: 'description' },
        model: {
          type: 'string',
          title: 'GPT 모델',
          enum: ['gpt-4', 'gpt-3.5-turbo'],
          default: 'gpt-3.5-turbo',
        },
        batchSize: { type: 'number', title: '배치 크기', minimum: 1, maximum: 20, default: 5 },
      },
    },
    defaultConfig: { textField: 'description', model: 'gpt-3.5-turbo', batchSize: 5 },
    isPremium: true,
    estimatedCost: 0.02,
    averageRuntime: 5000,
  },

  keyword_extract: {
    type: 'keyword_extract',
    category: 'ai',
    displayName: '키워드 추출',
    icon: 'Hash',
    description: '텍스트에서 주요 키워드 추출',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'keywords', label: '키워드 목록', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        textField: { type: 'string', title: '분석할 필드', default: 'description' },
        topK: { type: 'number', title: '추출 개수', default: 10 },
      },
    },
    defaultConfig: { textField: 'description', topK: 10 },
    isPremium: true,
    estimatedCost: 0.01,
    averageRuntime: 2000,
  },

  // ==================== VISUALIZATION 노드 (3개) ====================
  line_chart: {
    type: 'line_chart',
    category: 'visualization',
    displayName: '라인 차트',
    icon: 'TrendingUp',
    description: '시계열 데이터를 라인 차트로 표시',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'chart', label: '차트 설정', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        xField: { type: 'string', title: 'X축 필드', required: true },
        yField: { type: 'string', title: 'Y축 필드', required: true },
        title: { type: 'string', title: '차트 제목', default: '' },
      },
    },
    defaultConfig: { xField: '', yField: '', title: '' },
    isPremium: false,
    averageRuntime: 100,
  },

  bar_chart: {
    type: 'bar_chart',
    category: 'visualization',
    displayName: '바 차트',
    icon: 'BarChart3',
    description: '카테고리별 데이터를 바 차트로 표시',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'chart', label: '차트 설정', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        categoryField: { type: 'string', title: '카테고리 필드', required: true },
        valueField: { type: 'string', title: '값 필드', required: true },
        title: { type: 'string', title: '차트 제목', default: '' },
      },
    },
    defaultConfig: { categoryField: '', valueField: '', title: '' },
    isPremium: false,
    averageRuntime: 100,
  },

  wordcloud: {
    type: 'wordcloud',
    category: 'visualization',
    displayName: '워드 클라우드',
    icon: 'Cloud',
    description: '키워드 빈도를 워드 클라우드로 표시',
    inputs: [{ id: 'data', label: '키워드 데이터', type: 'array', required: true }],
    outputs: [{ id: 'chart', label: '워드클라우드 설정', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        wordField: { type: 'string', title: '단어 필드', default: 'word' },
        countField: { type: 'string', title: '빈도 필드', default: 'count' },
        maxWords: { type: 'number', title: '최대 단어 수', default: 50 },
      },
    },
    defaultConfig: { wordField: 'word', countField: 'count', maxWords: 50 },
    isPremium: false,
    averageRuntime: 200,
  },

  // ==================== OUTPUT 노드 (4개) ====================
  data_table: {
    type: 'data_table',
    category: 'output',
    displayName: '데이터 테이블',
    icon: 'Table',
    description: '데이터를 테이블 형태로 표시',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [],
    configSchema: {
      type: 'object',
      properties: {
        columns: { type: 'array', title: '표시할 컬럼', items: { type: 'string' } },
        pageSize: { type: 'number', title: '페이지 크기', default: 10 },
      },
    },
    defaultConfig: { columns: [], pageSize: 10 },
    isPremium: false,
    averageRuntime: 50,
  },

  docx_report: {
    type: 'docx_report',
    category: 'output',
    displayName: 'DOCX 리포트',
    icon: 'FileText',
    description: 'Word 문서 형태의 리포트 생성',
    inputs: [{ id: 'content', label: '리포트 내용', type: 'any', required: true }],
    outputs: [{ id: 'file', label: '생성된 파일', type: 'file', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: '리포트 제목', required: true },
        template: { type: 'string', title: '템플릿', enum: ['basic', 'detailed'], default: 'basic' },
      },
    },
    defaultConfig: { title: '', template: 'basic' },
    isPremium: false,
    averageRuntime: 1000,
  },

  email_send: {
    type: 'email_send',
    category: 'output',
    displayName: '이메일 발송',
    icon: 'Mail',
    description: '이메일로 결과 발송',
    inputs: [{ id: 'content', label: '발송 내용', type: 'any', required: true }],
    outputs: [{ id: 'result', label: '발송 결과', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', title: '수신자', required: true },
        subject: { type: 'string', title: '제목', required: true },
        bodyTemplate: { type: 'string', title: '본문 템플릿' },
      },
    },
    defaultConfig: { to: '', subject: '', bodyTemplate: '' },
    isPremium: false,
    averageRuntime: 2000,
  },

  csv_save: {
    type: 'csv_save',
    category: 'output',
    displayName: 'CSV 저장',
    icon: 'Download',
    description: '데이터를 CSV 파일로 저장',
    inputs: [{ id: 'data', label: '저장할 데이터', type: 'array', required: true }],
    outputs: [{ id: 'file', label: '생성된 파일', type: 'file', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        fileName: { type: 'string', title: '파일명', default: 'output.csv' },
        delimiter: { type: 'string', title: '구분자', default: ',' },
      },
    },
    defaultConfig: { fileName: 'output.csv', delimiter: ',' },
    isPremium: false,
    averageRuntime: 200,
  },
};

// 노드 정의 가져오기
export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return NODE_REGISTRY[type];
}

// 카테고리별 노드 목록 가져오기
export function getNodesByCategory(category: NodeCategory): NodeDefinition[] {
  return Object.values(NODE_REGISTRY).filter((node) => node.category === category);
}

// 모든 카테고리 목록
export function getAllCategories(): NodeCategory[] {
  return ['input', 'process', 'ai', 'visualization', 'output', 'automation'];
}
