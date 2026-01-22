# AJ Canvas - 노코드 워크플로우 플랫폼 (Firebase + Netlify)

AI Canvas를 벤치마킹한 제약사 특화 노코드 워크플로우 플랫폼입니다.
Firebase 백엔드와 Netlify 프론트엔드로 구성되어 있습니다.

## 주요 기능

- **비주얼 워크플로우 에디터**: ReactFlow 기반 드래그&드롭 캔버스
- **15개 MVP 노드**: 데이터 입력, AI 처리, 시각화, 출력 노드
- **실시간 실행 모니터링**: 워크플로우 실행 상태 실시간 추적
- **Firebase 인증**: 이메일/비밀번호, Google 로그인

## 기술 스택

### Frontend
- **React 18** + TypeScript + Vite
- **ReactFlow** - 노드 기반 캔버스 에디터
- **Recharts** - 차트 시각화
- **Zustand** - 상태 관리
- **Tailwind CSS** - 스타일링
- **Netlify** - 배포

### Backend
- **Firebase Authentication** - 사용자 인증
- **Cloud Firestore** - NoSQL 데이터베이스
- **Cloud Functions** - 서버리스 API

## 노드 시스템 (15개 MVP)

### 데이터 입력 (3개)
- CSV 업로드
- 네이버 뉴스 검색
- 웹 크롤링

### 전처리 & AI (5개)
- 필터
- 그룹화
- GPT 텍스트 생성
- GPT 감성 분석
- 키워드 추출

### 시각화 (3개)
- 라인 차트
- 바 차트
- 워드 클라우드

### 출력 (4개)
- 데이터 테이블
- DOCX 리포트
- 이메일 발송
- CSV 저장

## 시작하기

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication 활성화 (Email/Password, Google 로그인)
3. Firestore Database 생성 (테스트 모드로 시작)
4. 프로젝트 설정 > 웹 앱 추가 > 설정 값 복사

### 2. 환경 변수 설정

```bash
cd frontend
cp .env.example .env
```

`.env` 파일에 Firebase 설정값 입력:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. 의존성 설치

```bash
# Frontend
cd frontend
npm install

# Functions
cd ../functions
npm install
```

### 4. 로컬 개발 서버 실행

```bash
# 프론트엔드 개발 서버
cd frontend
npm run dev
```

http://localhost:3000 에서 확인

### 5. Firebase Emulator 실행 (선택사항)

```bash
# 프로젝트 루트에서
firebase emulators:start
```

Emulator UI: http://localhost:4000

## 프로젝트 구조

```
firebase-test/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/         # 캔버스 에디터 컴포넌트
│   │   │   │   ├── CanvasEditor.tsx
│   │   │   │   ├── CustomNode.tsx
│   │   │   │   ├── NodePalette.tsx
│   │   │   │   ├── NodeConfigPanel.tsx
│   │   │   │   └── ExecutionPanel.tsx
│   │   │   ├── visualization/  # 차트 컴포넌트
│   │   │   │   ├── LineChart.tsx
│   │   │   │   ├── BarChart.tsx
│   │   │   │   └── PieChart.tsx
│   │   │   └── ui/             # 공통 UI 컴포넌트
│   │   ├── hooks/              # Custom Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useWorkflows.ts
│   │   │   └── useWorkflowActions.ts
│   │   ├── lib/
│   │   │   ├── firebase.ts     # Firebase 설정
│   │   │   └── nodes/
│   │   │       └── registry.ts # 노드 정의
│   │   ├── store/
│   │   │   └── workflowStore.ts # Zustand 상태 관리
│   │   ├── pages/              # 페이지 컴포넌트
│   │   └── types/              # TypeScript 타입
│   ├── netlify.toml            # Netlify 배포 설정
│   └── package.json
├── functions/                   # Cloud Functions
│   └── src/
│       └── index.ts            # API 엔드포인트
├── firebase.json               # Firebase 설정
├── firestore.rules             # Firestore 보안 규칙
└── firestore.indexes.json      # Firestore 인덱스
```

## 배포

### Netlify 배포 (Frontend)

1. [Netlify](https://netlify.com)에 로그인
2. "New site from Git" 선택
3. 저장소 연결
4. 빌드 설정:
   - Base directory: `firebase-test/frontend`
   - Build command: `npm run build`
   - Publish directory: `firebase-test/frontend/dist`
5. 환경 변수 추가 (Site settings > Environment variables)

### Firebase 배포 (Backend)

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 프로젝트 연결
firebase use your-project-id

# Firestore Rules 배포
firebase deploy --only firestore:rules

# Cloud Functions 배포
firebase deploy --only functions
```

## 사용법

1. 회원가입/로그인
2. "워크플로우" 메뉴에서 "새 워크플로우" 클릭
3. 좌측 노드 팔레트에서 노드를 드래그하여 캔버스에 추가
4. 노드를 연결하여 데이터 흐름 정의
5. 우측 패널에서 각 노드 설정
6. "실행" 버튼으로 워크플로우 테스트

## 라이선스

Private - 내부 사용 전용
