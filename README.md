# HotsTinder 🎮

Heroes of the Storm 매치메이킹 및 리플레이 분석 플랫폼

## 📋 프로젝트 개요

HotsTinder는 Heroes of the Storm 게임을 위한 종합적인 매치메이킹 플랫폼입니다. 플레이어들이 균형 잡힌 매치를 찾고, 게임 결과를 분석할 수 있는 기능을 제공합니다.

### 🎯 주요 기능

- **매치메이킹 시스템**: MMR 기반 균형 잡힌 팀 매칭
- **실시간 대기열**: WebSocket 기반 실시간 상태 업데이트
- **Battle.net 연동**: Battle.net OAuth를 통한 간편 로그인
- **관리자 대시보드**: 사용자 및 매치 관리 기능
- **리플레이 분석**: 게임 통계 및 성과 분석
- **반응형 UI**: 모바일 및 데스크톱 최적화

## 🛠️ 기술 스택

### Frontend
- **React 18** + **Vite** - 모던 프론트엔드 개발
- **TailwindCSS** - 유틸리티 우선 CSS 프레임워크
- **Zustand** - 경량 상태 관리
- **React Router v6** - 클라이언트 사이드 라우팅
- **Socket.IO Client** - 실시간 통신
- **Axios** - HTTP 클라이언트
- **React Toastify** - 알림 시스템

### Backend
- **Node.js** + **Express** - 서버 프레임워크
- **PostgreSQL** + **Sequelize ORM** - 데이터베이스
- **Socket.IO** - 실시간 WebSocket 통신
- **Redis** - 고성능 캐싱 (폴백: 메모리 캐시)
- **JWT** - 인증 토큰
- **bcryptjs** - 비밀번호 암호화
- **Winston** - 로깅 시스템

### 배포 및 인프라
- **Vercel** - 프론트엔드 및 서버리스 API 배포
- **PostgreSQL** - 클라우드 데이터베이스
- **Battle.net API** - OAuth 인증

## 📁 프로젝트 구조

```
hotstinder/
├── client/                 # React 프론트엔드
│   ├── public/            # 정적 파일
│   ├── src/
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── stores/        # Zustand 상태 관리
│   │   ├── services/      # API 및 Socket 서비스
│   │   ├── utils/         # 유틸리티 함수
│   │   └── App.jsx        # 메인 앱 컴포넌트
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js 백엔드 (개발용)
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── models/        # Sequelize 모델
│   │   ├── services/      # 비즈니스 로직 서비스
│   │   ├── utils/         # 백엔드 유틸리티
│   │   ├── middleware/    # 미들웨어
│   │   └── server.js      # 서버 진입점
│   └── package.json
├── api/                   # Vercel 서버리스 함수 (배포용)
│   ├── auth/             # 인증 관련 API
│   │   ├── me.js         # 사용자 정보 조회
│   │   ├── admin-login.js # 관리자 로그인
│   │   ├── dashboard.js  # 관리자 대시보드
│   │   └── bnet/
│   │       └── callback.js # Battle.net 콜백
│   ├── matchmaking.js    # 매치메이킹 API
│   ├── users.js          # 사용자 관리 API
│   ├── matches.js        # 매치 관리 API
│   ├── init-data.js      # 더미 데이터 초기화
│   └── sample-data.js    # 샘플 데이터 조회
├── .env.example          # 환경 변수 예시
├── .cursorrules          # Cursor AI 규칙
├── package.json          # 루트 패키지 설정
└── README.md
```

## 🚀 시작하기

### 필수 요구사항

- **Node.js** 18.0.0 이상
- **PostgreSQL** 13.0 이상
- **Redis** (선택사항, 없으면 메모리 캐시 사용)
- **Battle.net 개발자 계정** (OAuth 설정용)

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/hotstinder.git
cd hotstinder
```

### 2. 의존성 설치

```bash
# 루트 의존성 설치
npm install

# 클라이언트 의존성 설치
cd client
npm install

