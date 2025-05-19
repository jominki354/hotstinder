# 히어로즈 오브 더 스톰 사설 매칭 서비스

배틀넷 계정 연동을 지원하는 히어로즈 오브 더 스톰 사설 매칭 서비스입니다.

## 주요 기능

- 배틀넷 OAuth를 통한 로그인 및 회원가입
- 사용자 프로필과 게임 통계 연동
- 커스텀 게임 생성 및 참여
- 매칭 시스템을 통한 팀 밸런싱
- 실시간 채팅 및 알림

## 기술 스택

- **프론트엔드**: React, TypeScript, Tailwind CSS
- **백엔드**: Node.js, Express
- **데이터베이스**: MongoDB
- **인증**: Battle.net OAuth

## 설치 및 실행 방법

1. 저장소 클론
```bash
git clone https://github.com/yourusername/hots-custom-matchmaking.git
cd hots-custom-matchmaking
```

2. 의존성 설치
```bash
# 백엔드 의존성 설치
cd server
npm install

# 프론트엔드 의존성 설치
cd ../client
npm install
```

3. 환경변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 정보를 입력합니다.

4. 서버 실행
```bash
# 백엔드 서버 실행
cd server
npm run dev

# 프론트엔드 서버 실행
cd ../client
npm start
```

## 배틀넷 API 연동 설정

이 프로젝트는 배틀넷 API를 사용하기 위해 [Battle.net Developer Portal](https://develop.battle.net/)에서 애플리케이션을 등록해야 합니다.

1. Battle.net Developer Portal에 로그인
2. 새 클라이언트 생성
3. 리디렉션 URL 설정: `http://localhost:3000/auth/callback`
4. 발급받은 클라이언트 ID와 시크릿을 `.env` 파일에 입력

## 라이센스

MIT 