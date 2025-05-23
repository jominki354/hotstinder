# HOTS Tinder 서버

Heroes of the Storm 매치메이킹을 위한 웹 애플리케이션의 백엔드 서버입니다.

## 필수 조건

- Node.js 14.x 이상
- MongoDB 4.4 이상 (MongoDB를 사용하는 경우)

## 설치 방법

1. 의존성 패키지 설치:

```bash
npm install
```

2. 환경 변수 설정:
   
`.env` 파일을 프로젝트 루트에 생성하고 다음 내용을 설정합니다:

```
NODE_ENV=development

# MongoDB 설정
USE_MONGODB=true
MONGODB_URI=mongodb://localhost:27017/hotstinder

# 서버 설정
PORT=5000
FRONTEND_URL=http://localhost:3000

# 세션과 인증 설정
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# BattleNet OAuth 설정
BNET_CLIENT_ID=your_bnet_client_id
BNET_CLIENT_SECRET=your_bnet_client_secret
BNET_CALLBACK_URL=http://localhost:5000/api/auth/bnet/callback
```

## MongoDB 설치 및 실행

### Windows에서 MongoDB 설치

1. [MongoDB 다운로드 페이지](https://www.mongodb.com/try/download/community)에서 Windows용 MongoDB Community Server 설치 파일을 다운로드합니다.
2. 다운로드한 설치 파일을 실행하고 지시에 따라 설치합니다.
   - "Complete" 설치 옵션을 선택하면 MongoDB Compass(GUI 도구)도 함께 설치됩니다.
   - "Install MongoDB as a Service"를 체크하면 Windows 서비스로 자동 실행됩니다.
3. 설치 완료 후 자동으로 MongoDB 서비스가 시작됩니다.

### Docker를 사용한 MongoDB 실행 (대안)

Docker가 설치되어 있다면 다음 명령어로 MongoDB를 실행할 수 있습니다:

```bash
docker run --name mongodb -d -p 27017:27017 mongo:latest
```

## 데이터베이스 선택

이 프로젝트는 두 가지 데이터베이스 옵션을 지원합니다:

1. **MongoDB** (권장): 확장성과 안정성이 높은 NoSQL 데이터베이스
2. **NeDB**: 파일 기반 임베디드 데이터베이스 (개발용)

`.env` 파일에서 다음 설정을 통해 사용할 데이터베이스를 선택할 수 있습니다:

```
USE_MONGODB=true  # MongoDB 사용
# 또는
USE_MONGODB=false # NeDB 사용
```

## 서버 실행

개발 모드로 서버를 실행합니다:

```bash
npm run dev
```

프로덕션 모드로 서버를 실행합니다:

```bash
npm start
```

## API 엔드포인트

서버가 실행되면 다음 기본 URL에서 API에 접근할 수 있습니다:
`http://localhost:5000/api/`

주요 엔드포인트:
- `GET /api/users/all` - 모든 사용자 목록 조회
- `GET /api/users/leaderboard` - 리더보드 데이터 조회
- `GET /api/users/:userId` - 특정 사용자 정보 조회
- `PUT /api/users/:userId` - 사용자 정보 업데이트

## 문제 해결

### MongoDB 연결 문제

1. MongoDB 서비스가 실행 중인지 확인합니다:
   - Windows: 서비스 앱에서 "MongoDB" 서비스 상태 확인
   - Docker: `docker ps` 명령어로 컨테이너 실행 상태 확인

2. MongoDB 연결 문자열이 올바른지 확인합니다:
   - 기본 연결 문자열: `mongodb://localhost:27017/hotstinder`

3. MongoDB 포트(27017)가 다른 애플리케이션에 의해 사용 중인지 확인합니다.

### NeDB 파일 권한 문제

Windows에서 NeDB 파일 권한 문제가 발생할 경우:

1. `server/data` 디렉토리에 쓰기 권한이 있는지 확인합니다.
2. 임시 파일(확장자가 `~`로 끝나는 파일)을 수동으로 삭제합니다.
3. `.env` 파일에서 `USE_MONGODB=true`로 설정하여 MongoDB를 사용합니다.

## 라이선스

MIT 