# Webinars V3 PRD

## 개요

- **프로젝트명**: Webinars V3
- **목적**: 기존 WordPress 기반 웹사이트(webinars.co.kr)를 React/Vite 기반 SPA로 재구성
- **현재 상태**: Phase 1 완료 - 정적 페이지 마이그레이션 및 모달 시스템 구현
- **배포**: GitHub Pages (https://github.com/webinarsDev/webinars)

## 기술 스택 (현재 구현)

| 분류 | 기술 | 버전 |
|------|------|------|
| Frontend | React | 19.2.0 |
| Router | react-router-dom | 7.9.6 |
| Build Tool | Vite | 7.2.2 |
| Testing | Playwright | 1.56.1 |
| HTTP Client | Axios | 1.13.2 |
| HTML Parser | Cheerio | 1.1.2 |

## 프로젝트 구조

```
webinars_v3/
├── src/
│   ├── App.jsx              # 메인 앱 + 라우팅 설정
│   ├── main.jsx             # Vite 엔트리 포인트
│   ├── assets/
│   │   └── images/          # 모달용 이미지 에셋 (8개)
│   └── components/
│       ├── PageRenderer.jsx # 페이지 렌더러 + 모달 컴포넌트
│       └── ModalContent.jsx # 모달 콘텐츠 매핑 (33개 페이지)
├── archive/
│   ├── components/          # WordPress에서 변환된 JSX 컴포넌트 (48개)
│   └── pages/               # 원본 HTML 페이지 (44개)
├── public/
│   ├── css/                 # WordPress 스타일시트 (34개)
│   ├── fonts/               # 웹폰트 파일
│   └── js/                  # WordPress JavaScript
├── doc/
│   └── projects/
│       └── webinars-prd.md  # 이 문서
├── index.html               # Vite HTML 템플릿
├── vite.config.mjs          # Vite 설정
├── package.json             # 프로젝트 설정
└── playwright.config.js     # E2E 테스트 설정
```

## 구현 완료 기능

### 1. 페이지 라우팅 (5개 메인 페이지)

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | IndexPage | 홈페이지 (메인 비주얼 + 레퍼런스 그리드) |
| `/about` | AboutPage | 회사 소개 |
| `/services`, `/services2` | Services2Page | 서비스 소개 |
| `/reference` | ReferencePage | 레퍼런스 목록 |
| `/contact` | ContactPage | 문의하기 |

### 2. 모달 시스템

- **구현 방식**: React Portal 기반 모달
- **지원 페이지**: 33개 이벤트/웨비나 상세 페이지
- **기능**:
  - 모달 열기: 레퍼런스 카드 클릭
  - 모달 닫기: X 버튼, ESC 키, 배경 클릭
  - 스크롤바: 호버 시에만 표시 (overlay 방식)
  - 페이지 스크롤 방지: body overflow hidden

### 3. 이벤트 페이지 라우트 (33개)

**오프라인 이벤트:**
- `/2023_offline_1201/`, `/2024_offline_0705/`, `/2024_offline_0904/`
- `/2024_offline_0927/`, `/2024_offline_1010/`, `/2024_offline_1028/`
- `/2024_offline_2/`, `/2024_offline_3/`, `/2024_offline_6/`, `/2024_offline_9/`
- `/2024_offline_acts2024/`, `/2024_offline_rmaf0715/`

**하이브리드 이벤트:**
- `/2024_hybrid_4/`, `/2024_hybrid_5/`, `/2024_hybrid_8/`
- `/hybrid_1/` ~ `/hybrid_12/`

**라이브 스트리밍:**
- `/webinar_live-streaming_13/`, `/webinar_live-streaming_14/`, `/webinar_live-streaming_15/`

**WEBINAR 서브디렉토리:**
- `/WEBINAR/2024_design_publication_1/`
- `/WEBINAR/2024_offline_7/`
- `/WEBINAR/webinar_live-streaming_10/`

### 4. UI/UX 개선사항

- **헤더 위치**: 서브페이지 헤더가 홈페이지와 동일하게 표시
- **모달 스크롤바**: overflow: overlay로 레이아웃 시프트 방지
- **CONTACT 라디오 버튼**: 가시성 개선
- **에러 바운더리**: 페이지 오류 시 사용자 친화적 에러 화면

### 5. 링크 어댑터

- WordPress URL (`https://webinars.co.kr/*`)을 로컬 경로로 자동 변환
- GNB 네비게이션 클릭 시 SPA 라우팅 적용
- 모달 링크와 일반 링크 구분 처리

## 디자인/스타일

### CSS 구조
- WordPress에서 추출한 34개 CSS 파일 사용
- `inline-styles.css`에 커스텀 오버라이드 추가
- Salient 테마 기반 (Nectar 컴포넌트)

### 주요 CSS 클래스
- `.page-container`: 페이지 래퍼
- `.section`, `.row`: 콘텐츠 섹션
- `#header-outer`: 메인 헤더
- `.modal-overlay`, `.modal-container`: 모달 시스템

## 개발 명령어

```bash
# 개발 서버 실행 (포트 5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 향후 계획

### Phase 2: 백엔드 연동 (예정)
- [ ] Supabase 또는 다른 BaaS 연동
- [ ] 이벤트 데이터 동적 로딩
- [ ] 문의 폼 백엔드 처리

### Phase 3: 기능 확장 (예정)
- [ ] 이벤트 신청 시스템
- [ ] 사용자 인증
- [ ] 관리자 대시보드

### 기술 개선 (예정)
- [ ] TypeScript 마이그레이션
- [ ] CSS 모듈 또는 Tailwind CSS 적용
- [ ] SEO 메타 태그 동적 생성
- [ ] 이미지 최적화 (WebP, lazy loading)

## 체크리스트

### 완료
- [x] React/Vite 프로젝트 설정
- [x] WordPress HTML → JSX 변환 (48개 컴포넌트)
- [x] 메인 페이지 라우팅 (5개)
- [x] 이벤트 상세 페이지 라우팅 (33개)
- [x] 모달 시스템 구현
- [x] 링크 어댑터 (WordPress URL 변환)
- [x] 에러 바운더리
- [x] GitHub 배포

### 진행 중
- [ ] 모바일 반응형 최적화
- [ ] 성능 최적화

### 예정
- [ ] Playwright E2E 테스트 작성
- [ ] CI/CD 파이프라인 구축
- [ ] 프로덕션 도메인 연결

## 참고 자료

- **원본 사이트**: https://webinars.co.kr
- **GitHub 저장소**: https://github.com/webinarsDev/webinars
- **개발 서버**: http://localhost:5173
