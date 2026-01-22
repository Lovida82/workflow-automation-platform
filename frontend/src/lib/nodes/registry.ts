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
    description: 'CSV 파일을 업로드하여 데이터 가져오기. 출력 필드: CSV 컬럼명 (예: name, age, city)',
    inputs: [],
    outputs: [{ id: 'data', label: '데이터', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        hasHeader: { type: 'boolean', title: '헤더 포함', description: '첫 행이 컬럼명인 경우 체크', default: true },
        delimiter: { type: 'string', title: '구분자', description: '일반적으로 콤마(,) 사용', default: ',', placeholder: ',' },
      },
    },
    defaultConfig: { hasHeader: true, delimiter: ',' },
    isPremium: false,
    averageRuntime: 500,
  },

  excel_upload: {
    type: 'excel_upload',
    category: 'input',
    displayName: 'Excel 업로드',
    icon: 'FileSpreadsheet',
    description: 'Excel 파일(.xlsx, .xls)을 업로드하여 데이터 가져오기. 출력 필드: Excel 컬럼명',
    inputs: [],
    outputs: [{ id: 'data', label: '데이터', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        sheetName: { type: 'string', title: '시트명', description: '비워두면 첫 번째 시트 사용', default: '', placeholder: 'Sheet1' },
        hasHeader: { type: 'boolean', title: '헤더 포함', description: '첫 행이 컬럼명인 경우 체크', default: true },
        startRow: { type: 'number', title: '시작 행', description: '데이터 시작 행 번호 (1부터)', default: 1 },
      },
    },
    defaultConfig: { sheetName: '', hasHeader: true, startRow: 1 },
    isPremium: false,
    averageRuntime: 800,
  },

  naver_news_search: {
    type: 'naver_news_search',
    category: 'input',
    displayName: '네이버 뉴스 검색',
    icon: 'Search',
    description: '네이버 뉴스 API로 기사 검색. 출력 필드: title(제목), link(링크), description(내용요약), pubDate(날짜)',
    inputs: [],
    outputs: [{ id: 'articles', label: '기사 목록', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', title: '검색어', description: '검색할 키워드를 입력하세요', required: true, placeholder: '예: 인공지능, 삼성전자' },
        display: { type: 'number', title: '결과 개수', description: '가져올 뉴스 개수 (1~100)', minimum: 1, maximum: 100, default: 10 },
        sort: {
          type: 'string',
          title: '정렬',
          description: '검색 결과 정렬 방식',
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
    description: '웹 페이지에서 데이터 수집. CSS 선택자로 원하는 요소 지정 가능',
    inputs: [],
    outputs: [{ id: 'data', label: '수집 데이터', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', title: 'URL', description: '크롤링할 웹페이지 주소', required: true, placeholder: 'https://example.com' },
        selector: { type: 'string', title: 'CSS 선택자', description: '추출할 HTML 요소 선택자', default: 'body', placeholder: '.article, #content' },
        extractText: { type: 'boolean', title: '텍스트만 추출', description: 'HTML 태그 제거하고 텍스트만 추출', default: true },
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
    description: '조건에 맞는 데이터만 필터링. 📌 필드명은 이전 노드의 출력 필드명을 입력 (예: 뉴스검색 후 → title, description)',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'filtered', label: '필터된 데이터', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        field: { type: 'string', title: '필드명', description: '이전 노드 출력의 필드명 (뉴스: title, description, link)', required: true, placeholder: 'title 또는 description' },
        operator: {
          type: 'string',
          title: '연산자',
          description: 'contains=포함, equals=일치, gt/lt=크다/작다',
          enum: ['equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'notEquals'],
          enumNames: ['일치 (equals)', '포함 (contains)', '초과 (gt)', '미만 (lt)', '이상 (gte)', '이하 (lte)', '불일치 (notEquals)'],
          default: 'contains',
        },
        value: { type: 'string', title: '필터값', description: '필터링할 값', required: true, placeholder: '예: 삼성, AI, 인공지능' },
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
    description: '특정 필드 기준으로 데이터 그룹화. 출력: {그룹필드, count, items}. 📌 바차트 연결 시 categoryField=그룹필드, valueField=count',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'grouped', label: '그룹화된 데이터', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        groupField: { type: 'string', title: '그룹 필드', description: '그룹화 기준이 될 필드명', required: true, placeholder: '예: sentiment, category' },
        aggregation: {
          type: 'string',
          title: '집계 방식',
          description: 'count=개수, sum=합계, avg=평균',
          enum: ['count', 'sum', 'avg', 'list'],
          enumNames: ['개수 (count)', '합계 (sum)', '평균 (avg)', '목록 (list)'],
          default: 'count',
        },
        valueField: { type: 'string', title: '값 필드', description: 'sum/avg 집계 시 사용할 숫자 필드', placeholder: '예: price, amount' },
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
    description: 'GPT로 텍스트 생성. 이전 노드 데이터를 컨텍스트로 활용 가능',
    inputs: [{ id: 'context', label: '컨텍스트', type: 'any', required: false }],
    outputs: [{ id: 'text', label: '생성된 텍스트', type: 'string', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', title: '프롬프트', description: 'GPT에게 보낼 지시문', required: true, placeholder: '예: 아래 뉴스들을 요약해주세요' },
        model: {
          type: 'string',
          title: '모델',
          description: 'GPT-4가 더 정확하나 비용 높음',
          enum: ['gpt-4', 'gpt-3.5-turbo'],
          enumNames: ['GPT-4 (고성능)', 'GPT-3.5 (빠름/저렴)'],
          default: 'gpt-3.5-turbo',
        },
        temperature: { type: 'number', title: '창의성', description: '0=정확한 답변, 1=창의적 답변', minimum: 0, maximum: 2, default: 0.7 },
        maxTokens: { type: 'number', title: '최대 토큰', description: '응답 최대 길이 (1000토큰≈750단어)', default: 1000 },
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
    description: 'GPT로 텍스트의 감성 분석. 출력 필드: 기존 필드 + sentiment(positive/negative/neutral), confidence',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'analyzed', label: '분석 결과', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        textField: { type: 'string', title: '분석할 필드', description: '감성 분석할 텍스트가 있는 필드명', default: 'description', placeholder: '뉴스: description, title' },
        model: {
          type: 'string',
          title: 'GPT 모델',
          enum: ['gpt-4', 'gpt-3.5-turbo'],
          enumNames: ['GPT-4 (고성능)', 'GPT-3.5 (빠름/저렴)'],
          default: 'gpt-3.5-turbo',
        },
        batchSize: { type: 'number', title: '배치 크기', description: '한 번에 처리할 항목 수', minimum: 1, maximum: 20, default: 5 },
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
    description: '텍스트에서 주요 키워드 추출. 📌 출력 필드: word(키워드), count(빈도). 워드클라우드/차트 연결 시 이 필드명 사용!',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'keywords', label: '키워드 목록', type: 'array', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        textField: { type: 'string', title: '분석할 필드', description: '키워드 추출할 텍스트 필드명', default: 'description', placeholder: '뉴스: description, title' },
        topK: { type: 'number', title: '추출 개수', description: '상위 몇 개의 키워드를 추출할지', default: 10 },
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
    description: '시계열 데이터를 라인 차트로 표시. 📌 키워드추출 연결 시: X축=word, Y축=count',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'chart', label: '차트 설정', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        xField: { type: 'string', title: 'X축 필드', description: '가로축에 표시할 필드명', required: true, placeholder: '키워드추출→word, 그룹화→그룹필드명' },
        yField: { type: 'string', title: 'Y축 필드', description: '세로축 숫자 데이터 필드명', required: true, placeholder: '키워드추출→count, 그룹화→count' },
        title: { type: 'string', title: '차트 제목', description: '차트 상단에 표시할 제목', default: '', placeholder: '예: 키워드 빈도 분석' },
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
    description: '카테고리별 데이터를 바 차트로 표시. 📌 그룹화 연결 시: 카테고리=그룹필드, 값=count',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [{ id: 'chart', label: '차트 설정', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        categoryField: { type: 'string', title: '카테고리 필드', description: '막대 이름으로 사용할 필드', required: true, placeholder: '그룹화→그룹필드, 키워드→word' },
        valueField: { type: 'string', title: '값 필드', description: '막대 높이로 사용할 숫자 필드', required: true, placeholder: '그룹화→count, 키워드→count' },
        title: { type: 'string', title: '차트 제목', description: '차트 상단에 표시할 제목', default: '', placeholder: '예: 감성분석 결과' },
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
    description: '키워드 빈도를 워드 클라우드로 표시. 📌 키워드추출 노드와 연결 시 기본값 그대로 사용!',
    inputs: [{ id: 'data', label: '키워드 데이터', type: 'array', required: true }],
    outputs: [{ id: 'chart', label: '워드클라우드 설정', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        wordField: { type: 'string', title: '단어 필드', description: '표시할 단어가 있는 필드 (키워드추출=word)', default: 'word', placeholder: 'word' },
        countField: { type: 'string', title: '빈도 필드', description: '단어 크기를 결정할 숫자 필드 (키워드추출=count)', default: 'count', placeholder: 'count' },
        maxWords: { type: 'number', title: '최대 단어 수', description: '워드클라우드에 표시할 최대 단어 개수', default: 50 },
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
    description: '데이터를 테이블 형태로 표시. 비워두면 모든 컬럼 자동 표시',
    inputs: [{ id: 'data', label: '입력 데이터', type: 'array', required: true }],
    outputs: [],
    configSchema: {
      type: 'object',
      properties: {
        columns: { type: 'array', title: '표시할 컬럼', description: '비워두면 모든 컬럼 표시. 특정 컬럼만 보려면 입력', items: { type: 'string' }, placeholder: '뉴스: title, description, pubDate' },
        pageSize: { type: 'number', title: '페이지 크기', description: '한 페이지에 표시할 행 수', default: 10 },
      },
    },
    defaultConfig: { columns: [], pageSize: 10 },
    isPremium: false,
    averageRuntime: 50,
  },

  email_send: {
    type: 'email_send',
    category: 'output',
    displayName: '이메일 발송',
    icon: 'Mail',
    description: '분석 결과를 이메일로 발송',
    inputs: [{ id: 'content', label: '발송 내용', type: 'any', required: true }],
    outputs: [{ id: 'result', label: '발송 결과', type: 'object', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', title: '수신자', description: '이메일 주소 (여러 개는 콤마로 구분)', required: true, placeholder: 'user@example.com' },
        subject: { type: 'string', title: '제목', description: '이메일 제목', required: true, placeholder: '예: [자동발송] 뉴스 분석 결과' },
        bodyTemplate: { type: 'string', title: '본문 템플릿', description: '이메일 본문 내용. 데이터는 자동 첨부됨', placeholder: '분석 결과를 첨부합니다.' },
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
    description: '데이터를 CSV 파일로 다운로드. Excel에서 열기 가능',
    inputs: [{ id: 'data', label: '저장할 데이터', type: 'array', required: true }],
    outputs: [{ id: 'file', label: '생성된 파일', type: 'file', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        fileName: { type: 'string', title: '파일명', description: '저장할 파일 이름', default: 'output.csv', placeholder: '결과.csv' },
        delimiter: { type: 'string', title: '구분자', description: '일반적으로 콤마(,) 사용', default: ',', placeholder: ',' },
      },
    },
    defaultConfig: { fileName: 'output.csv', delimiter: ',' },
    isPremium: false,
    averageRuntime: 200,
  },

  excel_save: {
    type: 'excel_save',
    category: 'output',
    displayName: 'Excel 저장',
    icon: 'FileDown',
    description: '데이터를 Excel 파일(.xlsx)로 다운로드',
    inputs: [{ id: 'data', label: '저장할 데이터', type: 'array', required: true }],
    outputs: [{ id: 'file', label: '생성된 파일', type: 'file', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        fileName: { type: 'string', title: '파일명', description: '저장할 파일 이름 (.xlsx 확장자 자동 추가)', default: 'output.xlsx', placeholder: '분석결과.xlsx' },
        sheetName: { type: 'string', title: '시트명', description: 'Excel 시트 이름', default: 'Sheet1', placeholder: '결과데이터' },
      },
    },
    defaultConfig: { fileName: 'output.xlsx', sheetName: 'Sheet1' },
    isPremium: false,
    averageRuntime: 300,
  },

  txt_save: {
    type: 'txt_save',
    category: 'output',
    displayName: 'TXT 저장',
    icon: 'FileText',
    description: '텍스트를 TXT 파일로 다운로드. GPT 생성 보고서 저장에 적합',
    inputs: [{ id: 'text', label: '텍스트 데이터', type: 'string', required: true }],
    outputs: [{ id: 'file', label: '생성된 파일', type: 'file', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        fileName: { type: 'string', title: '파일명', description: '저장할 파일 이름', default: 'report.txt', placeholder: '보고서.txt' },
      },
    },
    defaultConfig: { fileName: 'report.txt' },
    isPremium: false,
    averageRuntime: 100,
  },

  markdown_save: {
    type: 'markdown_save',
    category: 'output',
    displayName: 'Markdown 저장',
    icon: 'FileCode',
    description: '텍스트를 Markdown 파일(.md)로 다운로드. 서식 있는 보고서 저장',
    inputs: [{ id: 'text', label: '텍스트 데이터', type: 'string', required: true }],
    outputs: [{ id: 'file', label: '생성된 파일', type: 'file', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        fileName: { type: 'string', title: '파일명', description: '저장할 파일 이름', default: 'report.md', placeholder: '보고서.md' },
        addTitle: { type: 'boolean', title: '제목 추가', description: '파일 상단에 제목 추가', default: true },
        title: { type: 'string', title: '문서 제목', description: '문서 상단에 표시할 제목', default: '분석 보고서', placeholder: 'AI 분석 리포트' },
      },
    },
    defaultConfig: { fileName: 'report.md', addTitle: true, title: '분석 보고서' },
    isPremium: false,
    averageRuntime: 100,
  },

  docx_save: {
    type: 'docx_save',
    category: 'output',
    displayName: 'DOCX 저장',
    icon: 'FileText',
    description: 'Word 문서(.docx)로 다운로드. 정식 보고서 형태',
    inputs: [{ id: 'text', label: '텍스트 데이터', type: 'string', required: true }],
    outputs: [{ id: 'file', label: '생성된 파일', type: 'file', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        fileName: { type: 'string', title: '파일명', description: '저장할 파일 이름', default: 'report.docx', placeholder: '보고서.docx' },
        title: { type: 'string', title: '문서 제목', description: '문서 상단에 표시할 제목', default: '분석 보고서', placeholder: 'AI 분석 리포트' },
        author: { type: 'string', title: '작성자', description: '문서 작성자 이름', default: '', placeholder: '홍길동' },
      },
    },
    defaultConfig: { fileName: 'report.docx', title: '분석 보고서', author: '' },
    isPremium: false,
    averageRuntime: 500,
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
