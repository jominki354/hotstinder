# HOTS Tinder - Heroes of the Storm 매치메이킹 웹 애플리케이션

Heroes of the Storm 플레이어들을 위한 매치메이킹 및 리플레이 분석 웹 애플리케이션입니다.

## 🎮 주요 기능

- **매치메이킹 시스템**: 플레이어들 간의 매치 생성 및 관리
- **리플레이 분석**: .StormReplay 파일 업로드 및 상세 분석
- **실시간 통계**: 게임 결과, 플레이어 성과, KDA 등 상세 통계
- **팀 분석**: 블루팀/레드팀별 성과 비교 및 분석
- **사용자 관리**: 회원가입, 로그인, 프로필 관리
- **관리자 기능**: 사용자 관리, 매치 관리, 시스템 모니터링

## 🛠 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스
- **Tailwind CSS** - 스타일링 및 반응형 디자인
- **Zustand** - 상태 관리
- **Axios** - HTTP 클라이언트
- **React Router DOM** - 라우팅
- **React Toastify** - 알림 시스템
- **Socket.io Client** - 실시간 통신

### Backend
- **Node.js** - 서버 런타임
- **Express.js** - 웹 프레임워크
- **MongoDB** - 주 데이터베이스
- **NeDB** - 로컬 데이터베이스 (개발용)
- **Mongoose** - MongoDB ODM
- **JWT** - 인증 시스템
- **Multer** - 파일 업로드
- **Socket.io** - 실시간 통신
- **Winston** - 로깅 시스템

### 리플레이 분석
- **hots-parser** - Heroes of the Storm 리플레이 파싱 (Node.js)
- 실시간 게임 데이터 추출 및 분석
- 플레이어 통계, 팀 성과, 게임 결과 분석

## 📋 시스템 요구사항

- **Node.js** 16.0.0 이상 (권장: 18.x 이상)
- **MongoDB** 4.4 이상 (선택사항 - NeDB로 대체 가능)
- **npm** 8.0.0 이상 또는 **yarn** 1.22.0 이상
- **운영체제**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+

## 🚀 설치 및 실행 가이드

### 1. 사전 준비

#### Node.js 설치 확인
```bash
node --version  # v16.0.0 이상이어야 함
npm --version   # 8.0.0 이상이어야 함
```

#### MongoDB 설치 (선택사항)
- **Windows**: [MongoDB Community Server](https://www.mongodb.com/try/download/community) 다운로드
- **macOS**: `brew install mongodb-community`
- **Ubuntu**: `sudo apt install mongodb`

> **참고**: MongoDB 없이도 NeDB를 사용하여 로컬에서 실행 가능합니다.

### 2. 저장소 클론 및 기본 설정

```bash
# 저장소 클론
git clone <repository-url>
cd hotstinder

# 프로젝트 구조 확인
ls -la
# 출력: client/, server/, package.json, README.md 등
```

### 3. 의존성 설치

#### 방법 1: 자동 설치 (권장)
```bash
# 루트 디렉토리에서 모든 의존성 한 번에 설치
npm run install:all
```

#### 방법 2: 수동 설치
```bash
# 1. 루트 의존성 설치
npm install

# 2. 서버 의존성 설치
cd server
npm install

# 3. 클라이언트 의존성 설치
cd ../client
npm install

# 4. 루트 디렉토리로 돌아가기
cd ..
```

### 4. 환경 변수 설정

#### 서버 환경 변수 설정
```bash
# server/.env 파일 생성
cd server
cat > .env << EOF
# 서버 설정
PORT=5000
NODE_ENV=development

# 데이터베이스 설정 (MongoDB 사용 시)
MONGODB_URI=mongodb://localhost:27017/hotstinder
USE_MONGODB=true

# NeDB 사용 시 (MongoDB 없이 로컬 실행)
# USE_MONGODB=false

# JWT 보안 키 (실제 운영 시 복잡한 키로 변경)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 세션 보안 키
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# CORS 설정
FRONTEND_URL=http://localhost:3000

# 파일 업로드 설정
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# 로그 레벨
LOG_LEVEL=debug
EOF
```

#### 클라이언트 환경 변수 설정
```bash
# client/.env 파일 생성
cd ../client
cat > .env << EOF
# API 서버 URL
REACT_APP_API_URL=http://localhost:5000

# 개발 모드 설정
REACT_APP_ENV=development

# 소켓 연결 URL
REACT_APP_SOCKET_URL=http://localhost:5000
EOF

cd ..
```

### 5. 데이터베이스 설정

#### MongoDB 사용 시
```bash
# MongoDB 서비스 시작
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# 또는
brew services start mongodb-community

# MongoDB 연결 테스트
mongosh --eval "db.adminCommand('ismaster')"
```

#### NeDB 사용 시 (MongoDB 없이)
```bash
# server/.env 파일에서 USE_MONGODB=false로 설정
# 자동으로 server/data/ 디렉토리에 로컬 DB 파일 생성됨
```

### 6. 애플리케이션 실행

#### 방법 1: 통합 실행 (권장)
```bash
# 루트 디렉토리에서 서버와 클라이언트 동시 실행
npm start
```

#### 방법 2: 개별 실행
```bash
# 터미널 1: 서버 실행
cd server
npm run dev

# 터미널 2: 클라이언트 실행 (새 터미널)
cd client
npm start
```

### 7. 접속 확인

- **클라이언트**: http://localhost:3000
- **서버 API**: http://localhost:5000
- **관리자 페이지**: http://localhost:3000/admin-login

#### 기본 관리자 계정
- **ID**: `admin`
- **PW**: `1231`

## 📦 주요 의존성 목록

### 서버 의존성 (server/package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",           // 웹 프레임워크
    "mongoose": "^8.0.3",           // MongoDB ODM
    "nedb": "^1.8.0",               // 로컬 데이터베이스
    "hots-parser": "^7.55.7",       // 리플레이 파싱
    "jsonwebtoken": "^9.0.2",       // JWT 인증
    "bcryptjs": "^2.4.3",           // 비밀번호 해싱
    "multer": "^2.0.0",             // 파일 업로드
    "socket.io": "^4.7.2",          // 실시간 통신
    "winston": "^3.11.0",           // 로깅
    "cors": "^2.8.5",               // CORS 처리
    "helmet": "^7.1.0",             // 보안 헤더
    "dotenv": "^16.3.1"             // 환경 변수
  },
  "devDependencies": {
    "nodemon": "^3.0.1",           // 개발 서버
    "jest": "^29.7.0",             // 테스트 프레임워크
    "supertest": "^6.3.3"          // API 테스트
  }
}
```

### 클라이언트 의존성 (client/package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",             // React 프레임워크
    "react-dom": "^18.2.0",         // React DOM
    "react-router-dom": "^6.30.0",  // 라우팅
    "zustand": "^4.5.7",            // 상태 관리
    "axios": "^1.9.0",              // HTTP 클라이언트
    "react-toastify": "^9.1.3",     // 알림 시스템
    "socket.io-client": "^4.7.2",   // 실시간 통신
    "jwt-decode": "^4.0.0",         // JWT 디코딩
    "@heroicons/react": "^2.0.18"   // 아이콘
  },
  "devDependencies": {
    "tailwindcss": "^3.3.6",       // CSS 프레임워크
    "autoprefixer": "^10.4.16",    // CSS 후처리
    "postcss": "^8.4.32"           // CSS 처리
  }
}
```

