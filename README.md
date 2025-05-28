# 🔥 HotsTinder

Heroes of the Storm 매치메이킹 웹 애플리케이션

## 🚀 **배포된 서비스**

**🌐 라이브 서비스**: https://hotstinder.vercel.app

## 📋 **주요 기능**

- 🎮 **배틀넷 인증**: Battle.net 계정으로 간편 로그인
- 🎯 **스마트 매칭**: 실력 기반 자동 매치메이킹
- 👥 **팀 밸런싱**: 균형잡힌 팀 구성
- 📊 **통계 분석**: 개인/팀 성과 분석
- 🏆 **리더보드**: 실시간 랭킹 시스템
- 📱 **반응형 UI**: 모든 디바이스 지원

## 🛠️ **기술 스택**

### **Frontend**
- React 18
- React Router v6
- Tailwind CSS
- Zustand (상태 관리)

### **Backend**
- Node.js + Express
- Passport.js (Battle.net OAuth)
- JWT 인증
- NeDB / MongoDB

### **배포**
- Vercel (Serverless Functions)
- Battle.net Developer API

## 🔧 **로컬 개발 환경 설정**

### **1. 저장소 클론**
```bash
git clone https://github.com/jominki354/hotstinder.git
cd hotstinder
```

### **2. 의존성 설치**
```bash
npm run install:all
```

### **3. 환경변수 설정**

**클라이언트 (.env)**
```env
REACT_APP_API_URL=http://localhost:5000
```

**서버 (.env)**
```env
# Battle.net OAuth
BNET_CLIENT_ID=your_client_id
BNET_CLIENT_SECRET=your_client_secret
BNET_CALLBACK_URL=http://localhost:5000/api/auth/bnet/callback
BNET_REGION=kr

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 세션
SESSION_SECRET=your_session_secret

# 프론트엔드
FRONTEND_URL=http://localhost:3000

# 데이터베이스 (선택)
USE_MONGODB=false
MONGODB_URI=mongodb://localhost:27017/hotstinder

# 기타
NODE_ENV=development
LOG_LEVEL=info
```

### **4. Battle.net Developer 설정**

1. https://develop.battle.net/access/clients 접속
2. 새 클라이언트 생성
3. Redirect URIs 설정:
   - `http://localhost:5000/api/auth/bnet/callback` (개발용)
   - `https://hotstinder.vercel.app/api/auth/bnet/callback` (프로덕션용)

### **5. 개발 서버 실행**
```bash
npm run dev
```

- 클라이언트: http://localhost:3000
- 서버: http://localhost:5000

## 📦 **배포**

### **Vercel 배포**

1. **환경변수 설정** (Vercel Dashboard)
```env
REACT_APP_API_URL=https://hotstinder.vercel.app
BNET_CLIENT_ID=your_client_id
BNET_CLIENT_SECRET=your_client_secret
BNET_CALLBACK_URL=https://hotstinder.vercel.app/api/auth/bnet/callback
BNET_REGION=kr
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
FRONTEND_URL=https://hotstinder.vercel.app
NODE_ENV=production
```

2. **자동 배포**
```bash
git push origin main
```

## 🏗️ **프로젝트 구조**

```
hotstinder/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── stores/        # Zustand 스토어
│   │   └── utils/         # 유틸리티 함수
│   └── public/
├── server/                # Express 서버 (로컬 개발용)
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── models/        # 데이터 모델
│   │   ├── middleware/    # 미들웨어
│   │   └── utils/         # 서버 유틸리티
│   └── data/              # NeDB 데이터 파일
├── api/                   # Vercel Serverless Functions
│   ├── index.js          # 메인 API
│   └── auth/             # 인증 관련 API
└── scripts/              # 유틸리티 스크립트
```

## 🔐 **보안**

- JWT 토큰 기반 인증
- HTTPS 강제 (프로덕션)
- CORS 설정
- 환경변수로 민감 정보 관리
- Battle.net OAuth 2.0

## 🤝 **기여하기**

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 **라이선스**

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 📞 **문의**

프로젝트 관련 문의: [GitHub Issues](https://github.com/jominki354/hotstinder/issues)