# 서버 의존성 설치
cd ../server
npm install
```

### 3. 환경 변수 설정

루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 데이터베이스 설정
DATABASE_URL=postgresql://username:password@localhost:5432/hotstinder

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here

# Battle.net OAuth 설정
BNET_CLIENT_ID=your-battlenet-client-id
BNET_CLIENT_SECRET=your-battlenet-client-secret
BNET_REDIRECT_URI=http://localhost:5173/auth/callback
BNET_REGION=kr

# Redis 설정 (선택사항)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 환경 설정
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

클라이언트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_BNET_CLIENT_ID=your-battlenet-client-id
REACT_APP_BNET_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 4. 데이터베이스 설정

PostgreSQL 데이터베이스를 생성하고 필요한 테이블을 설정하세요:

```sql
-- 데이터베이스 생성
CREATE DATABASE hotstinder;

-- 사용자 테이블 (Sequelize가 자동으로 생성하지만 참고용)
-- 서버 실행 시 자동으로 테이블이 생성됩니다.
```

### 5. 개발 서버 실행

터미널을 3개 열어서 각각 실행하세요:

```bash
# 터미널 1: 백엔드 서버
cd server
npm run dev

# 터미널 2: 프론트엔드 개발 서버
cd client
npm run dev

# 터미널 3: Redis 서버 (선택사항)
redis-server
# 또는 Windows의 경우: memurai
```

### 6. 애플리케이션 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:5000
- **관리자 페이지**: http://localhost:5173/admin

## 🎮 사용법

### 일반 사용자

1. **Battle.net 로그인**: 메인 페이지에서 Battle.net 계정으로 로그인
2. **프로필 설정**: 선호 역할, 이전 티어 등 설정
3. **매치메이킹**: 대기열에 참가하여 균형 잡힌 매치 찾기
4. **게임 결과**: 매치 완료 후 상세 통계 확인

### 관리자

1. **관리자 로그인**: `/admin` 페이지에서 이메일/비밀번호로 로그인
2. **대시보드**: 전체 사용자 및 매치 통계 확인
3. **사용자 관리**: 사용자 정보 조회 및 관리
4. **매치 관리**: 매치 결과 조회 및 관리

## 🔧 개발 가이드

### 코딩 규칙

- **언어**: 모든 코드 주석과 변수명은 한국어 사용
- **스타일**: ESLint + Prettier 설정 준수
- **컴포넌트**: 함수형 컴포넌트 + Hooks 패턴
- **상태 관리**: Zustand 사용 (Redux 대신)
- **스타일링**: TailwindCSS 클래스 우선 사용

### API 규칙

- **RESTful**: 명확한 HTTP 메서드 사용
- **응답 형식**: `{ success: boolean, data?: any, message?: string }`
- **에러 처리**: 적절한 HTTP 상태 코드와 에러 메시지
- **인증**: JWT 토큰 기반 인증

### 데이터베이스 규칙

- **ORM**: Sequelize 사용
- **필드명**: camelCase (JS) ↔ snake_case (DB) 매핑
- **관계**: 명확한 외래키 관계 설정
- **타입**: DataTypes 명시적 사용

## 🚀 배포

### Vercel 배포

1. **Vercel 계정 연결**: GitHub 저장소를 Vercel에 연결
2. **환경 변수 설정**: Vercel 대시보드에서 환경 변수 설정
3. **자동 배포**: main 브랜치 푸시 시 자동 배포

### 환경 변수 (프로덕션)

```env
DATABASE_URL=your-production-postgresql-url
JWT_SECRET=your-production-jwt-secret
BNET_CLIENT_ID=your-production-bnet-client-id
BNET_CLIENT_SECRET=your-production-bnet-client-secret
BNET_REDIRECT_URI=https://your-domain.vercel.app/auth/callback
FRONTEND_URL=https://your-domain.vercel.app
NODE_ENV=production
```

## 📊 주요 기능 상세

### 매치메이킹 시스템

- **MMR 기반 매칭**: 사용자의 MMR을 기반으로 균형 잡힌 팀 구성
- **역할 기반 매칭**: 선호 역할을 고려한 팀 밸런싱
- **실시간 대기열**: WebSocket을 통한 실시간 상태 업데이트
- **시뮬레이션 모드**: 테스트용 가상 매치 생성

### 전장 시스템

현재 지원하는 11개 전장:
- 용의 둥지
- 저주받은 골짜기
- 공포의 정원
- 하늘사원
- 거미 여왕의 무덤
- 영원의 전쟁터
- 불지옥 신단
- 파멸의 탑
- 브락식스 항전
- 볼스카야 공장
- 알터랙 고개

### 실시간 기능

- **WebSocket 연결**: Socket.IO 기반 실시간 통신
- **대기열 상태**: 전역 대기열 상태 표시
- **매치 알림**: 매치 찾음 알림 및 상태 변경
- **자동 재연결**: 연결 끊김 시 자동 재연결

## 🔍 문제 해결

### 일반적인 문제

1. **PostgreSQL 연결 오류**
   - DATABASE_URL 환경 변수 확인
   - PostgreSQL 서버 실행 상태 확인
   - 방화벽 설정 확인

2. **Battle.net OAuth 오류**
   - BNET_CLIENT_ID, BNET_CLIENT_SECRET 확인
   - 리디렉션 URI 매칭 확인
   - Battle.net 개발자 콘솔 설정 확인

3. **Redis 연결 실패**
   - Redis 서버 실행 상태 확인
   - 연결 실패 시 메모리 캐시로 자동 폴백

4. **WebSocket 연결 문제**
   - 서버 실행 상태 확인
   - 방화벽 및 프록시 설정 확인
   - 브라우저 개발자 도구에서 연결 상태 확인

### 로그 확인

```bash
# 서버 로그 확인
cd server
npm run dev