### 루트 의존성 (package.json)
```json
{
  "devDependencies": {
    "concurrently": "^8.2.2"       // 동시 스크립트 실행
  }
}
```

## 🔧 개발 스크립트

### 루트 디렉토리
```bash
npm run install:all    # 모든 의존성 설치
npm run setup         # 데이터 디렉토리 생성
npm start             # 서버 + 클라이언트 동시 실행
npm run dev           # 개발 모드 실행
npm run server        # 서버만 실행
npm run client        # 클라이언트만 실행
```

### 서버 디렉토리
```bash
npm start             # 프로덕션 모드 실행
npm run dev           # 개발 모드 (nodemon)
npm test              # 테스트 실행
npm run setup:mongodb # MongoDB 초기 설정
```

### 클라이언트 디렉토리
```bash
npm start             # 개발 서버 실행
npm run build         # 프로덕션 빌드
npm test              # 테스트 실행
npm run eject         # React 설정 추출 (주의!)
```

## 🐛 문제 해결

### 설치 관련 문제

#### Node.js 버전 문제
```bash
# Node.js 버전 확인
node --version

# 버전이 낮은 경우 업데이트
# Windows: nodejs.org에서 최신 버전 다운로드
# macOS: brew upgrade node
# Ubuntu: sudo apt update && sudo apt upgrade nodejs
```

#### npm 권한 문제 (macOS/Linux)
```bash
# npm 글로벌 디렉토리 권한 설정
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

#### 의존성 설치 실패
```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 또는 yarn 사용
yarn install
```

### 실행 관련 문제

#### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# macOS/Linux
lsof -ti:3000
lsof -ti:5000

# 프로세스 종료
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

#### MongoDB 연결 실패
```bash
# MongoDB 서비스 상태 확인
# Windows
sc query MongoDB

# macOS/Linux
sudo systemctl status mongod

# MongoDB 로그 확인
# Windows: C:\Program Files\MongoDB\Server\6.0\log\mongod.log
# macOS/Linux: /var/log/mongodb/mongod.log
```

#### 환경 변수 문제
```bash
# .env 파일 존재 확인
ls -la server/.env
ls -la client/.env

# 환경 변수 로드 확인 (서버)
cd server
node -e "require('dotenv').config(); console.log(process.env.PORT)"
```

### 리플레이 분석 문제

#### hots-parser 설치 실패
```bash
# Python 빌드 도구 설치 (Windows)
npm install --global windows-build-tools

# 또는 Visual Studio Build Tools 설치
# https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

# macOS Xcode Command Line Tools
xcode-select --install

# Ubuntu 빌드 도구
sudo apt-get install build-essential
```

#### 리플레이 파일 업로드 실패
```bash
# uploads 디렉토리 권한 확인
ls -la server/uploads/

