# HOTS Tinder

Heroes of the Storm 매치메이킹 서비스를 위한 웹 애플리케이션입니다.

## 프로젝트 구조

- `client/`: React 기반 프론트엔드
- `server/`: Express 기반 백엔드 API 서버

## 필수 조건

- Node.js 14.x 이상
- MongoDB 4.4 이상
- 인터넷 연결 (패키지 설치 및 Battle.net OAuth 인증용)

## 시작하기

### 1. MongoDB 설치

#### Windows에서 MongoDB 설치:

1. [MongoDB 다운로드 페이지](https://www.mongodb.com/try/download/community)에서 Windows용 MongoDB Community Server 설치 파일을 다운로드합니다.
2. 다운로드한 설치 파일을 실행하고 지시에 따라 설치합니다.
   - "Complete" 설치 옵션을 선택하면 MongoDB Compass(GUI 도구)도 함께 설치됩니다.
   - "Install MongoDB as a Service"를 체크하면 Windows 서비스로 자동 실행됩니다.
3. 설치 완료 후 자동으로 MongoDB 서비스가 시작됩니다.

#### Docker를 사용한 MongoDB 실행 (대안):

Docker가 설치되어 있다면 다음 명령어로 MongoDB를 실행할 수 있습니다:

```bash
docker run --name mongodb -d -p 27017:27017 mongo:latest
```

### 2. 서버 설정 및 실행

1. 서버 디렉토리로 이동:

```bash
cd server
```

2. 의존성 패키지 설치:

```bash
npm install
```

3. 환경 변수 설정:

`.env` 파일을 생성하거나 수정하여 다음 내용을 설정합니다:

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

4. MongoDB 초기 설정 실행:

```bash
npm run setup:mongodb
```

5. 서버 실행:

```bash
npm run dev
```

서버가 기본적으로 http://localhost:5000 에서 실행됩니다.

### 3. 클라이언트 설정 및 실행

1. 새 터미널 창을 열고 클라이언트 디렉토리로 이동:

```bash
cd client
```

2. 의존성 패키지 설치:

```bash
npm install
```

3. 클라이언트 실행:

```bash
npm start
```

클라이언트가 기본적으로 http://localhost:3000 에서 실행됩니다.

## 주요 기능

- 배틀넷 OAuth 인증
- 유저 프로필 관리
- 실시간 매치메이킹
- 전적 및 MMR 시스템
- 리더보드

## 문제 해결

### MongoDB 연결 문제

1. MongoDB 서비스가 실행 중인지 확인합니다:
   - Windows: 서비스 앱에서 "MongoDB" 서비스 상태 확인
   - Docker: `docker ps` 명령어로 컨테이너 실행 상태 확인

2. MongoDB 연결 문자열이 올바른지 확인합니다:
   - 기본 연결 문자열: `mongodb://localhost:27017/hotstinder`

## 개발자 참고 사항

### 데이터베이스

이 프로젝트는 MongoDB를 데이터베이스로 사용합니다. 개발 및 프로덕션 환경 모두에서 MongoDB가 필요합니다.

### API 엔드포인트

서버가 실행되면 다음 기본 URL에서 API에 접근할 수 있습니다:
`http://localhost:5000/api/`

주요 엔드포인트:
- `GET /api/users/all` - 모든 사용자 목록 조회
- `GET /api/users/leaderboard` - 리더보드 데이터 조회
- `GET /api/users/:userId` - 특정 사용자 정보 조회
- `PUT /api/users/:userId` - 사용자 정보 업데이트

## 라이선스

MIT
