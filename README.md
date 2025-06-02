# 🔥 HotsTinder - Heroes of the Storm 매치메이킹 플랫폼

Heroes of the Storm 커뮤니티를 위한 **사설 서버 매치메이킹 및 리플레이 분석 플랫폼**입니다.

## ✨ 주요 기능

### 🎯 **매치메이킹 시스템**
- **MMR 기반 균형 잡힌 팀 매칭**
- **실시간 대기열 상태 표시** (모든 페이지에서 확인 가능)
- **역할별 선호도 매칭** (7개 역할: 탱커, 브루저, 원거리 딜러, 근접 딜러, 힐러, 지원가, 상관없음)
- **서버 상태 동기화** (페이지 이동 후에도 대기열 상태 유지)
- **개발용 시뮬레이션 모드** (개발 환경 전용)
- **고급 애니메이션 시스템** (버튼 상태별 시각적 피드백)

### 🏆 **리플레이 분석**
- **Heroes Profile 연동** 자동 리플레이 업로드
- **상세 경기 통계** (KDA, 딜량, 힐량, 경험치 기여도)
- **MMR 변동 추적**
- **팀 밸런스 분석**

### 👤 **사용자 관리**
- **Battle.net OAuth 인증**
- **MMR 및 랭킹 시스템** (브론즈 ~ 그랜드마스터 티어)
- **프로필 커스터마이징** (선호 역할, 이전 티어 설정)
- **경기 히스토리 추적**

### 🛡️ **관리자 기능**
- **실시간 매치 모니터링**
- **사용자 관리 및 제재**
- **시스템 통계 대시보드**
- **리플레이 데이터 관리**
- **서버 시작/종료 시 자동 정리** (대기열 및 진행 중인 매치 삭제)

## 🏗️ 기술 스택

### **Frontend**
- **React 18** + **Vite** (빠른 개발 환경)
- **TailwindCSS** (유틸리티 우선 스타일링)
- **Zustand** (경량 상태 관리)
- **Axios** (HTTP 클라이언트)
- **React Router v6** (라우팅)
- **React Toastify** (알림 시스템)

### **Backend (Vercel 서버리스)**
- **Node.js** + **Express** (API 서버)
- **PostgreSQL** + **Sequelize ORM** (데이터베이스)
- **JWT** (인증)
- **Battle.net OAuth** (소셜 로그인)
- **메모리 캐시** (성능 최적화)
- **Winston** (로깅 시스템)

### **배포 및 인프라**
- **Vercel** (프론트엔드 + 서버리스 API)
- **Vercel PostgreSQL** (관리형 데이터베이스)
- **Docker** (로컬 개발 환경)

## 🚀 빠른 시작

### **1. 저장소 클론**
```bash
git clone https://github.com/your-username/hotstinder.git
cd hotstinder
```

### **2. 환경 변수 설정**
```bash
# 루트 디렉토리에 .env 파일 생성
cp .env.example .env

# 필수 환경 변수 설정
DATABASE_URL=postgresql://username:password@localhost:5432/hotstinder
JWT_SECRET=your-super-secret-jwt-key
BNET_CLIENT_ID=your-battlenet-client-id
BNET_CLIENT_SECRET=your-battlenet-client-secret
```

### **3. 데이터베이스 설정 (Docker)**
```bash
# PostgreSQL 데이터베이스 시작
docker-compose -f docker-compose.db-only.yml up -d

# 데이터베이스 연결 확인
docker ps
```

### **4. 의존성 설치 및 실행**
```bash
# 클라이언트 의존성 설치
cd client
npm install

# 개발 서버 시작
npm run dev
```

### **5. 서버 실행 (로컬 개발용)**
```bash
# 서버 의존성 설치
cd server
npm install

# 개발 서버 시작
npm run dev
```

## 📋 매치메이킹 시스템 상세

### **🔄 실시간 상태 동기화**
- **전역 대기열 상태창**: 모든 페이지에서 대기열 상태 확인 가능
- **서버 상태 폴링**: 3초마다 서버와 상태 동기화
- **페이지 이동 후 복원**: 다른 페이지 이동 후에도 대기열 상태 유지
- **네트워크 오류 처리**: 연결 실패 시 로컬 상태 유지 및 재연결 시도
- **z-index 최적화**: 대기열 상태창이 다른 UI 요소에 가려지지 않도록 보장