# 권한 설정 (macOS/Linux)
chmod 755 server/uploads/
```

## 📁 프로젝트 구조

```
hotstinder/
├── package.json                 # 루트 패키지 설정
├── README.md                   # 프로젝트 문서
├── .gitignore                  # Git 무시 파일
│
├── client/                     # React 클라이언트
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/         # 재사용 컴포넌트
│   │   │   ├── common/         # 공통 컴포넌트
│   │   │   ├── queue/          # 대기열 컴포넌트
│   │   │   └── layout/         # 레이아웃 컴포넌트
│   │   ├── pages/              # 페이지 컴포넌트
│   │   │   ├── HomePage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── FindMatchPage.js
│   │   │   ├── RecentGamesPage.js
│   │   │   ├── ProfileSetupPage.js
│   │   │   └── AdminPage.js
│   │   ├── stores/             # Zustand 상태 관리
│   │   │   └── authStore.js
│   │   ├── utils/              # 유틸리티 함수
│   │   ├── App.js              # 메인 앱 컴포넌트
│   │   └── index.js            # 엔트리 포인트
│   ├── package.json            # 클라이언트 의존성
│   ├── tailwind.config.js      # Tailwind 설정
│   └── .env                    # 클라이언트 환경 변수
│
├── server/                     # Express 서버
│   ├── src/
│   │   ├── controllers/        # 컨트롤러
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── match.controller.js
│   │   ├── models/             # 데이터 모델
│   │   │   ├── User.js         # MongoDB 사용자 모델
│   │   │   ├── Match.js        # MongoDB 매치 모델
│   │   │   ├── NeDBUser.js     # NeDB 사용자 모델
│   │   │   └── NeDBMatch.js    # NeDB 매치 모델
│   │   ├── routes/             # API 라우트
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── match.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── matchmaking.routes.js
│   │   ├── utils/              # 유틸리티
│   │   │   ├── logger.js       # 로깅 시스템
│   │   │   └── replayParser.js # 리플레이 파싱
│   │   ├── db/                 # 데이터베이스 설정
│   │   │   ├── mongodb.js
│   │   │   └── nedb.js
│   │   └── index.js            # 서버 엔트리 포인트
│   ├── data/                   # NeDB 데이터 파일
│   ├── uploads/                # 업로드된 파일
│   ├── logs/                   # 로그 파일
│   ├── package.json            # 서버 의존성
│   └── .env                    # 서버 환경 변수
│
└── node_modules/               # 루트 의존성
```

## 🎯 리플레이 분석 기능

### 지원하는 데이터
- ✅ **기본 게임 정보**: 맵, 게임 모드, 게임 시간, 승리 팀
- ✅ **플레이어 정보**: 이름, 영웅, 팀 소속, 배틀태그
- ✅ **팀 구성**: 블루팀/레드팀 플레이어 목록
- ✅ **게임 메타데이터**: 파일 크기, 게임 버전, 분석 시간

### 통계 데이터 (hots-parser 지원 범위 내)
- ✅ **KDA 통계**: 킬, 데스, 어시스트
- ✅ **데미지 통계**: 영웅 데미지, 공성 데미지
- ✅ **힐링 통계**: 힐링량, 받은 데미지
- ✅ **경험치 기여도**: 팀 경험치 기여도
- ✅ **기타 통계**: 미니언 처치, 구조물 파괴 등

### 시뮬레이션 매치 지원
- ✅ **자동 감지**: 매치 ID 패턴, 플레이어 ID, 파일명으로 시뮬레이션 매치 자동 판별
- ✅ **DB 독립적 처리**: 실제 사용자 DB와 매칭하지 않고 리플레이 데이터 그대로 활용
- ✅ **통계 분리**: 시뮬레이션 매치는 개인 통계에 반영되지 않음
- ✅ **시각적 구분**: 관리자 페이지에서 🎮 아이콘으로 표시

### 사용 방법
1. 관리자 로그인 (admin/1231)
2. 관리자 페이지에서 "리플레이 분석" 섹션으로 이동
3. .StormReplay 파일 선택 및 업로드
4. 분석 결과 확인 (최근 게임 페이지에서 상세 통계 확인 가능)

## 📝 최신 업데이트

### v2.1.0 - 시뮬레이션 매치 지원 강화
- ✅ 시뮬레이션 매치 리플레이 업로드 완전 지원
- ✅ 시뮬레이션 매치 자동 감지 및 DB 독립적 처리
- ✅ 최근 게임에서 시뮬레이션 매치 통계 정상 표시
- ✅ 관리자 페이지에서 시뮬레이션 매치 구분 표시
- ✅ 매치메이킹 시뮬레이션 속도 2배 향상 (0.5초당 1명 증가)

### v2.0.0 - hots-parser 통합
- ✅ Python heroprotocol에서 Node.js hots-parser로 완전 교체
- ✅ 실시간 리플레이 분석 성능 향상
- ✅ 의존성 단순화 (Python 설치 불필요)
- ✅ 안정성 개선 및 오류 처리 강화
- ✅ 클라이언트 UI 안전성 개선 (옵셔널 체이닝 적용)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 GitHub Issues를 통해 문의해주세요.
