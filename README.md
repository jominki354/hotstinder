# 🎮 HotsTinder - Heroes of the Storm 매치메이킹 플랫폼

Heroes of the Storm 플레이어들을 위한 매치메이킹 및 리플레이 분석 플랫폼입니다.

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
- **Axios** - HTTP 클라이언트
- **React Toastify** - 알림 시스템

### Backend
- **Vercel Serverless Functions** - 서버리스 API
- **PostgreSQL** + **Sequelize ORM** - 데이터베이스
- **JWT** - 인증 토큰
- **bcryptjs** - 비밀번호 암호화
- **HTTP 폴링** - 실시간 상태 업데이트 (3초 간격)

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
│   │   ├── services/      # API 서비스
│   │   ├── utils/         # 유틸리티 함수
│   │   └── App.js         # 메인 앱 컴포넌트
│   ├── package.json       # 클라이언트 의존성
│   └── tailwind.config.js # TailwindCSS 설정
├── api/                   # Vercel 서버리스 함수
│   ├── auth/             # 인증 관련 API
│   ├── users.js          # 사용자 관리 API
│   ├── matches.js        # 매치 관리 API
│   ├── matchmaking.js    # 매치메이킹 API
│   └── index.js          # 메인 API 엔드포인트
├── server/               # 로컬 개발용 서버 (선택사항)
│   ├── src/
│   │   ├── routes/       # API 라우트
│   │   ├── models/       # Sequelize 모델
│   │   ├── services/     # 비즈니스 로직
│   │   └── utils/        # 서버 유틸리티
│   └── package.json      # 서버 의존성
├── vercel.json           # Vercel 배포 설정
├── package.json          # 루트 의존성
└── README.md             # 프로젝트 문서
```

## 🚀 시작하기

### 필수 요구사항

- **Node.js** 18.0.0 이상
- **PostgreSQL** 클라우드 데이터베이스
- **Battle.net 개발자 계정** (OAuth 설정용)
- **Vercel 계정** (배포용)

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/hotstinder.git
cd hotstinder
```

### 2. 환경 변수 설정

루트 디렉토리에 `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# 데이터베이스
DATABASE_URL=postgresql://username:password@host:port/database

# JWT 인증
JWT_SECRET=your-super-secret-jwt-key

# Battle.net OAuth
BNET_CLIENT_ID=your-battlenet-client-id
BNET_CLIENT_SECRET=your-battlenet-client-secret
BNET_CALLBACK_URL=https://your-domain.vercel.app/api/auth/bnet/callback
BNET_REGION=kr

# 기타
FRONTEND_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### 3. 의존성 설치

```bash
# 루트 의존성 설치
npm install

# 클라이언트 의존성 설치
cd client
npm install
cd ..

# 서버 의존성 설치 (로컬 개발용)
cd server
npm install
cd ..
```

### 4. 로컬 개발 서버 실행

```bash
# 클라이언트 개발 서버 (포트 3000)
cd client
npm start

# 서버 개발 서버 (포트 5000) - 별도 터미널에서
cd server
npm run dev
```

### 5. Vercel 배포

```bash
# Vercel CLI 설치 (전역)
npm install -g vercel

# 프로젝트 배포
vercel

# 환경 변수 설정 (Vercel 대시보드에서도 가능)
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add BNET_CLIENT_ID
vercel env add BNET_CLIENT_SECRET
```

## 🎮 주요 기능

### ✅ 완성된 기능
- **사용자 인증**: Battle.net OAuth 로그인
- **프로필 관리**: 사용자 정보 및 설정
- **매치메이킹**: MMR 기반 자동 매칭 시스템
- **매치 기록**: 게임 결과 및 통계 저장
- **리더보드**: 랭킹 시스템
- **관리자 패널**: 사용자 및 매치 관리
- **실시간 상태**: HTTP 폴링 기반 상태 업데이트

### 🔄 실시간 기능 (HTTP 폴링)
- **대기열 상태**: 3초마다 대기열 정보 업데이트
- **매치 찾기**: 자동 매치 감지 및 알림
- **플레이어 수**: 실시간 대기 중인 플레이어 수 표시

## 🎯 게임 특화 기능

### Heroes of the Storm 통합
- **영웅 데이터**: 전체 영웅 목록 및 정보
- **맵 시스템**: 11개 전장 지원
- **MMR 시스템**: 개별 MMR 추적
- **게임 모드**: 빠른 대전, 영웅 리그 등

### 매치메이킹 알고리즘
- **밸런스 매칭**: MMR 기반 팀 구성
- **역할 분배**: 탱커, 딜러, 힐러 균형
- **대기 시간 최적화**: 효율적인 매칭 시간

## 🔧 개발 가이드

### API 엔드포인트

```
GET    /api/health              # 서버 상태 확인
POST   /api/auth/login          # 로그인
GET    /api/auth/me             # 현재 사용자 정보
POST   /api/matchmaking/join    # 대기열 참가
GET    /api/matchmaking/status  # 대기열 상태 (폴링용)
POST   /api/matchmaking/leave   # 대기열 탈퇴
GET    /api/matches             # 매치 목록
GET    /api/users               # 사용자 목록
GET    /api/leaderboard         # 리더보드
```

### 데이터베이스 스키마

```sql
-- 사용자 테이블
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  bnet_id VARCHAR(255) UNIQUE,
  battletag VARCHAR(255),
  mmr INTEGER DEFAULT 1500,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 매치 테이블
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  map_name VARCHAR(255),
  game_mode VARCHAR(100),
  winner INTEGER, -- 0: blue, 1: red
  game_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 매치 참가자 테이블
CREATE TABLE match_participants (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id),
  user_id INTEGER REFERENCES users(id),
  team INTEGER, -- 0: blue, 1: red
  hero_name VARCHAR(255),
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0
);
```

## 🔍 문제 해결

### 일반적인 문제

1. **PostgreSQL 연결 오류**
   - DATABASE_URL 환경 변수 확인
   - PostgreSQL 클라우드 서버 연결 상태 확인
   - Vercel 환경 변수 설정 확인

2. **Battle.net OAuth 오류**
   - BNET_CLIENT_ID, BNET_CLIENT_SECRET 확인
   - 리디렉션 URI 매칭 확인 (https://your-domain.vercel.app/auth/callback)
   - Battle.net 개발자 콘솔 설정 확인

3. **Vercel 배포 오류**
   - 환경 변수가 Vercel 대시보드에 올바르게 설정되었는지 확인
   - 빌드 로그에서 오류 메시지 확인
   - 서버리스 함수 타임아웃 (30초) 제한 고려

4. **API 응답 오류**
   - 브라우저 개발자 도구에서 네트워크 탭 확인
   - Vercel Functions 로그 확인
   - CORS 설정 확인

### 로그 확인

```bash
# 로컬 개발 시 서버 로그 확인
cd server
npm run dev

# Vercel 배포 로그 확인
vercel logs

# 클라이언트 로그 확인 (브라우저 개발자 도구)
F12 -> Console 탭
```

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 말

- **Blizzard Entertainment** - Heroes of the Storm 게임 제공
- **Vercel** - 무료 호스팅 플랫폼 제공
- **Heroes of the Storm 커뮤니티** - 지속적인 지원과 피드백

---

**참고**: 이 프로젝트는 Vercel 서버리스 환경에 최적화되어 있으며, WebSocket 대신 HTTP 폴링을 사용하여 실시간 기능을 구현합니다.
