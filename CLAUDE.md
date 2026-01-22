# Workflow Automation Platform

노코드 워크플로우 자동화 플랫폼 - 뉴스 수집, AI 분석, 시각화를 드래그 앤 드롭으로 구현

## 프로젝트 구조

```
firebase-test/
├── frontend/                 # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   └── canvas/       # 워크플로우 에디터 컴포넌트
│   │   │       ├── CanvasEditor.tsx      # 메인 캔버스
│   │   │       ├── CustomNode.tsx        # 커스텀 노드 렌더링
│   │   │       ├── NodePalette.tsx       # 노드 팔레트 (좌측)
│   │   │       ├── NodeConfigPanel.tsx   # 노드 설정 패널 (우측)
│   │   │       ├── ExecutionPanel.tsx    # 실행 상태 패널
│   │   │       ├── ResultsModal.tsx      # 결과 모달
│   │   │       ├── ChartRenderer.tsx     # 차트 렌더링
│   │   │       └── FileUploadNode.tsx    # 파일 업로드
│   │   ├── hooks/
│   │   │   ├── useWorkflowActions.ts     # 워크플로우 저장/실행
│   │   │   └── useAuth.ts                # Firebase 인증
│   │   ├── lib/
│   │   │   ├── nodes/registry.ts         # 노드 정의
│   │   │   └── firebase.ts               # Firebase 설정
│   │   ├── store/
│   │   │   └── workflowStore.ts          # Zustand 상태관리
│   │   └── pages/                        # 페이지 컴포넌트
│   └── package.json
├── functions/                # Firebase Functions 백엔드
│   └── src/
│       └── index.ts          # API 엔드포인트
├── firestore.rules           # Firestore 보안 규칙
└── firebase.json
```

## 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** - 빌드 도구
- **ReactFlow** - 노드 기반 에디터
- **Zustand** - 상태 관리
- **Tailwind CSS** - 스타일링
- **Recharts** - 차트 시각화
- **XLSX** - Excel 파일 처리
- **docx** - Word 문서 생성
- **Lucide React** - 아이콘

### Backend
- **Firebase Functions** - 서버리스 API
- **Firebase Auth** - 사용자 인증
- **Firestore** - 데이터베이스
- **Express.js** - API 라우팅

### 외부 API
- **Naver News API** - 뉴스 검색
- **OpenAI API** - GPT 감성분석/텍스트생성

## 노드 구현 상태

### ✅ 완전 구현 (17개)

| 노드 | 카테고리 | 구현 내용 |
|------|----------|-----------|
| CSV 업로드 | Input | FileReader로 파일 파싱, 구분자/헤더 설정 |
| Excel 업로드 | Input | XLSX 라이브러리로 .xlsx/.xls 파싱 |
| 네이버 뉴스 검색 | Input | 실제 Naver API 호출 (Firebase Functions) |
| 필터 | Process | contains, equals, gt, lt 등 조건 필터링 |
| 그룹화 | Process | 필드별 그룹화 + count/sum/avg 집계 |
| GPT 감성 분석 | AI | OpenAI API로 positive/negative/neutral 분석 |
| GPT 텍스트 생성 | AI | OpenAI API로 프롬프트 기반 텍스트 생성 |
| 키워드 추출 | AI | 단어 빈도 분석 + 불용어 필터링 |
| 라인 차트 | Visualization | Recharts LineChart (자동 렌더링) |
| 바 차트 | Visualization | Recharts BarChart (자동 렌더링) |
| 워드클라우드 | Visualization | 크기별 텍스트 + PieChart (자동 렌더링) |
| 데이터 테이블 | Output | 테이블 형태 결과 출력 |
| CSV 저장 | Output | UTF-8 BOM 인코딩 다운로드 |
| Excel 저장 | Output | XLSX 라이브러리로 .xlsx 다운로드 |
| TXT 저장 | Output | 텍스트 파일 다운로드 |
| Markdown 저장 | Output | .md 파일 다운로드, 제목 추가 옵션 |
| DOCX 저장 | Output | Word 문서 생성 (docx 라이브러리) |

### ❌ 미구현 (2개)

| 노드 | 카테고리 | 필요 작업 |
|------|----------|-----------|
| 웹 크롤링 | Input | Puppeteer/Cheerio 백엔드 구현 필요 |
| 이메일 발송 | Output | SendGrid/Nodemailer 연동 필요 |

## 주요 기능

### 1. 노드 개별 실행
- 전체 워크플로우 실행 외에 개별 노드만 실행 가능
- 우측 패널의 "실행" 버튼 클릭
- 연결된 이전 노드의 결과를 자동으로 사용
- 이전 노드가 실행되지 않은 경우 에러 메시지 표시

