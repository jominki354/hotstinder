# 🔐 Vercel 환경 변수 설정 가이드

## 📋 완전한 환경 변수 목록

다음 환경 변수들을 **Vercel 대시보드**에 설정하세요:

### 🔐 보안 설정 (새로 생성된 안전한 키들)
```
JWT_SECRET=d5af502df8f7a5d4f4f12941db5462a3574afcdc97653b5979fadf8025229da8
SESSION_SECRET=9bc1f3d69a40e194fc22200e4e30e6c9d978b0360616c9de297288cdf1fc19f8
```

### 🎮 Battle.net OAuth 설정 (기존 프로젝트에서 찾은 값들)
```
BNET_CLIENT_ID=2555749aa63d40d79055409e12a9b191
BNET_CLIENT_SECRET=3c7ddrNaG7p5mUHK1XziVskdxGoHA21R
BNET_CALLBACK_URL=https://hotstinder.vercel.app/api/auth/bnet/callback
BNET_REGION=kr
```

### 🌐 URL 설정
```
FRONTEND_URL=https://hotstinder.vercel.app
REACT_APP_API_URL=https://hotstinder.vercel.app
```

### 🗄️ 데이터베이스 설정
```
USE_MONGODB=true
MONGODB_URI=mongodb+srv://kooingh354:674512%40Alsrl@hotstinder.gvbw5hv.mongodb.net/?retryWrites=true&w=majority
```

### ⚙️ 기타 설정
```
NODE_ENV=production
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=50MB
LOG_LEVEL=info
```

## 🚀 Vercel 설정 방법

### 1단계: Vercel 대시보드 접속
1. [vercel.com/dashboard](https://vercel.com/dashboard) 접속
2. **hotstinder 프로젝트** 선택
3. **Settings** 탭 클릭
4. **Environment Variables** 메뉴 선택

### 2단계: 환경 변수 추가
위의 각 변수를 **하나씩** 추가:
- **Name**: 변수명 (예: `JWT_SECRET`)
- **Value**: 해당 값 (예: `d5af502df8f7a5d4f4f12941db5462a3574afcdc97653b5979fadf8025229da8`)
- **Environment**: **Production** 선택
- **Add** 클릭

### 3단계: 재배포
환경 변수 설정 완료 후:
1. **Deployments** 탭으로 이동
2. 최신 배포의 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. **"Use existing Build Cache"** 체크 해제
5. **"Redeploy"** 클릭

## ✅ 테스트 방법

배포 완료 후 다음 URL들을 테스트:

1. **환경 변수 확인**: `https://hotstinder.vercel.app/api/debug/env`
2. **API 상태 확인**: `https://hotstinder.vercel.app/api/health`
3. **배틀넷 로그인**: `https://hotstinder.vercel.app/api/auth/bnet`

## ⚠️ 중요 사항

1. **Battle.net 설정**: 기존 프로젝트에서 이미 설정된 Battle.net OAuth 앱을 사용
2. **콜백 URL**: `https://hotstinder.vercel.app/api/auth/bnet/callback`로 설정되어야 함
3. **MongoDB**: 기존 데이터베이스 연결 정보를 사용
4. **보안**: 새로 생성된 JWT/SESSION 비밀 키는 매우 안전함

## 🔧 문제 해결

### 404 오류가 계속 발생하는 경우:
1. 모든 환경 변수가 정확히 설정되었는지 확인
2. Vercel에서 완전 재배포 실행
3. `/api/debug/env`에서 환경 변수 상태 확인

### Battle.net 로그인 실패:
1. `BNET_CLIENT_ID`와 `BNET_CLIENT_SECRET` 확인
2. `BNET_CALLBACK_URL`이 정확한지 확인
3. Battle.net Developer Console에서 콜백 URL 설정 확인

## 📞 지원

문제가 발생하면:
1. Vercel Function Logs 확인
2. 브라우저 개발자 도구 Console 확인
3. `/api/health` 엔드포인트에서 설정 상태 확인

---

**🎉 설정 완료 후 HOTS Tinder가 정상적으로 작동합니다!** 