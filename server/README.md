# HOTS 매치메이킹 서버

히어로즈 오브 더 스톰 매치메이킹 서비스를 위한 백엔드 서버입니다.

## 설치 방법

```bash
npm install
```

## MongoDB 설정

이 서버는 기본적으로 MongoDB를 사용합니다. MongoDB를 설치하고 실행해야 합니다.

### MongoDB 설치 (Windows)

1. [MongoDB Community Server](https://www.mongodb.com/try/download/community)에서 다운로드합니다.
2. 설치 프로그램을 실행하고 "Complete" 설치를 선택합니다.
3. "Install MongoDB as a Service"를 선택하고 설치를 완료합니다.

### MongoDB 설치 (macOS)

```bash
brew tap mongodb/brew
brew install mongodb-community
```

### MongoDB 설치 (Linux - Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y mongodb
```

### MongoDB 실행 확인

MongoDB가 설치되고 실행 중인지 확인하려면:

```bash
# Windows에서 MongoDB 서비스 상태 확인
sc query MongoDB

# macOS에서 MongoDB 서비스 시작
brew services start mongodb-community

# Linux에서 MongoDB 서비스 상태 확인
sudo systemctl status mongodb
```

## 환경 변수 설정

`.env` 파일을 만들어 다음 환경 변수를 설정합니다:

```bash
PORT=5000
SESSION_SECRET=hots-matchmaking-secret
BNET_CLIENT_ID=YOUR_BNET_CLIENT_ID
BNET_CLIENT_SECRET=YOUR_BNET_CLIENT_SECRET
BNET_CALLBACK_URL=http://localhost:5000/api/auth/bnet/callback
BNET_REGION=kr
MONGODB_URI=mongodb://localhost:27017/hots-matchmaking
```

## 서버 실행

```bash
npm start
```

개발 모드로 실행:

```bash
npm run dev
```

## API 문서

API 문서는 [여기](https://github.com/example/hots-matchmaking/wiki/API-Documentation)에서 확인할 수 있습니다. 