### **⚖️ MMR 기반 매칭**
- **동적 MMR 범위**: 대기 시간에 따라 매칭 범위 확장
- **팀 밸런스**: 양 팀 평균 MMR 차이 최소화
- **역할 분배**: 선호 역할 고려한 팀 구성
- **대기열 우선순위**: 대기 시간 순서 고려

### **🛠️ 개발 도구**
- **시뮬레이션 모드**: 개발 환경에서만 사용 가능한 빠른 매치 테스트
- **실제 서비스 분리**: 프로덕션에서는 실제 사용자만 매칭
- **디버그 로깅**: 상세한 매치메이킹 과정 로그

### **🎨 UI/UX 개선사항**
- **애니메이션 시스템**: 버튼 상태별 시각적 피드백 (로딩, 성공, 실패)
- **대기열 상태창 디자인**: 현대적 그라데이션, 백드롭 블러, 호버 효과
- **크기 최적화**: 대기열 상태창 70% 축소로 레이아웃 개선
- **헤더 클릭**: 대기열 상태창 헤더 전체를 클릭하여 확장/축소
- **CSS 애니메이션**: slideInRight, pulseGlow, shimmer 등 고급 효과

## 🎮 사설 서버 매칭 특징

### **🏟️ 전장 시스템**
- **11개 공식 전장** 지원:
  - 용의 둥지 (Dragon Shire)
  - 저주받은 골짜기 (Cursed Hollow)
  - 공포의 정원 (Garden of Terror)
  - 하늘사원 (Sky Temple)
  - 거미 여왕의 무덤 (Tomb of the Spider Queen)
  - 영원의 전쟁터 (Battlefield of Eternity)
  - 불지옥 신단 (Infernal Shrines)
  - 파멸의 탑 (Towers of Doom)
  - 브락식스 항전 (Braxis Holdout)
  - 볼스카야 공장 (Volskaya Foundry)
  - 알터랙 고개 (Alterac Pass)
- **3열 그리드 레이아웃**: 전장 목록을 깔끔하게 표시
- **랜덤 전장 선택**: 매치 생성 시 자동으로 전장 선택

### **📊 통계 및 분석**
- **개인 성과 지표**: KDA, 딜량, 힐량, 경험치 기여도
- **팀 밸런스 분석**: 매치 후 팀 구성 평가
- **MMR 변동 추적**: 경기 결과에 따른 MMR 변화
- **승률 및 랭킹**: 시즌별 성과 추적
- **티어 시스템**: 브론즈부터 그랜드마스터까지 7단계 티어

### **🔧 관리 도구**
- **매치 모니터링**: 실시간 경기 진행 상황
- **사용자 관리**: 계정 상태 및 제재 관리
- **데이터 분석**: 플랫폼 사용 통계
- **시스템 상태**: 서버 성능 및 오류 모니터링
- **Graceful Shutdown**: 서버 종료 시 안전한 정리 작업

## 📁 프로젝트 구조

```
hotstinder/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   │   ├── queue/      # 대기열 관련 컴포넌트
│   │   │   │   ├── QueueStatus.js      # 전역 대기열 상태창
│   │   │   │   └── QueueTimer.js       # 대기열 타이머
│   │   │   ├── match/      # 매치 관련 컴포넌트
│   │   │   └── common/     # 공통 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   │   ├── FindMatchPage.js        # 매치메이킹 페이지
│   │   │   ├── ProfileSetupPage.js     # 프로필 설정 페이지
│   │   │   └── LeaderboardPage.js      # 리더보드 페이지
│   │   ├── stores/        # Zustand 상태 관리
│   │   │   ├── authStore.js            # 인증 상태 관리
│   │   │   └── queueStore.js           # 대기열 상태 관리
│   │   ├── services/      # API 서비스
│   │   └── utils/         # 유틸리티 함수
├── server/                # Node.js 개발 서버
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   │   ├── auth.routes.js          # 인증 관련 라우트
│   │   │   ├── matchmaking.routes.js   # 매치메이킹 라우트
│   │   │   └── admin.routes.js         # 관리자 라우트
│   │   ├── models/        # Sequelize 모델
│   │   ├── services/      # 비즈니스 로직
│   │   └── middleware/    # 미들웨어
├── api/                   # Vercel 서버리스 함수
│   ├── auth/             # 인증 API
│   ├── matchmaking.js    # 매치메이킹 API
│   ├── users.js          # 사용자 관리 API
│   └── matches.js        # 매치 관리 API
└── docker-compose.db-only.yml # 개발용 DB
```