### 2. 필드 선택 드롭다운
- 차트 노드의 X축/Y축 필드를 드롭다운으로 선택
- 이전 노드의 업로드 데이터 또는 실행 결과에서 컬럼 자동 추출
- 지원 필드: field, textField, groupField, valueField, xField, yField, categoryField, wordField, countField

### 3. 차트 자동 렌더링
- 차트 노드 실행 결과를 JSON이 아닌 실제 차트로 표시
- 우측 패널에서 미리보기
- 결과 모달에서 차트 뷰 자동 전환

### 4. 연결 끊기 기능
- 노드 선택 시 "연결된 노드" 섹션 표시
- 입력/출력 연결 목록 확인
- 각 연결별 끊기 버튼 제공

### 5. 텍스트 보고서 저장
- TXT: 단순 텍스트 파일
- Markdown: 제목 추가 옵션, .md 형식
- DOCX: Word 문서, 제목/작성자/날짜 포함

## API 엔드포인트

### Firebase Functions (`/api`)

```
POST /naver/news          - 네이버 뉴스 검색
POST /openai/sentiment    - GPT 감성 분석
POST /openai/generate     - GPT 텍스트 생성
GET  /workflows           - 워크플로우 목록
POST /workflows           - 워크플로우 생성
PUT  /workflows/:id       - 워크플로우 수정
DELETE /workflows/:id     - 워크플로우 삭제
GET  /tasks               - 태스크 목록
POST /tasks               - 태스크 생성
```

## 환경 변수

### Frontend (`.env`)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=https://us-central1-[project-id].cloudfunctions.net/api
```

### Backend (Firebase Config)
```bash
firebase functions:config:set naver.client_id="YOUR_NAVER_CLIENT_ID"
firebase functions:config:set naver.client_secret="YOUR_NAVER_CLIENT_SECRET"
firebase functions:config:set openai.api_key="YOUR_OPENAI_API_KEY"
```

## 개발 명령어

```bash
# 프론트엔드 개발 서버
cd frontend && npm run dev

# Firebase Functions 로컬 테스트
cd functions && npm run serve

# 프론트엔드 빌드
cd frontend && npm run build

# Functions 배포
firebase deploy --only functions

# 전체 배포
firebase deploy
```

## 주요 파일 설명

### `useWorkflowActions.ts`
- 워크플로우 저장/실행 로직
- 토폴로지 정렬로 노드 실행 순서 결정
- 각 노드 타입별 실행 로직 (switch-case)
- API 호출 (Naver, OpenAI)
- `executeSingleNode`: 단일 노드 실행
- `getConnectedInputs`: 연결된 입력 노드 결과 수집

### `workflowStore.ts`
- Zustand 기반 전역 상태
- 노드/엣지 관리
- 실행 상태 (isExecuting, nodeStatuses, nodeResults)
- `deleteEdge`: 엣지(연결) 삭제

### `NodeConfigPanel.tsx`
- 노드 설정 패널 (우측 사이드바)
- 필드 선택 드롭다운 (availableColumns)
- 연결된 노드 목록 및 끊기 버튼
- 차트 미리보기 렌더링
- 개별 실행 버튼

### `ResultsModal.tsx`
- 실행 결과 모달
- 테이블/차트/JSON 뷰 모드
- 차트 데이터 자동 감지 및 뷰 전환

### `registry.ts`
- 모든 노드 정의 (17개 + 미구현 2개)
- 카테고리, 설정 스키마, 입출력 정의

### `ChartRenderer.tsx`
- Recharts 기반 차트 렌더링
- LineChart, BarChart, WordCloud(PieChart) 지원

### `FileUploadNode.tsx`
- 드래그 앤 드롭 파일 업로드
- CSV/Excel 파싱 및 미리보기

## 해결된 이슈

1. **워크플로우 저장 안됨** - Firestore rules 수정 (`resource == null` 허용)
2. **결과 모달 흰 화면** - `Object.keys(null)` 에러 수정
3. **GPT 노드 미작동** - OpenAI API 실제 연동
4. **GPT 결과가 CSV에 원본 데이터로 저장됨** - `getConnectedInputs` 함수로 연결된 노드만 필터링
5. **React hooks 에러 #300** - useMemo를 조건부 return 전에 호출하도록 수정
6. **차트가 JSON으로 표시됨** - ChartRenderer 자동 렌더링 추가

## 배포 정보

- **Frontend**: Vercel (자동 배포)
- **Backend**: Firebase Functions
- **Database**: Firestore
- **Auth**: Firebase Authentication

## 최근 업데이트

- 2024-01: 노드 개별 실행 기능 추가
- 2024-01: 차트/워드클라우드 자동 렌더링
- 2024-01: 연결 끊기 기능 추가
- 2024-01: TXT, Markdown, DOCX 저장 노드 추가
- 2024-01: 필드 선택 드롭다운 기능 추가

## 라이선스

Private Project
