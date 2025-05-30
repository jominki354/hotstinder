# 🚀 HOTS Tinder Vercel 배포 가이드

## ✅ **Vercel 환경 완전 지원**

### 🟢 **모든 핵심 기능 정상 작동**
- **실시간 대기열**: 폴링 기반으로 3초마다 상태 업데이트 (실시간과 거의 동일한 경험)
- **매치메이킹**: 완전한 매치메이킹 시스템 지원
- **상태 관리**: 메모리 캐시 기반 효율적 상태 관리
- **시간 동기화**: 서버-클라이언트 시간 동기화로 정확한 대기 시간 표시

### 🔧 **Vercel 최적화 기술**

#### ✅ **스마트 폴링 시스템**
```javascript
// 효율적인 폴링: 필요할 때만 실행
const pollQueueStatus = useCallback(async () => {
  if (!user || Date.now() - lastPollTime.current < 2000) return;

  // 서버 상태와 클라이언트 상태 동기화
  const response = await axios.get('/api/matchmaking/status');
  // 실시간 업데이트 처리
}, [user, inQueue, matchInProgress]);
```

#### ✅ **메모리 캐시 최적화**
```javascript
// TTL 기반 자동 정리
const cacheService = {
  async set(key, value, ttl = 300) {
    this.cache.set(key, value);
    setTimeout(() => this.cache.delete(key), ttl * 1000);
  }
};
```

#### ✅ **서버 시간 동기화**
```javascript
// 정확한 대기 시간 계산
const serverTimeOffset = serverTimeMs - clientTime;
const adjustedClientTime = Date.now() + serverTimeOffset;
```

## ✅ 현재 상태
- ✅ **프론트엔드**: React 18 + Tailwind CSS
- ✅ **백엔드**: Node.js + Express (Serverless Functions)
- ✅ **데이터베이스**: MongoDB Atlas
- ✅ **인증**: Passport.js + JWT
- ✅ **빌드 설정**: 완료
- ✅ **API 라우팅**: 완료
- ✅ **Vercel 설정**: Functions-only 방식으로 최적화

## 🔧 배포 단계

### 1단계: Vercel 프로젝트 설정
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. "New Project" 클릭
3. GitHub 저장소 `hotstinder` 선택
4. **Framework Preset**: `Other` 선택
5. **Root Directory**: `.` (루트)
6. "Deploy" 클릭

### 2단계: 환경 변수 설정 ⚠️ **매우 중요!**
Vercel 대시보드에서 Settings → Environment Variables로 이동하여 다음 변수들을 **정확히** 추가하세요:

```
NODE_ENV=production
USE_MONGODB=true
MONGODB_URI=mongodb+srv://kooingh354:실제비밀번호@hotstinder.gvbw5hv.mongodb.net/hotstinder?retryWrites=true&w=majority
JWT_SECRET=e837259ce3f39c9bb9b20f68c94d1619c8b6355e96a27e7c31c6e3e21971af36
SESSION_SECRET=efbb9963dca4c6bb4e191c1014aaae0dc71530e65debc80e8e39d56ccfcdc1d1
FRONTEND_URL=https://hotstinder.vercel.app
REACT_APP_API_URL=https://hotstinder.vercel.app
BNET_CLIENT_ID=2555749aa63d40d79055409e12a9b191
BNET_CLIENT_SECRET=3c7ddrNaG7p5mUHK1XziVskdxGoHA21R
BNET_CALLBACK_URL=https://hotstinder.vercel.app/api/auth/bnet/callback
BNET_REGION=kr
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads
LOG_LEVEL=info
```

**⚠️ 중요 사항:**
- `MONGODB_URI`에서 `실제비밀번호` 부분을 실제 MongoDB 비밀번호로 변경하세요
- `REACT_APP_API_URL`은 프론트엔드에서 API 호출할 때 사용됩니다
- 모든 환경 변수는 **Production** 환경에 설정하세요

### 3단계: 재배포
환경 변수 설정 후:
1. Vercel 대시보드에서 "Deployments" 탭으로 이동
2. 최신 배포의 "..." 메뉴 클릭
3. "Redeploy" 선택
4. "Use existing Build Cache" 체크 해제
5. "Redeploy" 클릭

## 🚀 **완전 지원 기능 목록**

### ✅ **모든 기능 정상 작동**
- 🟢 **Battle.net OAuth 로그인** - 완전 지원
- 🟢 **사용자 프로필 관리** - 완전 지원
- 🟢 **실시간 매치메이킹** - 폴링 기반 (3초 간격)
- 🟢 **대기열 관리** - 참가/탈퇴/상태 확인
- 🟢 **시뮬레이션 매치** - 테스트용 매치 생성
- 🟢 **매치 기록 조회** - 완전 지원
- 🟢 **리더보드** - 완전 지원
- 🟢 **관리자 패널** - 완전 지원
- 🟢 **대기열 상태창** - 전역 표시, 최소화/확장
- 🟢 **서버 시간 동기화** - 정확한 대기 시간

