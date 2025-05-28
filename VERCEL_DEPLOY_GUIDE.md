# 🚀 HOTS Tinder Vercel 배포 가이드

## ✅ 현재 상태
- ✅ **프론트엔드**: React 18 + Tailwind CSS
- ✅ **백엔드**: Node.js + Express (Serverless Functions)
- ✅ **데이터베이스**: MongoDB Atlas
- ✅ **인증**: Passport.js + JWT
- ✅ **빌드 설정**: 완료
- ✅ **API 라우팅**: 완료

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

## 🏗️ 프로젝트 구조

```
hotstinder/
├── api/
│   └── index.js          # Vercel Serverless Functions 엔트리포인트
├── client/
│   ├── build/            # React 빌드 결과물
│   ├── src/              # React 소스 코드
│   └── package.json      # 클라이언트 의존성
├── server/
│   └── src/              # Express 서버 코드
├── vercel.json           # Vercel 설정
└── package.json          # 루트 의존성
```

## 🔄 API 라우팅

### 프론트엔드 (React SPA)
- **모든 페이지**: `https://hotstinder.vercel.app/*`
- React Router가 클라이언트 사이드 라우팅 처리

### 백엔드 (Serverless Functions)
- **API 엔드포인트**: `https://hotstinder.vercel.app/api/*`
- Express 서버가 모든 API 요청 처리

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

### 3. 데이터베이스 연결 테스트
- ✅ MongoDB Atlas 연결 확인
- ✅ 사용자 데이터 로드 확인
- ✅ 매치 데이터 로드 확인

## 🐛 문제 해결

### 404 NOT_FOUND 오류
1. **환경 변수 확인**: 모든 환경 변수가 올바르게 설정되었는지 확인
2. **재배포**: 캐시 없이 완전 재배포 실행
3. **로그 확인**: Vercel 대시보드에서 Function Logs 확인

### API 호출 실패
1. **CORS 설정**: `FRONTEND_URL` 환경 변수 확인
2. **MongoDB 연결**: `MONGODB_URI` 비밀번호 확인
3. **네트워크**: 브라우저 개발자 도구에서 네트워크 탭 확인

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

모든 단계를 완료하면 HOTS Tinder가 `https://hotstinder.vercel.app`에서 완전히 작동합니다!

**주요 기능:**
- ✅ 배틀넷 로그인
- ✅ 매치메이킹 시스템
- ✅ 리더보드
- ✅ 관리자 패널
- ✅ 리플레이 분석 