## 🔧 개발 가이드

### **매치메이킹 테스트**
```bash
# 개발용 시뮬레이션 매치 생성
POST /api/matchmaking/simulate

# 실제 대기열 참가
POST /api/matchmaking/join

# 대기열 상태 확인
GET /api/matchmaking/status

# 대기열 나가기
DELETE /api/matchmaking/leave
```

### **환경별 설정**
- **개발 환경**: 시뮬레이션 모드 활성화, 상세 로깅
- **프로덕션 환경**: 실제 매칭만 허용, 최적화된 성능

### **데이터베이스 관리**
```bash
# 개발용 PostgreSQL 시작
docker-compose -f docker-compose.db-only.yml up -d

# 데이터베이스 초기화 (주의: 모든 데이터 삭제)
npm run db:reset

# 마이그레이션 실행
npm run db:migrate
```

### **프로필 설정 시스템**
- **선호 역할**: 7개 역할 중 다중 선택 가능
- **이전 티어**: 브론즈부터 그랜드마스터까지 선택
- **자동 저장**: 설정 변경 시 자동으로 서버에 저장
- **상태 복원**: 페이지 재방문 시 기존 설정값 자동 로드

## 🎯 최근 주요 업데이트 (2025-01-02)

### **1. 대기열 시스템 완전 개선**
- **버튼 클릭 문제 해결**: z-index 최적화로 모든 버튼이 정상 작동
- **대기열 나가기 기능 개선**: 폴링 즉시 중지 및 상태 정리
- **상태 복원 로직**: 페이지 이동 후 대기열 상태 완벽 복원
- **타이밍 보호**: recentQueueJoinTime 시스템으로 중복 처리 방지

### **2. UI/UX 대폭 개선**
- **애니메이션 시스템**: 버튼별 상태 애니메이션 (로딩, 성공, 실패)
- **대기열 상태창 디자인**: 현대적 그라데이션, 백드롭 블러, 호버 효과
- **크기 최적화**: 대기열 상태창 70% 축소로 레이아웃 개선
- **헤더 클릭**: 대기열 상태창 헤더 전체를 클릭하여 확장/축소
- **CSS 애니메이션**: slideInRight, pulseGlow, shimmer 등 고급 효과

### **3. 전장 시스템 개선**
- **전장 로테이션 → 전장 목록**: 11개 Heroes of the Storm 전장으로 확장
- **3열 그리드 레이아웃**: 깔끔한 전장 목록 표시
- **랜덤 선택**: 매치 생성 시 전장 자동 선택

### **4. 프로필 설정 시스템**
- **선호 역할 개선**: 7개 역할로 확장, 설명 텍스트 제거
- **설정값 저장 문제 해결**: 서버 API 개선으로 설정값 완벽 저장
- **상태 복원**: 프로필 재방문 시 기존 설정값 자동 로드
- **티어 시스템**: MMR 옆 티어 배지 표시

### **5. 시스템 안정성**
- **서버 시작/종료 정리**: Graceful shutdown으로 안전한 서버 종료
- **에러 처리 개선**: 429 에러 등 네트워크 오류 처리 강화
- **성능 최적화**: 불필요한 폴링 및 이벤트 리스너 정리
- **타이밍 최적화**: 애니메이션 및 상태 변경 타이밍 개선

## 🤝 기여하기

1. **Fork** 저장소
2. **Feature 브랜치** 생성 (`git checkout -b feature/amazing-feature`)
3. **변경사항 커밋** (`git commit -m 'Add amazing feature'`)
4. **브랜치에 Push** (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- **Blizzard Entertainment** - Heroes of the Storm 게임 제공
- **Heroes Profile** - 리플레이 데이터 API 지원
- **커뮤니티 기여자들** - 피드백 및 개선 제안

---

**⚡ HotsTinder로 더 나은 Heroes of the Storm 경험을 만들어보세요!**

### 🔥 주요 특징
- **완벽한 대기열 시스템**: 실시간 상태 동기화 및 페이지 이동 후 복원
- **고급 애니메이션**: 버튼 상태별 시각적 피드백 시스템
- **현대적 UI**: 그라데이션, 백드롭 블러, 호버 효과
- **안정적인 매치메이킹**: MMR 기반 균형 잡힌 팀 매칭
- **완전한 프로필 시스템**: 선호 역할 및 티어 설정