### 🎯 **성능 특징**
- **응답성**: 3초 이내 상태 업데이트
- **정확성**: 서버 시간 동기화로 정확한 시간 표시
- **효율성**: 스마트 폴링으로 불필요한 요청 최소화
- **안정성**: 에러 처리 및 자동 복구

## 🏗️ 프로젝트 구조

```
hotstinder/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── stores/        # Zustand 상태 관리
│   │   └── utils/         # 유틸리티 함수
├── server/                # Node.js 백엔드 (로컬 개발용)
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── models/        # Sequelize 모델
│   │   ├── utils/         # 백엔드 유틸리티
│   │   └── middleware/    # 미들웨어
├── api/                   # Vercel 서버리스 함수
└── prisma/               # 데이터베이스 스키마
```

## 🔄 Vercel 설정 최적화

### Functions-Only 방식 사용
Vercel 문서에 따라 `builds`와 `functions`의 충돌을 피하기 위해 **Functions-only** 방식을 사용합니다:

```json
{
  "version": 2,
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "client/build",
  "functions": {
    "api/index.js": { "maxDuration": 30 },
    "api/matchmaking.js": { "maxDuration": 30 },
    "api/users.js": { "maxDuration": 30 },
    "api/matches.js": { "maxDuration": 30 }
  },
  "rewrites": [
    { "source": "/api/matchmaking/(.*)", "destination": "/api/matchmaking.js" },
    { "source": "/api/users/(.*)", "destination": "/api/users.js" },
    { "source": "/api/matches/(.*)", "destination": "/api/matches.js" },
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 주요 개선사항
- ✅ **충돌 해결**: `builds` 제거하고 `functions`만 사용
- ✅ **런타임 최적화**: 기본 Node.js 런타임 사용 (자동 최신 버전)
- ✅ **성능**: `rewrites` 사용으로 더 나은 라우팅
- ✅ **호환성**: Vercel 권장사항 완전 준수

## 🔄 API 라우팅

### 프론트엔드 (React SPA)
- **모든 페이지**: `https://hotstinder.vercel.app/*`
- React Router가 클라이언트 사이드 라우팅 처리

### 백엔드 (Serverless Functions)
- **API 엔드포인트**: `https://hotstinder.vercel.app/api/*`
- Express 서버가 모든 API 요청 처리

### 매치메이킹 API 엔드포인트
- **대기열 참가**: `POST /api/matchmaking/join`
- **대기열 탈퇴**: `POST /api/matchmaking/leave`
- **상태 확인**: `GET /api/matchmaking/status`
- **시뮬레이션**: `POST /api/matchmaking/simulate`
- **최근 게임**: `GET /api/matchmaking/recent-games`

## 🧪 테스트 방법

배포 완료 후 다음을 확인하세요:

### 1. 프론트엔드 테스트
- ✅ 메인 페이지 로드: `https://hotstinder.vercel.app`
- ✅ 로그인 페이지: `https://hotstinder.vercel.app/login`
- ✅ 대시보드: `https://hotstinder.vercel.app/dashboard`

### 2. 백엔드 API 테스트
- ✅ API 상태: `https://hotstinder.vercel.app/api`
- ✅ 사용자 목록: `https://hotstinder.vercel.app/api/users/leaderboard`
- ✅ 인증 상태: `https://hotstinder.vercel.app/api/auth/me`

### 3. 매치메이킹 테스트
- ✅ 대기열 참가: `https://hotstinder.vercel.app/api/matchmaking/join`
- ✅ 대기열 상태: `https://hotstinder.vercel.app/api/matchmaking/status`
- ✅ 대기열 탈퇴: `https://hotstinder.vercel.app/api/matchmaking/leave`
- ✅ 시뮬레이션: `https://hotstinder.vercel.app/api/matchmaking/simulate`

### 4. 데이터베이스 연결 테스트
- ✅ MongoDB Atlas 연결 확인
- ✅ 사용자 데이터 로드 확인
- ✅ 매치 데이터 로드 확인

## 🐛 문제 해결

### 404 NOT_FOUND 오류
1. **환경 변수 확인**: 모든 환경 변수가 올바르게 설정되었는지 확인
2. **재배포**: 캐시 없이 완전 재배포 실행
3. **로그 확인**: Vercel 대시보드에서 Function Logs 확인

### "Conflicting functions and builds configuration" 오류
- ✅ **해결됨**: `builds` 제거하고 `functions`만 사용
- ✅ **Vercel 권장사항**: Functions 방식이 더 많은 기능 지원

### API 호출 실패
1. **CORS 설정**: `FRONTEND_URL` 환경 변수 확인
2. **MongoDB 연결**: `MONGODB_URI` 비밀번호 확인
3. **네트워크**: 브라우저 개발자 도구에서 네트워크 탭 확인

### 폴링 관련 문제
1. **폴링 확인**: 브라우저 네트워크 탭에서 3초마다 API 호출 확인
2. **상태 동기화**: 서버와 클라이언트 상태 일치 확인
3. **시간 동기화**: 서버 시간과 클라이언트 시간 차이 확인

### 빌드 실패
1. **의존성**: `package.json` 파일들 확인
2. **환경 변수**: 빌드 시 필요한 환경 변수 확인
3. **로그**: Vercel 빌드 로그에서 오류 메시지 확인

