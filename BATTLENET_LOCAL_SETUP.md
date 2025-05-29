# 🎮 Battle.net OAuth 로컬 개발 환경 설정

## 🚨 현재 오류
```
OAuth Approval
400
유효하지 않은 승인 유형이거나 콜백 URL이 유효하지 않습니다.
```

## 🔧 해결 방법

### 1단계: Battle.net Developer Console 설정

1. **Battle.net Developer Portal** 접속
   - URL: https://develop.battle.net/access/clients
   - Battle.net 계정으로 로그인

2. **기존 앱 선택**
   - Client ID: `2555749aa63d40d79055409e12a9b191`
   - 앱 이름을 클릭하여 편집 모드로 진입

3. **Redirect URIs 설정**
   - "Edit Client" 버튼 클릭
   - "Redirect URIs" 섹션에서 다음 URL들을 **모두** 추가:
   ```
   http://localhost:5000/api/auth/bnet/callback
   http://localhost:3000/auth/callback
   https://hotstinder.vercel.app/api/auth/bnet/callback
   ```
   - "Save Changes" 클릭

### 2단계: 로컬 환경 변수 수정

`server/.env` 파일을 다음과 같이 수정하세요:

```env
# 개발 환경 설정
NODE_ENV=development

# MongoDB 설정
USE_MONGODB=true
MONGODB_URI=mongodb+srv://kooingh354:674512%40Alsrl@hotstinder.gvbw5hv.mongodb.net/?retryWrites=true&w=majority&appName=hotstinder

# 서버 설정
PORT=5000
FRONTEND_URL=http://localhost:3000

# 세션과 인증 설정
SESSION_SECRET=hotstinder_session_secret
JWT_SECRET=hotstinder_jwt_secret
JWT_EXPIRES_IN=7d

# BattleNet OAuth 설정 (로컬 개발용)
BNET_CLIENT_ID=2555749aa63d40d79055409e12a9b191
BNET_CLIENT_SECRET=3c7ddrNaG7p5mUHK1XziVskdxGoHA21R
BNET_CALLBACK_URL=http://localhost:5000/api/auth/bnet/callback
BNET_REGION=kr

# 기타 설정
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads
LOG_LEVEL=debug
```

### 3단계: 클라이언트 환경 변수 확인

`client/.env` 파일이 다음과 같이 설정되어 있는지 확인:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
REACT_APP_SOCKET_URL=http://localhost:5000
DANGEROUSLY_DISABLE_HOST_CHECK=true
WDS_SOCKET_HOST=localhost
```

### 4단계: 서버 재시작

환경 변수 수정 후:
```bash
# 현재 실행 중인 서버 중지 (Ctrl+C)
npm run dev
```

## ✅ 테스트 방법

1. **서버 시작**: `npm run dev`
2. **브라우저에서 접속**: http://localhost:3000
3. **배틀넷 로그인 테스트**: 로그인 버튼 클릭
4. **콜백 URL 확인**: 로그인 후 올바른 페이지로 리다이렉트되는지 확인

## 🔍 디버깅

### Battle.net Developer Console 확인사항:
- ✅ Client ID가 정확한지 확인
- ✅ Client Secret이 정확한지 확인
- ✅ Redirect URIs에 로컬 URL이 포함되어 있는지 확인
- ✅ 앱이 활성화 상태인지 확인

### 로컬 환경 확인사항:
- ✅ 포트 5000이 사용 중이 아닌지 확인
- ✅ 환경 변수가 올바르게 로드되는지 확인
- ✅ CORS 설정이 올바른지 확인

## 🚨 주의사항

1. **Battle.net Developer Console 변경사항은 즉시 적용됩니다**
2. **환경 변수 변경 후에는 반드시 서버를 재시작해야 합니다**
3. **로컬과 프로덕션 환경의 콜백 URL이 다르므로 둘 다 등록해야 합니다**

## 📞 추가 도움

문제가 계속 발생하면:
1. Battle.net Developer Console에서 앱 상태 확인
2. 브라우저 개발자 도구에서 네트워크 탭 확인
3. 서버 콘솔에서 오류 메시지 확인