# 클라이언트 로그 확인 (브라우저 개발자 도구)
F12 -> Console 탭
```

## 🤝 기여하기

1. **Fork** 저장소를 포크합니다
2. **Branch** 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. **Commit** 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. **Push** 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. **Pull Request** 풀 리퀘스트를 생성합니다

### 개발 규칙

- 모든 코드는 한국어 주석 작성
- ESLint 규칙 준수
- 기능 추가 시 테스트 코드 작성
- 커밋 메시지는 한국어로 작성

## 📝 변경 로그

### v1.0.0 (2025-05-30)

#### 🎉 주요 기능
- **매치메이킹 시스템**: MMR 기반 균형 잡힌 팀 매칭
- **Battle.net 연동**: OAuth 기반 간편 로그인
- **실시간 대기열**: WebSocket 기반 실시간 상태 업데이트
- **관리자 대시보드**: 사용자 및 매치 관리 기능

#### 🛠️ 기술적 개선
- **데이터베이스 통일**: MongoDB → PostgreSQL + Sequelize 완전 이전
- **실시간 시스템**: Socket.IO + Redis 캐시 시스템 구축
- **UI/UX 개선**: 전장 목록 3열 그리드, 대기열 상태창 디자인 개선
- **성능 최적화**: MMR 기반 배치 매치메이킹, 캐시 시스템

#### 🐛 버그 수정
- NaN:NaN 시간 표시 문제 해결
- PostgreSQL 타입 불일치 오류 해결
- 대기열 상태 전역 표시 문제 해결
- 관리자 메뉴 숨김 처리

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 연락처

- **프로젝트 링크**: [https://github.com/your-username/hotstinder](https://github.com/your-username/hotstinder)
- **이슈 리포트**: [GitHub Issues](https://github.com/your-username/hotstinder/issues)

## 🙏 감사의 말

- **Blizzard Entertainment** - Heroes of the Storm 게임 제공
- **Battle.net API** - OAuth 인증 서비스 제공
- **오픈소스 커뮤니티** - 사용된 모든 라이브러리와 도구들

---

**Heroes of the Storm** 커뮤니티를 위한 매치메이킹 플랫폼 🎮