## 📞 지원

문제가 발생하면:
1. Vercel Function Logs 확인
2. 브라우저 개발자 도구 Console 확인
3. MongoDB Atlas 연결 상태 확인
4. 환경 변수 설정 재확인

## 🎉 배포 완료!

모든 단계를 완료하면 HOTS Tinder가 `https://hotstinder.vercel.app`에서 **완전히** 작동합니다!

**✅ 완전 지원 기능:**
- 🟢 **Battle.net OAuth 로그인**
- 🟢 **실시간 매치메이킹** (폴링 기반)
- 🟢 **대기열 관리** (참가/탈퇴/상태)
- 🟢 **시뮬레이션 매치**
- 🟢 **리더보드**
- 🟢 **관리자 패널**
- 🟢 **리플레이 분석**
- 🟢 **전역 대기열 상태창**

**🚀 성능 특징:**
- ⚡ **빠른 응답**: 3초 이내 상태 업데이트
- 🎯 **정확한 시간**: 서버 시간 동기화
- 💡 **효율적**: 스마트 폴링으로 최적화
- 🛡️ **안정적**: 에러 처리 및 자동 복구

**🔧 최적화된 Vercel 설정:**
- ✅ Functions-only 방식으로 충돌 방지
- ✅ 기본 Node.js 런타임으로 자동 최신 버전 사용
- ✅ 효율적인 라우팅 구조
- ✅ Vercel 권장사항 완전 준수

## 📋 배포 전 체크리스트

### 1. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

#### 🔐 인증 관련
- `BNET_CLIENT_ID`: Battle.net OAuth 클라이언트 ID
- `BNET_CLIENT_SECRET`: Battle.net OAuth 클라이언트 시크릿
- `BNET_CALLBACK_URL`: `https://your-domain.vercel.app/api/auth/bnet/callback`
- `JWT_SECRET`: JWT 토큰 암호화 키
- `SESSION_SECRET`: 세션 암호화 키

#### 🗄️ 데이터베이스 관련 (MongoDB)
- `USE_MONGODB`: `true`
- `MONGODB_URI`: MongoDB Atlas 연결 URL

#### 🌐 기타 설정
- `NODE_ENV`: `production`
- `FRONTEND_URL`: `https://your-domain.vercel.app`
- `REACT_APP_API_URL`: `https://your-domain.vercel.app`
- `LOG_LEVEL`: `info`

### 2. MongoDB Atlas 설정
1. [MongoDB Atlas](https://cloud.mongodb.com/) 계정 생성
2. 새 클러스터 생성 (무료 티어 사용 가능)
3. 데이터베이스 사용자 생성
4. 네트워크 액세스 설정 (0.0.0.0/0 허용)
5. 연결 문자열 복사하여 `MONGODB_URI`에 설정

### 3. Battle.net OAuth 앱 설정
1. [Battle.net Developer Portal](https://develop.battle.net/)에서 새 OAuth 앱 생성
2. **Redirect URI**: `https://your-domain.vercel.app/api/auth/bnet/callback`
3. 클라이언트 ID와 시크릿을 Vercel 환경 변수에 설정

### 4. 배포 명령어
```bash
# Vercel CLI 설치 (전역)
npm install -g vercel

# 프로젝트 연결 및 배포
vercel

# 환경 변수 동기화
vercel env pull .env.local
```

## 🔧 배포 후 설정

### 1. 데이터베이스 초기화
배포 후 자동으로 MongoDB 컬렉션이 생성됩니다.

### 2. 도메인 설정
1. Vercel 대시보드에서 커스텀 도메인 추가
2. Battle.net OAuth 앱의 Redirect URI 업데이트
3. 환경 변수의 URL들 업데이트

### 3. 모니터링
- Vercel Functions 로그 확인
- MongoDB Atlas 연결 상태 모니터링
- 에러 로그 확인

## 🚨 주의사항

1. **환경 변수 보안**: 민감한 정보는 Vercel 환경 변수로만 관리
2. **데이터베이스 백업**: 정기적인 MongoDB 백업 설정
3. **도메인 변경**: 도메인 변경 시 OAuth 설정도 함께 업데이트
4. **로그 모니터링**: 프로덕션 환경에서 에러 로그 정기 확인

## 📊 성능 최적화

1. **메모리 캐시**: TTL 기반 자동 정리
2. **스마트 폴링**: 필요할 때만 API 호출
3. **서버 시간 동기화**: 정확한 시간 계산
4. **에러 처리**: 자동 복구 및 재시도

## 🔍 트러블슈팅

### 데이터베이스 연결 오류
- 환경 변수 확인
- MongoDB Atlas 서버 상태 확인
- 네트워크 연결 확인

### OAuth 인증 오류
- Redirect URI 정확성 확인
- 클라이언트 ID/Secret 확인
- 도메인 설정 확인

### 빌드 오류
- 의존성 버전 확인
- Node.js 버전 호환성 확인
- 환경 변수 누락 확인

### 폴링 문제
- 네트워크 탭에서 API 호출 확인
- 서버 응답 시간 확인
- 클라이언트 상태 동기화 확인
